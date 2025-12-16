# recommendations_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

# Import your model functions
from medical_v3 import answer_via_kg_and_semantics

app = Flask(__name__)
CORS(app)

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        data = request.get_json()
        symptoms = data.get("symptoms", [])
        additional_info = data.get("additional_info", "")
        question = (
            data.get("question")
            or f"What are safe medicines or treatments for symptoms: {', '.join(symptoms)}?"
        )

        print(f"[INFO] Symptoms: {symptoms}")
        print(f"[INFO] Additional info: {additional_info}")
        print(f"[INFO] Question: {question}")

        # Get AI answer
        out = answer_via_kg_and_semantics(symptoms, additional_info, question)

        # Build structured JSON for frontend
        response = {
            "status": "success",
            "symptoms": symptoms,
            "additional_info": additional_info,
            "recommendations": out["semantic_rows"][[
                "drug_name",
                "medical_condition",
                "side_effects"
            ]].to_dict(orient="records"),
            "ai_advice": out["answer"],
            "total_recommendations": len(out["semantic_rows"]),
            "source": "Groq RAG",
            "timestamp": None
        }
        return jsonify(response), 200

    except Exception as e:
        print("[ERROR]", traceback.format_exc())
        return jsonify({
            "status": "error",
            "message": str(e),
            "recommendations": [],
            "ai_advice": "Sorry, something went wrong in the recommendations model."
        }), 500


if __name__ == "__main__":
    print("🚀 Starting Medicine Recommendation Server on port 5002...")
    app.run(host="0.0.0.0", port=5002)
