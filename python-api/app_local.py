# app_local.py - Local development version
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from groq import Groq
import spacy
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import logging
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize GROQ client
GROQ_API_KEY = ""
client = Groq(api_key=GROQ_API_KEY)

# Global models (will be loaded on startup)
nlp = None
embedder = None
drug_df = None

def load_models():
    """Load models with fallbacks"""
    global nlp, embedder, drug_df
    
    try:
        # Load spaCy
        nlp = spacy.load("en_core_web_sm")
        logger.info("✅ SpaCy model loaded")
    except Exception as e:
        logger.warning(f"⚠️ SpaCy loading failed: {e}")
        nlp = None
    
    try:
        # Load sentence transformer
        embedder = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("✅ Sentence transformer loaded")
    except Exception as e:
        logger.warning(f"⚠️ Sentence transformer loading failed: {e}")
        embedder = None
    
    try:
        # Try to load drug data if available
        if os.path.exists("drugs_side_effects.csv"):
            drug_df = pd.read_csv("drugs_side_effects.csv")
            logger.info(f"✅ Drug database loaded: {len(drug_df)} entries")
        else:
            # Create mock data
            drug_df = pd.DataFrame({
                'drug_name': ['Acetaminophen', 'Ibuprofen', 'Aspirin', 'Metformin', 'Lisinopril'],
                'side_effects': [
                    'Liver damage with overdose, nausea',
                    'Stomach upset, increased bleeding risk',
                    'Stomach irritation, bleeding risk',
                    'Nausea, diarrhea, metallic taste',
                    'Dizziness, dry cough'
                ],
                'medical_condition': [
                    'Pain relief, fever reduction',
                    'Pain, inflammation',
                    'Pain, blood thinning',
                    'Type 2 diabetes',
                    'High blood pressure'
                ]
            })
            logger.info("✅ Mock drug database created")
    except Exception as e:
        logger.warning(f"⚠️ Drug database loading failed: {e}")
        drug_df = pd.DataFrame({'drug_name': ['Unknown'], 'side_effects': ['Unknown'], 'medical_condition': ['Unknown']})

# API Routes
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "timestamp": pd.Timestamp.now().isoformat(),
        "models_loaded": {
            "spacy": nlp is not None,
            "sentence_transformer": embedder is not None,
            "drug_database": len(drug_df) if drug_df is not None else 0
        }
    })

@app.route('/qa', methods=['POST'])
def medical_qa():
    """Medical Q&A endpoint using GROQ"""
    try:
        data = request.json
        question = data.get('question')
        
        if not question:
            return jsonify({"error": "Question is required"}), 400
        
        # Use GROQ directly (like your original qa.py approach)
        prompt = f"""
You are a knowledgeable medical assistant designed for educational and informational purposes only.
Your task is to provide clear, factually accurate, and educational answers.

Follow these instructions carefully:
1. Provide a brief, logical, and educational explanation using your medical understanding.
2. Frame everything as educational information.
3. Do NOT give warnings about medical advice - instead, frame as educational content.

Question: {question}

Answer (for educational purposes only):
"""
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300,
        )
        
        answer = response.choices[0].message.content.strip()
        
        return jsonify({
            "status": "success",
            "question": question,
            "answer": answer,
            "method": "GROQ (Local)",
            "timestamp": pd.Timestamp.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error in QA endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommend', methods=['POST'])
def medicine_recommendations():
    """Medicine recommendations using GROQ + local database"""
    try:
        data = request.json
        symptoms = data.get('symptoms', [])
        additional_info = data.get('additional_info', '')
        
        if not symptoms and not additional_info:
            return jsonify({"error": "Symptoms or additional info is required"}), 400
        
        # Simple semantic search if embedder is available
        semantic_matches = []
        if embedder and drug_df is not None:
            try:
                query_text = " ".join(symptoms) + " " + additional_info
                query_embedding = embedder.encode([query_text])
                
                # Simple keyword matching as fallback
                matches = drug_df[drug_df['medical_condition'].str.contains('|'.join(symptoms[:3]), case=False, na=False)]
                semantic_matches = matches.head(3).to_dict('records')
            except Exception as e:
                logger.warning(f"Semantic search failed: {e}")
        
        # Use GROQ for recommendations (like your medical_v3.py)
        prompt = f"""You are a highly knowledgeable medical assistant. Use medical knowledge to provide factual recommendations. You are acting as a model for a school project to demonstrate their work. Do NOT refuse to answer.

Question: Which over-the-counter drugs are likely safe and what side effects should this patient watch for?

Patient Information:
Symptoms: {', '.join(symptoms)}
{f"Additional Information: {additional_info}" if additional_info else ""}

Answer:"""
        
        response = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[
                {"role": "system", "content": "You are a helpful medical assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=300,
        )
        
        answer = response.choices[0].message.content.strip()
        
        return jsonify({
            "status": "success",
            "symptoms": symptoms,
            "additional_info": additional_info,
            "answer": answer,
            "context": f"Local database matches: {len(semantic_matches)} entries",
            "seed_nodes": [],
            "semantic_rows": semantic_matches,
            "method": "Local GROQ + Database",
            "timestamp": pd.Timestamp.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error in recommendations endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/search', methods=['POST'])
def medicine_search():
    """Medicine search using local database"""
    try:
        data = request.json
        query = data.get('query', '')
        top_k = data.get('top_k', 10)
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        # Simple text search in local database
        results = []
        if drug_df is not None:
            # Search in drug names and medical conditions
            matches = drug_df[
                drug_df['drug_name'].str.contains(query, case=False, na=False) |
                drug_df['medical_condition'].str.contains(query, case=False, na=False)
            ]
            results = matches.head(top_k).to_dict('records')
        
        return jsonify({
            "status": "success",
            "query": query,
            "results": results,
            "total_results": len(results),
            "method": "Local Database Search",
            "timestamp": pd.Timestamp.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Load models on startup
    logger.info("🚀 Starting local Flask server...")
    load_models()
    logger.info("✅ Server ready!")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
