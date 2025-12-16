# MedAssistant - Your Doorstep Doctor

An AI-powered medical assistant application leveraging state-of-the-art Natural Language Processing (NLP) and Retrieval-Augmented Generation (RAG) techniques. The system combines Dense Passage Retrieval, Knowledge Graphs, Named Entity Recognition, and Large Language Models to provide intelligent medical consultations and symptom-based diagnosis predictions.

## Overview

MedAssistant implements a sophisticated dual-server architecture that processes medical queries using advanced NLP pipelines. The system retrieves relevant medical information from knowledge bases, expands context through knowledge graph traversal, and generates accurate responses using LLM-powered generation with retrieved context.

[Add project demo image/video here]

## Architecture

The project consists of three main components:

- **Frontend**: React-based user interface built with Vite, TypeScript, and shadcn/ui components
- **QA Server**: Medical question-answering chatbot using DPR + FAISS + RAG
- **Medical Prediction Server**: Symptom analysis using Knowledge Graph RAG + NER + Semantic Search

[Add architecture diagram here]

## Key Features

- Conversational medical chatbot with Dense Passage Retrieval (DPR)
- Symptom-based disease prediction using multi-technique NLP pipeline
- FAISS-powered semantic search with pre-computed embeddings
- Knowledge Graph expansion for contextual medical information retrieval
- Named Entity Recognition (NER) for medical entity extraction
- Real-time medical query processing with LLM generation
- Drug side effects database with semantic retrieval

## NLP Techniques & Technologies

### QA Server (`qa_server.py`)
- **Dense Passage Retrieval (DPR)**: Facebook's `dpr-question_encoder-single-nq-base` for question encoding
- **FAISS (Facebook AI Similarity Search)**: IndexFlatIP for efficient dense vector similarity search
- **Pre-computed Embeddings**: Normalized document embeddings for fast retrieval
- **RAG Pipeline**: Context retrieval → LLM generation workflow
- **LLM**: Groq's `llama-3.1-8b-instant` for answer generation

### Medical Prediction Server (`medical_v3.py`)
- **Named Entity Recognition (NER)**: 
  - scispaCy (`en_core_sci_sm`) for biomedical entity extraction
  - Fallback to spaCy (`en_core_web_sm`)
  - Custom entity extraction from noun chunks
- **Sentence Transformers**: `all-MiniLM-L6-v2` for semantic embeddings
- **Knowledge Graph (KG)**:
  - NetworkX for graph structure
  - Subgraph expansion with configurable radius
  - Triple extraction (entity-relation-entity)
- **Semantic Retrieval**:
  - FAISS IndexFlatIP for vector similarity
  - Cosine similarity fallback
  - TF-IDF vectorization support
- **LLM Generation**: Groq's `gemma2-9b-it` for context-aware answer generation
- **Hybrid Context Composition**: KG triples + Top-K semantic rows

### Core NLP Stack
- **FAISS**: Fast similarity search and clustering of dense vectors
- **Transformers**: HuggingFace transformers for DPR models
- **Sentence-Transformers**: Dense vector representations for semantic search
- **spaCy/scispaCy**: Medical and general NER, POS tagging, noun chunking
- **scikit-learn**: Cosine similarity, TF-IDF vectorization
- **NetworkX**: Knowledge graph construction and traversal

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui component library
- React Router for navigation
- Supabase for backend services

### Backend (Python API)
- Flask web framework
- PyTorch for DPR model inference
- FAISS for vector indexing
- Sentence-Transformers for embeddings
- spaCy/scispaCy for NER
- NetworkX for Knowledge Graph
- Groq API for LLM generation
- NumPy/Pandas for data processing

## Prerequisites

- Node.js 16+ and npm
- Python 3.11+
- Git
- CUDA-compatible GPU (optional, for faster inference)

## Installation

### 1. Clone the Repository

git clone https://github.com/Seventie/MedAssistant---Your-Doorstep-Doctor-.git
cd MedAssistant---Your-Doorstep-Doctor-


### 2. Frontend Setup

Install dependenciesnpm installRun development servernpm run dev


The frontend will start on `http://localhost:5173`

### 3. Backend Setup
Navigate to python-api directorycd python-apiInstall Python dependenciespip install -r requirements.txtDownload spaCy modelspython -m spacy download en_core_web_sm
python -m spacy download en_core_sci_sm


### 4. Configuration

Add your API keys to the server files:
- `qa_server.py`: Add Groq API key for QA generation
- `medical_v3.py`: Add Groq API key for medical predictions

## Running the Application

The application requires three separate terminals running concurrently:

### Terminal 1: Frontend


npm run dev


### Terminal 2: QA Server (Medical Chatbot)

cd python-api
python qa_server.py

**Port**: 5001  
**Pipeline**: DPR Question Encoding → FAISS Retrieval → Context Assembly → Groq LLM Generation

### Terminal 3: Medical Prediction Server (Symptom Analysis)

cd python-api
python medical_v3.py


**Pipeline**: NER Entity Extraction → KG Node Matching → Subgraph Expansion → Semantic Retrieval → Context Composition → Groq LLM Generation

[Add screenshot of running servers here]

## Project Structure


