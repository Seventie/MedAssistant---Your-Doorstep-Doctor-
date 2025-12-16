
# app.py - Complete Flask API Server for Medical AI Models
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import faiss
import torch
from transformers import DPRQuestionEncoder, DPRQuestionEncoderTokenizer
from groq import Groq
import os
import re
from pathlib import Path
import networkx as nx
import spacy
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for models
qa_model = None
med_recommendation_model = None

class QAModel:
    """Medical Q&A Model using DPR + FAISS + GROQ"""

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.groq_api_key = os.getenv("GROQ_API_KEY",)
        self.client = Groq(api_key=self.groq_api_key)
        self.load_models()

    def load_models(self):
        """Load DPR encoders and FAISS index"""
        logger.info("[INIT] Loading DPR encoders...")
        try:
            self.question_encoder = DPRQuestionEncoder.from_pretrained(
                "facebook/dpr-question_encoder-single-nq-base"
            ).to(self.device)
            self.question_tokenizer = DPRQuestionEncoderTokenizer.from_pretrained(
                "facebook/dpr-question_encoder-single-nq-base"
            )

            # Load data and embeddings
            self.df = pd.read_csv("data/medquad_processed.csv")
            self.docs = self.df["answer_clean"].astype(str).tolist()

            self.encoded_docs = np.load("embeddings/encoded_docs.npy")
            self.encoded_docs = self.encoded_docs / np.linalg.norm(self.encoded_docs, axis=1, keepdims=True)

            dimension = self.encoded_docs.shape[1]
            self.index = faiss.IndexFlatIP(dimension)
            self.index.add(self.encoded_docs)

            logger.info("[INFO] QA Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading QA model: {e}")
            # Fallback to simple model without FAISS
            self.docs = ["Medical information about various health conditions and treatments."]
            self.index = None

    def retrieve_context(self, question: str, top_k: int = 5):
        """Retrieve top-k relevant contexts using FAISS"""
        if self.index is None:
            return "General medical knowledge context for educational purposes."

        try:
            inputs = self.question_tokenizer(
                question, return_tensors="pt", truncation=True, max_length=512
            ).to(self.device)

            with torch.no_grad():
                q_emb = self.question_encoder(**inputs).pooler_output.cpu().numpy()
                q_emb = q_emb / np.linalg.norm(q_emb, axis=1, keepdims=True)

            scores, indices = self.index.search(q_emb, top_k)
            retrieved_texts = [self.docs[i] for i in indices[0]]
            return " ".join(retrieved_texts)
        except Exception as e:
            logger.error(f"Error in retrieve_context: {e}")
            return "General medical context"

    def generate_answer_groq(self, question: str, context: str) -> str:
        """Generate factual medical answer using Groq model"""
        prompt = f"""
You are a knowledgeable medical assistant for educational purposes.
Use the provided context to answer the question factually and clearly.

Context:
{context}

Question:
{question}

Answer (educational information only):
"""

        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=300,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            return f"Unable to generate answer at this time. Error: {str(e)}"

    def ask_question(self, question: str, top_k: int = 5):
        """Get context, retrieve top docs, and generate answer"""
        context = self.retrieve_context(question, top_k=top_k)
        answer = self.generate_answer_groq(question, context)
        return {
            "answer": answer,
            "context": context,
            "method": "DPR + FAISS + GROQ"
        }

