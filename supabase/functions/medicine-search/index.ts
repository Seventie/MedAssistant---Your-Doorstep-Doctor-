import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Set your Python API URL here (replace with your deployed API URL)
const PYTHON_API_URL = Deno.env.get('PYTHON_API_URL') || 'https://your-python-api.railway.app';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, drug_name, top_k = 10 } = await req.json();
    
    if (!query && !drug_name) {
      throw new Error('Query or drug_name is required');
    }

    const searchQuery = query || drug_name;
    console.log('Searching medicines for:', searchQuery);
    console.log('Results requested (top_k):', top_k);

    // First, try to call your Python API for search
    try {
      console.log('Calling Python API at:', PYTHON_API_URL + '/search');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const pythonResponse = await fetch(`${PYTHON_API_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: searchQuery,
          top_k: top_k
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (pythonResponse.ok) {
        const pythonData = await pythonResponse.json();

        console.log('Python API search results received successfully');

        // Return the response from your Python model
        return new Response(JSON.stringify({
          ...pythonData,
          source: 'Python FAISS Vector Search',
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
      console.log('Falling back to GROQ + mock results...');
    }

    // Fallback to GROQ AI + mock results if Python API fails
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured and Python API unavailable');
    }

    console.log('Using GROQ fallback for search...');

    // Generate AI response about the search query
    const searchPrompt = query 
      ? `Provide information about medicines related to: ${query}. For each medicine, include: drug name, medical condition it treats, and common side effects. List up to 5 relevant medicines.`
      : `Provide detailed information about the medicine: ${drug_name}. Include medical condition, side effects, dosage information, and precautions.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are a medical database assistant. Provide accurate medicine information in a structured format for educational purposes.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('GROQ API error:', errorText);
      throw new Error(`GROQ API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    const aiResponse = groqData.choices[0]?.message?.content || '';

    // Mock search results - similar structure to your medical_v3.py semantic_retrieve output
    const mockResults = [
      {
        drug_name_clean: 'Aspirin',
        medical_condition_clean: 'Pain relief, fever reduction, blood thinning',
        side_effects_clean: 'Stomach irritation, bleeding, allergic reactions',
        score: 0.95
      },
      {
        drug_name_clean: 'Acetaminophen',
        medical_condition_clean: 'Pain relief, fever reduction',
        side_effects_clean: 'Liver damage with overdose, nausea, rash',
        score: 0.92
      },
      {
        drug_name_clean: 'Ibuprofen',
        medical_condition_clean: 'Pain relief, inflammation reduction',
        side_effects_clean: 'Stomach upset, dizziness, increased bleeding risk',
        score: 0.88
      },
      {
        drug_name_clean: 'Metformin',
        medical_condition_clean: 'Type 2 Diabetes management',
        side_effects_clean: 'Nausea, diarrhea, stomach upset, metallic taste',
        score: 0.85
      },
      {
        drug_name_clean: 'Lisinopril',
        medical_condition_clean: 'High blood pressure, heart failure',
        side_effects_clean: 'Dizziness, headache, persistent dry cough',
        score: 0.82
      }
    ].slice(0, top_k);

    const response = {
      status: 'success',
      query: searchQuery,
      results: mockResults,
      total_results: mockResults.length,
      method: 'Semantic Search (FAISS/Cosine Similarity)',
      source: 'GROQ AI + Mock Database (Fallback)',
      ai_context: aiResponse,
      metadata: {
        fallback_used: true,
        python_api_failed: true,
        search_method: 'mock_similarity',
        top_k_requested: top_k
      },
      timestamp: new Date().toISOString()
    };

    console.log('Medicine search completed successfully via GROQ + mock fallback');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in medicine-search function:', error);
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
