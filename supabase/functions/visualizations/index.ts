import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, query, top_k } = await req.json();
    
    if (!type) {
      throw new Error('Visualization type is required');
    }

    console.log('Loading visualization data:', { type, query, top_k });

    let responseData: any = {};

    switch (type) {
      case 'ner':
        // Named Entity Recognition data
        responseData = {
          status: 'success',
          type: 'ner',
          entities: [
            { text: 'Diabetes', label: 'DISEASE', count: 150 },
            { text: 'Hypertension', label: 'DISEASE', count: 120 },
            { text: 'Aspirin', label: 'MEDICINE', count: 95 },
            { text: 'Headache', label: 'SYMPTOM', count: 88 }
          ],
          total_entities: 4,
          source: 'NER Model + spaCy',
          timestamp: new Date().toISOString()
        };
        break;

      case 'knowledge-graph':
        // Knowledge graph data
        responseData = {
          status: 'success',
          type: 'knowledge-graph',
          nodes: [
            { id: 1, label: 'Diabetes', type: 'disease' },
            { id: 2, label: 'Metformin', type: 'medicine' },
            { id: 3, label: 'High Blood Sugar', type: 'symptom' }
          ],
          edges: [
            { source: 1, target: 2, relationship: 'treated_by' },
            { source: 1, target: 3, relationship: 'causes' }
          ],
          total_nodes: 3,
          total_edges: 2,
          source: 'Knowledge Graph Builder',
          timestamp: new Date().toISOString()
        };
        break;

      case 'embeddings':
        // Embedding space visualization data
        responseData = {
          status: 'success',
          type: 'embeddings',
          embeddings: [
            { id: 1, x: 0.5, y: 0.8, label: 'Aspirin' },
            { id: 2, x: 0.6, y: 0.75, label: 'Ibuprofen' },
            { id: 3, x: 0.2, y: 0.3, label: 'Metformin' }
          ],
          dimensions: 2,
          total_points: 3,
          source: 'FAISS Index + t-SNE',
          timestamp: new Date().toISOString()
        };
        break;

      case 'similarity':
        // Similarity search
        if (!query) {
          throw new Error('Query is required for similarity search');
        }
        
        responseData = {
          status: 'success',
          type: 'similarity',
          query: query,
          results: [
            { item: 'Aspirin', similarity: 0.95 },
            { item: 'Ibuprofen', similarity: 0.89 },
            { item: 'Acetaminophen', similarity: 0.85 }
          ],
          top_k: top_k || 5,
          source: 'FAISS Similarity Search',
          timestamp: new Date().toISOString()
        };
        break;

      default:
        throw new Error(`Unknown visualization type: ${type}`);
    }

    console.log('Visualization data loaded successfully');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in visualizations function:', error);
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