class MedicalRecommendationModel:
    """Medical Recommendation Model using KG + RAG + GROQ"""

    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.client = Groq(api_key=self.groq_api_key)
        self.embedder_model = "all-MiniLM-L6-v2"
        self.load_models()

    def load_models(self):
        """Load models and artifacts"""
        try:
            # Load spaCy
            try:
                self.nlp = spacy.load("en_core_sci_sm")
            except:
                self.nlp = spacy.load("en_core_web_sm")

            # Load sentence transformer
            self.embedder = SentenceTransformer(self.embedder_model)

            # Load data
            if os.path.exists("drugs_side_effects.csv"):
                self.df = pd.read_csv("drugs_side_effects.csv").fillna("")
                for col in ["drug_name", "side_effects", "medical_condition"]:
                    if col in self.df.columns:
                        if f"{col}_clean" not in self.df.columns:
                            self.df[f"{col}_clean"] = self.df[col].astype(str).apply(self.clean_text)
            else:
                logger.warning("drugs_side_effects.csv not found, using mock data")
                self.df = pd.DataFrame({
                    'drug_name_clean': ['Acetaminophen', 'Ibuprofen', 'Aspirin'],
                    'side_effects_clean': ['Liver damage with overdose', 'Stomach irritation', 'Bleeding risk'],
                    'medical_condition_clean': ['Pain relief', 'Pain and inflammation', 'Pain and blood thinning']
                })

            # Load embeddings
            if os.path.exists("kg_rag_artifacts/corpus_embeddings.npy"):
                self.corpus_embeddings = np.load("kg_rag_artifacts/corpus_embeddings.npy")
            else:
                logger.warning("corpus_embeddings.npy not found, creating mock embeddings")
                self.corpus_embeddings = np.random.random((len(self.df), 384))

            # Load knowledge graph
            if os.path.exists("kg_rag_artifacts/medical_kg.graphml"):
                self.G = nx.read_graphml("kg_rag_artifacts/medical_kg.graphml")
            else:
                logger.warning("medical_kg.graphml not found, creating empty graph")
                self.G = nx.Graph()

            logger.info("[INFO] Recommendation model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading recommendation model: {e}")
            # Create minimal fallback data
            self.df = pd.DataFrame({
                'drug_name_clean': ['Acetaminophen'],
                'side_effects_clean': ['Mild side effects'],
                'medical_condition_clean': ['General pain']
            })
            self.corpus_embeddings = np.random.random((1, 384))
            self.G = nx.Graph()

    def clean_text(self, text: str) -> str:
        """Clean text for processing"""
        if pd.isna(text):
            return ""
        s = str(text)
        s = re.sub(r"[\r\n]+", " ", s)
        s = re.sub(r"[^A-Za-z0-9\s\-,\.;:()/%]", " ", s)
        s = re.sub(r"\s+", " ", s)
        return s.strip()

    def extract_query_entities(self, symptoms, additional_info):
        """Extract entities from query"""
        tokens = [self.clean_text(str(s)) for s in symptoms]
        doc = self.nlp(str(additional_info))
        ents = [(ent.text.strip(), ent.label_) for ent in doc.ents]
        tokens += [self.clean_text(e) for e, lbl in ents]

        for tok in doc:
            if tok.pos_ in {"NOUN", "PROPN", "ADJ"} and len(tok.text) > 2:
                tokens.append(self.clean_text(tok.text))

        # Deduplicate
        seen = set()
        out = []
        for t in tokens:
            if t and t not in seen:
                out.append(t)
                seen.add(t)
        return out

    def semantic_retrieve(self, text, top_k=5):
        """Retrieve semantically similar medicines"""
        try:
            qv = self.embedder.encode([self.clean_text(str(text))], convert_to_numpy=True, normalize_embeddings=True)
            sims = cosine_similarity(qv, self.corpus_embeddings)[0]
            indices = sims.argsort()[-top_k:][::-1].tolist()
            return self.df.iloc[indices].copy()
        except Exception as e:
            logger.error(f"Error in semantic retrieval: {e}")
            return self.df.head(top_k)

    def generate_with_groq(self, question, context, temperature=0.2, max_tokens=300):
        """Generate recommendations using GROQ"""
        prompt = f"""You are a medical assistant for educational purposes. Use ONLY the context below to provide factual medicine information.

Context:
{context}

Question:
{question}

Answer (educational information only):"""

        try:
            resp = self.client.chat.completions.create(
                model="gemma2-9b-it",
                messages=[
                    {"role": "system", "content": "You are a helpful medical assistant providing educational information."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error calling GROQ API: {e}")
            return "Unable to generate recommendation at this time."

    def recommend_medicines(self, symptoms, additional_info):
        """Generate medicine recommendations"""
        # Get semantic matches
        semrows = self.semantic_retrieve(str(additional_info) or " ".join(map(str, symptoms)), top_k=5)

        # Create context
        if not semrows.empty:
            rows_text = "\n".join((
                semrows.get('drug_name_clean', pd.Series(['Unknown'])).astype(str) + ": " + 
                semrows.get('side_effects_clean', pd.Series(['No side effects listed'])).astype(str) + " | Condition: " + 
                semrows.get('medical_condition_clean', pd.Series(['General use'])).astype(str)
            ).tolist())
        else:
            rows_text = "No specific matches found in database."

        context = f"Top Dataset Rows:\n{rows_text}"

        question = f"Based on symptoms: {', '.join(map(str, symptoms))} and additional info: {additional_info}, what medicines would be appropriate and what are their side effects?"

        answer = self.generate_with_groq(question, context)

        return {
            "recommendations": answer,
            "context": context,
            "semantic_matches": semrows.to_dict('records') if not semrows.empty else [],
            "method": "KG + RAG + GROQ"
        }

# Initialize models on startup
def initialize_models():
    global qa_model, med_recommendation_model
    logger.info("Initializing models...")
    qa_model = QAModel()
    med_recommendation_model = MedicalRecommendationModel()
    logger.info("Models initialized successfully")

# Initialize models when the app starts
initialize_models()

# API Routes
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": pd.Timestamp.now().isoformat()})

@app.route('/qa', methods=['POST'])
def medical_qa():
    """Medical Q&A endpoint"""
    try:
        data = request.json
        question = data.get('question')

        if not question:
            return jsonify({"error": "Question is required"}), 400

        result = qa_model.ask_question(question)

        return jsonify({
            "status": "success",
            "question": question,
            "answer": result["answer"],
            "context_preview": result["context"][:200] + "..." if len(result["context"]) > 200 else result["context"],
            "method": result["method"],
            "timestamp": pd.Timestamp.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in QA endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommend', methods=['POST'])
def medicine_recommendations():
    """Medicine recommendations endpoint"""
    try:
        data = request.json
        symptoms = data.get('symptoms', [])
        additional_info = data.get('additional_info', '')

        if not symptoms and not additional_info:
            return jsonify({"error": "Symptoms or additional info is required"}), 400

        result = med_recommendation_model.recommend_medicines(symptoms, additional_info)

        return jsonify({
            "status": "success",
            "symptoms": symptoms,
            "additional_info": additional_info,
            "recommendations": result["recommendations"],
            "semantic_matches": result["semantic_matches"],
            "method": result["method"],
            "timestamp": pd.Timestamp.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in recommendations endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/search', methods=['POST'])
def medicine_search():
    """Medicine search endpoint"""
    try:
        data = request.json
        query = data.get('query', '')
        top_k = data.get('top_k', 10)

        if not query:
            return jsonify({"error": "Query is required"}), 400

        results = med_recommendation_model.semantic_retrieve(query, top_k=top_k)

        return jsonify({
            "status": "success",
            "query": query,
            "results": results.to_dict('records'),
            "total_results": len(results),
            "timestamp": pd.Timestamp.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

