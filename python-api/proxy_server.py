# proxy_server.py - Local proxy server to bridge Supabase and your Python API
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import logging
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["*"], allow_headers=["*"], methods=["*"])

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Your local Python API URL
LOCAL_API_URL = "http://localhost:5000"

def is_local_api_running():
    """Check if local API is running"""
    try:
        response = requests.get(f"{LOCAL_API_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

@app.route('/health', methods=['GET'])
def proxy_health():
    """Health check for proxy and local API"""
    local_api_status = is_local_api_running()
    
    if local_api_status:
        # Get detailed health from local API
        try:
            response = requests.get(f"{LOCAL_API_URL}/health", timeout=5)
            local_health = response.json()
            
            return jsonify({
                "status": "healthy",
                "proxy_status": "running",
                "local_api_status": "connected",
                "local_api_health": local_health,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                "status": "degraded",
                "proxy_status": "running", 
                "local_api_status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
    else:
        return jsonify({
            "status": "degraded",
            "proxy_status": "running",
            "local_api_status": "disconnected", 
            "message": "Local Python API not accessible",
            "timestamp": datetime.now().isoformat()
        })

@app.route('/qa', methods=['POST', 'OPTIONS'])
def proxy_qa():
    """Proxy Medical Q&A requests"""
    if request.method == 'OPTIONS':
        return Response(headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        })
    
    try:
        # Get request data
        data = request.get_json()
        logger.info(f"🔍 Proxying Q&A request: {data.get('question', 'No question')}")
        
        # Forward to local API
        response = requests.post(
            f"{LOCAL_API_URL}/qa",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            # Add proxy metadata
            result['proxy_used'] = True
            result['proxy_timestamp'] = datetime.now().isoformat()
            
            logger.info(f"✅ Q&A response: {result.get('method', 'Unknown method')}")
            return jsonify(result)
        else:
            logger.error(f"❌ Local API error: {response.status_code} - {response.text}")
            return jsonify({
                "status": "error",
                "message": f"Local API returned {response.status_code}",
                "proxy_used": True
            }), response.status_code
            
    except Exception as e:
        logger.error(f"❌ Proxy error: {e}")
        return jsonify({
            "status": "error", 
            "message": f"Proxy error: {str(e)}",
            "proxy_used": True
        }), 500

@app.route('/recommend', methods=['POST', 'OPTIONS'])
def proxy_recommend():
    """Proxy Medicine Recommendations requests"""
    if request.method == 'OPTIONS':
        return Response(headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS", 
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        })
    
    try:
        data = request.get_json()
        logger.info(f"💊 Proxying recommendations for: {data.get('symptoms', [])}")
        
        response = requests.post(
            f"{LOCAL_API_URL}/recommend",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            result['proxy_used'] = True
            result['proxy_timestamp'] = datetime.now().isoformat()
            
            logger.info(f"✅ Recommendations response: {result.get('method', 'Unknown method')}")
            return jsonify(result)
        else:
            logger.error(f"❌ Local API error: {response.status_code}")
            return jsonify({
                "status": "error",
                "message": f"Local API returned {response.status_code}",
                "proxy_used": True
            }), response.status_code
            
    except Exception as e:
        logger.error(f"❌ Proxy error: {e}")
        return jsonify({
            "status": "error",
            "message": f"Proxy error: {str(e)}",
            "proxy_used": True
        }), 500

@app.route('/search', methods=['POST', 'OPTIONS'])
def proxy_search():
    """Proxy Medicine Search requests"""
    if request.method == 'OPTIONS':
        return Response(headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        })
    
    try:
        data = request.get_json()
        logger.info(f"🔎 Proxying search for: {data.get('query', 'No query')}")
        
        response = requests.post(
            f"{LOCAL_API_URL}/search", 
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            result['proxy_used'] = True
            result['proxy_timestamp'] = datetime.now().isoformat()
            
            logger.info(f"✅ Search response: {result.get('method', 'Unknown method')}")
            return jsonify(result)
        else:
            logger.error(f"❌ Local API error: {response.status_code}")
            return jsonify({
                "status": "error", 
                "message": f"Local API returned {response.status_code}",
                "proxy_used": True
            }), response.status_code
            
    except Exception as e:
        logger.error(f"❌ Proxy error: {e}")
        return jsonify({
            "status": "error",
            "message": f"Proxy error: {str(e)}",
            "proxy_used": True
        }), 500

@app.route('/', methods=['GET'])
def proxy_info():
    """Proxy server information"""
    return jsonify({
        "status": "proxy_running",
        "local_api_url": LOCAL_API_URL,
        "local_api_running": is_local_api_running(),
        "endpoints": ["/health", "/qa", "/recommend", "/search"],
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Starting Proxy Server...")
    print(f"🔗 Will proxy requests to: {LOCAL_API_URL}")
    print(f"🌐 Proxy running on: http://localhost:5001")
    print("📋 Available endpoints: /health, /qa, /recommend, /search")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5001, debug=True)
