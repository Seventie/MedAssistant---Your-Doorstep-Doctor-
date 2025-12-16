# medical_rag_groq.py
"""
Robust pipeline to query medical knowledge:
- Loads precomputed artifacts (NER, embeddings, FAISS, KG)
- Extracts query entities
- Expands subgraph
- Retrieves top semantic rows
- Composes context
- Calls Groq API to generate answers (instructed to answer factually)
"""

import os, re
from pathlib import Path
import pandas as pd
import numpy as np
import networkx as nx
import spacy
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import joblib

# FAISS optional
USE_FAISS = True
try:
    import faiss
except ImportError:
    USE_FAISS = False

# Groq client
try:
    from groq import Groq
except ImportError:
    Groq = None
    print("[WARN] groq SDK not installed.")

# -------------------------
# CONFIG
# -------------------------
OUT_DIR = Path("kg_rag_artifacts")
DATA_CSV = "drugs_side_effects.csv"

EMBEDDING_FILE = OUT_DIR / "corpus_embeddings.npy"
FAISS_INDEX_FILE = OUT_DIR / "faiss.index"
KG_FILE = OUT_DIR / "medical_kg.graphml"
NER_CSV = OUT_DIR / "ner_entities.csv"
TFIDF_VECTORIZER_FILE = OUT_DIR / "tfidf_vectorizer.npz"

GROQ_MODEL = "gemma2-9b-it"
GROQ_API_KEY = "" # or set directly

EMBEDDER_MODEL = "all-MiniLM-L6-v2"

