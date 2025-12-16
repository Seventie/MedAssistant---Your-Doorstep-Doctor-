import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Set your Python API URL here (replace with your deployed API URL)
const PYTHON_API_URL = Deno.env.get('PYTHON_API_URL') || 'https://your-python-api.railway.app';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    
    if (!question) {
      throw new Error('Question is required');
    }

    console.log('Processing medical question:', question);

    // First, try to call your Python API for medical Q&A
    try {
      console.log('Calling Python API at:', PYTHON_API_URL + '/qa');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const pythonResponse = await fetch(`${PYTHON_API_URL}/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (pythonResponse.ok) {
        const pythonData = await pythonResponse.json();

        console.log('Python API response received successfully');

        // Return the response from your Python model
        return new Response(JSON.stringify({
          ...pythonData,
          source: 'Python DPR + FAISS + GROQ Model',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        const errorText = await pythonResponse.text();
        console.log('Python API returned error:', pythonResponse.status, errorText);
        throw new Error(`Python API error: ${pythonResponse.statusText}`);
      }
    } catch (pythonError) {
      console.log('Python API call failed:', pythonError.message);
      console.log('Falling back to direct GROQ API...');
    }

    // Fallback to direct GROQ call if Python API fails
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured and Python API unavailable');
    }

    console.log('Using GROQ fallback...');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Same model as your qa.py
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable medical assistant designed for educational and informational purposes only. Provide clear, factually accurate, and educational answers. Frame everything as educational information.'
          },
          {
            role: 'user',
            content: `Context: General medical knowledge for educational purposes.

Question: ${question}

Answer (for educational purposes only):`
          }
        ],
        temperature: 0.3, // Same as your qa.py
        max_tokens: 300, // Same as your qa.py
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('GROQ API error:', errorText);
      throw new Error(`GROQ API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    const answer = groqData.choices[0]?.message?.content || 'No answer generated';

    const response = {
      status: 'success',
      question: question,
      answer: answer,
      source: 'GROQ AI (Fallback)',
      method: 'DPR + FAISS + GROQ',
      metadata: {
        fallback_used: true,
        python_api_failed: true,
        model_used: 'llama-3.1-8b-instant'
      },
      timestamp: new Date().toISOString()
    };

    console.log('Medical QA response generated successfully via GROQ fallback');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in medical-qa function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