**Pipeline**: NER Entity Extraction → KG Node Matching → Subgraph Expansion → Semantic Retrieval → Context Composition → Groq LLM Generation

[Add screenshot of running servers here]

## Project Structure

MedAssistant---Your-Doorstep-Doctor-/
├── src/                          # Frontend React components
├── public/                       # Static assets
├── python-api/
│   ├── qa_server.py             # DPR + FAISS + RAG Q&A server
│   ├── medical_v3.py            # KG-RAG + NER prediction server
│   ├── data/
│   │   └── medquad_processed.csv # Medical Q&A dataset
│   ├── embeddings/
│   │   ├── encoded_docs.npy     # Pre-computed DPR embeddings
│   │   └── corpus_embeddings.npy # Sentence-Transformer embeddings
│   ├── kg_rag_artifacts/
│   │   ├── medical_kg.graphml   # Knowledge Graph structure
│   │   ├── ner_entities.csv     # Extracted entities
│   │   ├── faiss.index          # FAISS index file
│   │   └── tfidf_vectorizer.npz # TF-IDF vectorizer
│   ├── drugs_side_effects.csv   # Drug database
│   └── requirements.txt         # Python dependencies
├── notebooks/                    # Jupyter notebooks for development
├── visualizations/               # Data visualization outputs
└── package.json                  # Frontend dependencies



## How It Works

### RAG-based Medical Q&A (DPR + FAISS)

1. **Question Encoding**: DPR encoder converts user question to dense vector
2. **FAISS Retrieval**: Inner product search finds top-K similar documents
3. **Context Assembly**: Retrieved medical documents form context
4. **LLM Generation**: Groq LLM generates answer conditioned on context
5. **Response**: Returns answer with retrieval scores and source documents

[Add demo video of Q&A system here]

### Symptom-Based Prediction (KG-RAG + NER)

1. **Entity Extraction**: 
   - scispaCy NER extracts medical entities (diseases, symptoms, drugs)
   - Noun chunking for additional medical terms
   - POS tagging filters nouns and adjectives
2. **Knowledge Graph Matching**: Extracted entities matched to KG nodes
3. **Subgraph Expansion**: BFS traversal expands context (radius=2)
4. **Semantic Retrieval**: 
   - Sentence-Transformer embeddings encode query
   - FAISS finds top-K semantically similar drug records
5. **Context Composition**: KG triples + semantic rows combined
6. **LLM Generation**: Groq generates diagnosis with composed context
7. **Response**: Returns prediction with context sources

[Add demo video of symptom prediction here]

## Data Processing Pipeline

### Pre-computed Artifacts
- **DPR Embeddings**: 768-dimensional vectors for medical Q&A corpus
- **Sentence Embeddings**: 384-dimensional vectors for drug database
- **FAISS Indices**: Optimized for inner product similarity search
- **Knowledge Graph**: Drug-symptom-condition relationships
- **NER Entities**: Pre-extracted medical entities from corpus

### Knowledge Graph Structure
- **Nodes**: Drugs, conditions, symptoms (labeled with types)
- **Edges**: Relations (e.g., "treats", "causes", "side_effect_of")
- **Format**: GraphML for NetworkX compatibility

## API Endpoints

### QA Server (Port 5001)

POST /qa
{
"question": "What are the side effects of aspirin?"
}Response:
{
"answer": "...",
"context_docs": [...],
"retrieval_scores": [...],
"method": "DPR + FAISS + Context Retrieval + GROQ"
}


### Medical Prediction Server


## Configuration

Required environment variables:
- `GROQ_API_KEY`: Groq API key for LLM generation
- Model paths and artifact locations in server files

Optional configurations:
- FAISS index parameters
- DPR model selection
- KG expansion radius
- Top-K retrieval count
- LLM temperature and max tokens

## Performance Optimization

- **Pre-computed Embeddings**: Avoid re-encoding corpus on each query
- **FAISS Indexing**: Sub-linear search time for large document collections
- **GPU Acceleration**: PyTorch CUDA support for DPR encoding
- **Normalized Vectors**: Inner product equivalent to cosine similarity

## Development

Frontend developmentnpm run devFrontend buildnpm run buildLintingnpm run lintPython server developmentcd python-api
python qa_server.py  # Port 5001
python medical_v3.py # Separate port


## Technical Highlights

- **Hybrid Retrieval**: Combines dense (DPR/FAISS) and graph-based retrieval
- **Multi-hop Reasoning**: Knowledge graph traversal for complex queries
- **Domain-Specific NER**: Biomedical entity recognition with scispaCy
- **Semantic Composition**: Merges multiple context sources for LLM
- **Efficient Vector Search**: FAISS indexing for scalability

## Contributing

Contributions are welcome. Please ensure:
- Code follows existing style conventions
- All servers run without errors
- Medical information is accurate and properly sourced
- NLP pipelines maintain performance benchmarks

## License

[Add license information]

## Acknowledgments

Built using state-of-the-art NLP techniques:
- Dense Passage Retrieval (Facebook AI Research)
- FAISS (Facebook AI Similarity Search)
- scispaCy (Allen Institute for AI)
- Sentence-Transformers (UKP Lab)
- Groq for LLM inference

---

**Disclaimer**: This application is for educational and informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers for medical concerns.