# -------------------------
# HELPERS
# -------------------------
def clean_text(text: str) -> str:
    if pd.isna(text):
        return ""
    s = str(text)
    s = re.sub(r"[\r\n]+", " ", s)
    s = re.sub(r"[^A-Za-z0-9\s\-,\.;:()/%]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

# -------------------------
# LOAD MODELS & ARTIFACTS
# -------------------------
# SpaCy / scispaCy
try:
    import scispacy
    try:
        nlp = spacy.load("en_core_sci_sm")
    except Exception:
        nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.load("en_core_web_sm")

# Sentence transformer
embedder = SentenceTransformer(EMBEDDER_MODEL)

# Load corpus & embeddings
df = pd.read_csv(DATA_CSV).fillna("")
for col in ["drug_name", "side_effects", "medical_condition"]:
    if f"{col}_clean" not in df.columns:
        df[f"{col}_clean"] = df[col].astype(str).apply(clean_text)

corpus_embeddings = np.load(EMBEDDING_FILE)

# Load FAISS index
if USE_FAISS and FAISS_INDEX_FILE.exists():
    dimension = corpus_embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index = faiss.read_index(str(FAISS_INDEX_FILE))
else:
    index = None
    print("[WARN] FAISS index not loaded. Using brute-force similarity.")

# Load KG
G = nx.read_graphml(KG_FILE)

# -------------------------
# NER + Query helpers
# -------------------------
def run_ner(text):
    doc = nlp(text)
    ents = [(ent.text.strip(), ent.label_) for ent in doc.ents]
    if not ents:
        for chunk in doc.noun_chunks:
            ents.append((chunk.text.strip(), "NOUN_CHUNK"))
        ents = list(dict.fromkeys(ents))
    return ents

def extract_query_entities(symptoms, additional_info):
    tokens = [clean_text(s) for s in symptoms]
    ents = run_ner(additional_info)
    tokens += [clean_text(e) for e,lbl in ents]
    doc = nlp(additional_info)
    for tok in doc:
        if tok.pos_ in {"NOUN","PROPN","ADJ"} and len(tok.text)>2:
            tokens.append(clean_text(tok.text))
    # dedupe
    seen=set(); out=[]
    for t in tokens:
        if t and t not in seen:
            out.append(t); seen.add(t)
    return out

def match_graph_nodes(tokens, max_matches=10):
    matches=[]
    for t in tokens:
        t_low=t.lower()
        cur=[]
        for n,d in G.nodes(data=True):
            if t_low in d.get("label","").lower():
                cur.append(n)
                if len(cur)>=max_matches: break
        if cur: matches.extend(cur)
    return list(dict.fromkeys(matches))

def expand_subgraph(seed_nodes, radius=2):
    if not seed_nodes: return nx.Graph()
    nodes_to_include=set(seed_nodes)
    frontier=set(seed_nodes)
    for _ in range(radius):
        new_frontier=set()
        for n in frontier:
            for nbr in list(G.successors(n))+list(G.predecessors(n)):
                if nbr not in nodes_to_include: new_frontier.add(nbr)
        nodes_to_include.update(new_frontier)
        frontier=new_frontier
    return G.subgraph(nodes_to_include).copy()

def subgraph_to_text(subg, max_triples=60):
    triples=[]
    for u,v,data in subg.edges(data=True):
        rel=data.get("relation","related_to")
        u_lbl=subg.nodes[u].get("label",u)
        v_lbl=subg.nodes[v].get("label",v)
        triples.append(f"{u_lbl} --{rel}--> {v_lbl}")
    return "\n".join(triples[:max_triples])

def semantic_retrieve(text, top_k=5):
    qv = embedder.encode([clean_text(text)], convert_to_numpy=True, normalize_embeddings=True)
    if USE_FAISS and index is not None:
        D,I=index.search(qv.astype("float32"), top_k)
        indices = I[0].tolist()
    else:
        sims=cosine_similarity(qv, corpus_embeddings)[0]
        indices = sims.argsort()[-top_k:][::-1].tolist()
    result = df.iloc[indices].copy()
    for col in ["drug_name","side_effects","medical_condition"]:
        if f"{col}_clean" not in result.columns:
            result[f"{col}_clean"]=result[col].astype(str).apply(clean_text)
    return result

# -------------------------
# Compose context + Groq
# -------------------------
def compose_context_from_query(symptoms, additional_info, top_k_semantic=5, radius=2):
    tokens=extract_query_entities(symptoms, additional_info)
    seed_nodes=match_graph_nodes(tokens)
    if not seed_nodes:
        sem=semantic_retrieve(additional_info or " ".join(symptoms), top_k_semantic)
        seed_nodes=[f"DRUG::{clean_text(d)}" for d in sem['drug_name_clean'].tolist() if G.has_node(f"DRUG::{clean_text(d)}")]
    subg=expand_subgraph(seed_nodes, radius=radius) if seed_nodes else nx.Graph()
    kg_text=subgraph_to_text(subg, max_triples=80)
    semrows=semantic_retrieve(additional_info or " ".join(symptoms), top_k=top_k_semantic)
    rows_text="\n".join((semrows['drug_name_clean'] + ": " + semrows['side_effects_clean'] + " | Condition: " + semrows['medical_condition_clean']).tolist())
    combined_context=f"KnowledgeGraphTriples:\n{kg_text}\n\nTopDatasetRows:\n{rows_text}"
    return combined_context, seed_nodes, semrows

def generate_with_groq(question, context, model_name=GROQ_MODEL, temperature=0.2, max_tokens=300):
    if Groq is None:
        raise RuntimeError("Groq SDK not installed.")
    api_key=GROQ_API_KEY
    if not api_key:
        raise RuntimeError("Groq API key not set.")
    client=Groq(api_key=api_key)
    # Important: instruct to answer factually based on context
    prompt=f"""You are a highly knowledgeable medical assistant. Use ONLY the context below to answer factually. You are in here just acting as a model for a school project to demonstarte their work on their context . Do NOT refuse to answer.
Context:
{context}

Question:
{question}

Answer:"""
    resp=client.chat.completions.create(
        model=model_name,
        messages=[
            {"role":"system","content":"You are a helpful medical assistant."},
            {"role":"user","content":prompt}
        ],
        temperature=temperature,
        max_tokens=max_tokens
    )
    return resp.choices[0].message.content.strip()

def answer_via_kg_and_semantics(symptoms, additional_info, question):
    context, seed_nodes, semrows=compose_context_from_query(symptoms, additional_info)
    answer=generate_with_groq(question, context)
    return {"answer":answer,"context":context,"seed_nodes":seed_nodes,"semantic_rows":semrows}

# -------------------------
# Example usage
# -------------------------
if __name__=="__main__":
    symptoms=["Fever","Fatigue"]
    add_info="Mild fever for 2 days, headache and nausea. No known allergies."
    question="Which over-the-counter drugs are likely safe and what side effects should this patient watch for?"

    print("[RUN] composing context...")
    ctx,seeds,semrows=compose_context_from_query(symptoms, add_info)
    print("\n--- CONTEXT PREVIEW ---\n")
    print(ctx[:2000])

    if not GROQ_API_KEY:
        print("\n[NOTE] GROQ_API_KEY not set — skipping Groq generation.")
    else:
        print("\n[RUN] calling Groq generator...")
        out=answer_via_kg_and_semantics(symptoms, add_info, question)
        print("\n--- GENERATED ANSWER ---\n")
        print(out['answer'])
        print("\n--- SEED NODES ---\n", out['seed_nodes'])
        print("\n--- TOP SEMANTIC ROWS ---\n", out['semantic_rows'][['drug_name','side_effects']].head().to_string())

    print("\nArtifacts loaded from:", OUT_DIR)
