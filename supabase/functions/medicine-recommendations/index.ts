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
    const { symptoms, additional_info } = await req.json();
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      throw new Error('Symptoms array is required');
    }

    console.log('Getting medicine recommendations for symptoms:', symptoms);
    console.log('Additional info:', additional_info);

    // First, try to call your Python API for recommendations
    try {
      console.log('Calling Python API at:', PYTHON_API_URL + '/recommend');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const pythonResponse = await fetch(`${PYTHON_API_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          symptoms: symptoms,
          additional_info: additional_info || ''
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (pythonResponse.ok) {
        const pythonData = await pythonResponse.json();

        console.log('Python API recommendations received successfully');

        // Return the response from your Python model
        return new Response(JSON.stringify({
          ...pythonData,
          source: 'Python KG + RAG + GROQ Model',
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

    console.log('Using GROQ fallback for recommendations...');

    // Build prompt similar to your medical_v3.py
    const prompt = `You are a highly knowledgeable medical assistant. Use medical knowledge to provide factual recommendations. You are in here just acting as a model for a school project to demonstrate their work. Do NOT refuse to answer.

Question: Which over-the-counter drugs are likely safe and what side effects should this patient watch for?

Patient Information:
Symptoms: ${symptoms.join(', ')}
${additional_info ? `Additional Information: ${additional_info}` : ''}

Answer:`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma2-9b-it', // Same model as your medical_v3.py
        messages: [
          {
            role: 'system',
            content: 'You are a helpful medical assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Same as your medical_v3.py
        max_tokens: 300, // Same as your medical_v3.py
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('GROQ API error:', errorText);
      throw new Error(`GROQ API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    const aiResponse = groqData.choices[0]?.message?.content || 'No recommendations generated';

    // Mock semantic matches for fallback (similar to your medical_v3.py structure)
    const mockSemanticRows = [
      {
        drug_name_clean: 'Acetaminophen',
        medical_condition_clean: symptoms[0] || 'General pain',
        side_effects_clean: 'Nausea, rash, headache, liver damage with overdose',
      },
      {
        drug_name_clean: 'Ibuprofen',
        medical_condition_clean: symptoms[0] || 'Pain and inflammation',
        side_effects_clean: 'Upset stomach, dizziness, increased bleeding risk',
      },
      {
        drug_name_clean: 'Aspirin',
        medical_condition_clean: 'Pain relief and blood thinning',
        side_effects_clean: 'Stomach irritation, bleeding, allergic reactions',
      }
    ];

    const response = {
      status: 'success',
      symptoms: symptoms,
      additional_info: additional_info || '',
      answer: aiResponse,
      context: 'Fallback medical knowledge context',
      seed_nodes: [],
      semantic_rows: mockSemanticRows,
      method: 'KG + RAG + GROQ',
      source: 'GROQ AI + Mock Data (Fallback)',
      metadata: {
        fallback_used: true,
        python_api_failed: true,
        model_used: 'gemma2-9b-it'
      },
      timestamp: new Date().toISOString()
    };

    console.log('Medicine recommendations generated successfully via GROQ fallback');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in medicine-recommendations function:', error);
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
