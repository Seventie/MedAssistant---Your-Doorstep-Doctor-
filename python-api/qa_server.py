# qa_server.py - Dedicated Q&A Model Server
import numpy as np
import pandas as pd
import faiss
import torch
from transformers import DPRQuestionEncoder, DPRQuestionEncoderTokenizer
from groq import Groq
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QAModelServer:
    def __init__(self):
        self.is_loaded = False
        self.docs = []
        self.index = None
        self.question_encoder = None
        self.tokenizer = None
        self.groq_client = None
        
    def load_models(self):
        """Load all Q&A models and data"""
        logger.info("🔄 Loading Q&A models...")
        
        try:
            # Load data and embeddings
            logger.info("📊 Loading medical Q&A dataset...")
            df = pd.read_csv("data/medquad_processed.csv")
            self.docs = df["answer_clean"].astype(str).tolist()
            
            # Load precomputed embeddings
            logger.info("🧠 Loading precomputed embeddings...")
            encoded_docs = np.load("embeddings/encoded_docs.npy")
            encoded_docs = encoded_docs / np.linalg.norm(encoded_docs, axis=1, keepdims=True)
            
            # Build FAISS index
            logger.info("🔍 Building FAISS index...")
            dimension = encoded_docs.shape[1]
            self.index = faiss.IndexFlatIP(dimension)
            self.index.add(encoded_docs)
            
            # Load DPR models
            logger.info("🤖 Loading DPR Question Encoder...")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self.question_encoder = DPRQuestionEncoder.from_pretrained(
                "facebook/dpr-question_encoder-single-nq-base"
            ).to(device)
            self.tokenizer = DPRQuestionEncoderTokenizer.from_pretrained(
                "facebook/dpr-question_encoder-single-nq-base"
            )
            
            # Initialize GROQ
            logger.info("🚀 Initializing GROQ client...")
            self.groq_client = Groq(api_key="")
            
            self.is_loaded = True
            logger.info("✅ Q&A Model Server ready!")
            logger.info(f"📚 Loaded {len(self.docs)} medical documents")
            logger.info(f"🔍 FAISS index with {self.index.ntotal} vectors")
            
        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            raise e
    
    def encode_question(self, question):
        """Encode question using DPR"""
        inputs = self.tokenizer(question, return_tensors="pt", max_length=512, truncation=True)
        with torch.no_grad():
            question_embedding = self.question_encoder(**inputs).pooler_output
        return question_embedding.numpy()
    
    def retrieve_context(self, question, top_k=5):
        """Retrieve relevant context using FAISS"""
        question_embedding = self.encode_question(question)
        question_embedding = question_embedding / np.linalg.norm(question_embedding, axis=1, keepdims=True)
        
        scores, indices = self.index.search(question_embedding, top_k)
        
        retrieved_docs = [self.docs[idx] for idx in indices[0]]
        return retrieved_docs, scores[0].tolist()
    
    def generate_answer(self, question, context_docs):
        """Generate answer using GROQ with retrieved context"""
        context = "\n".join(context_docs[:3])  # Top 3 most relevant
        
        messages = [
            {
                "role": "system",
                "content": "You are a medical expert. Use the provided context to answer questions accurately. If the context doesn't contain relevant information, say so clearly."
            },
            {
                "role": "user", 
                "content": f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
            }
        ]
        
        completion = self.groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.3,
            max_tokens=400
        )
        
        return completion.choices[0].message.content
    
    def answer_question(self, question):
        """Complete Q&A pipeline"""
        if not self.is_loaded:
            raise Exception("Models not loaded")
        
        # Retrieve context
        context_docs, scores = self.retrieve_context(question)
        
        # Generate answer
        answer = self.generate_answer(question, context_docs)
        
        return {
            "question": question,
            "answer": answer,
            "context_docs": context_docs,
            "retrieval_scores": scores,
            "method": "DPR + FAISS + Context Retrieval + GROQ",
            "num_context_docs": len(context_docs)
        }

# Initialize model server
qa_server = QAModelServer()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy" if qa_server.is_loaded else "loading",
        "model": "Q&A Server",
        "models_loaded": {
            "dpr_encoder": qa_server.question_encoder is not None,
            "faiss_index": qa_server.index is not None,
            "groq_client": qa_server.groq_client is not None,
            "documents": len(qa_server.docs)
        },
        "timestamp": datetime.now().isoformat()
    })

@app.route('/qa', methods=['POST'])
def qa():
    try:
        data = request.get_json()
        question = data.get('question')
        
        if not question:
            return jsonify({"error": "Question is required"}), 400
        
        logger.info(f"🔍 Q&A Request: {question}")
        
        result = qa_server.answer_question(question)
        result['status'] = 'success'
        result['timestamp'] = datetime.now().isoformat()
        
        logger.info(f"✅ Q&A Response generated")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Q&A Error: {e}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Q&A Model Server...")
    print("📋 Server: DPR + FAISS + GROQ for Medical Q&A")
    print("🔗 Port: 5001")
    print("=" * 50)
    
    # Load models on startup
    qa_server.load_models()
    
    app.run(host='0.0.0.0', port=5001, debug=True)
