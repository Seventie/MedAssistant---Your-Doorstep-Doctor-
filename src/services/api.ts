// src/services/api.ts - WORKING VERSION (back to Supabase with proper error handling)
import { supabase } from "@/integrations/supabase/client";

// Logging utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[API] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[API ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[API WARN] ${new Date().toISOString()} - ${message}`, data || '');
  }
};

export interface Medicine {
  id: string;
  name: string;
  condition: string;
  usage: string;
  sideEffects: string[];
  dosage: string;
}

export interface QAResponse {
  status: string;
  question: string;
  answer: string;
  source: string;
  metadata?: {
    retrieval_method: string;
    generation_method: string;
    context_used: number;
    top_k: number;
  };
  timestamp?: string;
}

export interface RecommendationResponse {
  status: string;
  symptoms: string[];
  additional_info: string;
  recommendations: Array<{
    drug_name: string;
    medical_condition: string;
    side_effects: string;
    relevance_score?: number;
    recommendation_reason?: string;
  }>;
  ai_advice?: string;
  total_recommendations: number;
  source: string;
  timestamp?: string;
}

export interface SearchResponse {
  status: string;
  query: string;
  results: Array<{
    drug_name: string;
    medical_condition: string;
    side_effects: string;
    score: number;
  }>;
  total_found: number;
  source: string;
  timestamp?: string;
}

export interface VisualizationData {
  ner?: any;
  knowledgeGraph?: any;
  embeddings?: any;
}

// Medical Q&A - Fixed version
// Medical Q&A (local Flask)
export async function askMedicalQuestion(question: string): Promise<QAResponse> {
  logger.info('Asking medical question (local Flask)', { question });
  try {
    const res = await fetch('http://localhost:5001/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    logger.error('Flask QA error', error);
    return {
      status: 'error',
      question,
      answer: 'Service unavailable.',
      source: 'Flask Fallback',
      timestamp: new Date().toISOString()
    };
  }
}

// Medicine Recommendations (local Flask)
export async function getMedicineRecommendations(
  symptoms: string[],
  additionalInfo?: string
): Promise<RecommendationResponse> {
  logger.info('Getting medicine recommendations (local Flask)', { symptoms, additionalInfo });

  try {
    const res = await fetch('http://localhost:5002/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, additional_info: additionalInfo || '' })
    });

    // Check for HTTP errors
    if (!res.ok) {
      const text = await res.text();
      logger.error('Flask returned non-OK response', text);
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    logger.info('Received recommendation response', data);
    return data;
  } catch (error) {
    logger.error('Error getting recommendations', error);
    return {
      status: 'error',
      symptoms,
      additional_info: additionalInfo || '',
      recommendations: [],
      ai_advice: 'The recommendation service is currently unavailable. Please try again later.',
      total_recommendations: 0,
      source: 'Local Flask Fallback',
      timestamp: new Date().toISOString()
    };
  }
}



// Medicine Search - Use LOCAL search only (skip Supabase)
export async function searchMedicines(query: string): Promise<SearchResponse> {
  logger.info('Using local medicine search only', { query });
  
  // Return a simple response that tells user to use the search page
  return {
    status: 'redirect',
    query: query,
    results: [],
    total_found: 0,
    source: 'Local Search Component',
    timestamp: new Date().toISOString()
  };
}

// Get drug details
export async function getDrugDetails(name: string): Promise<any> {
  logger.info('Getting drug details', { name });
  return searchMedicines(name);
}

// Visualizations - Simple fallback
export async function getVisualizationData(type: 'ner' | 'knowledge-graph' | 'embeddings'): Promise<any> {
  logger.info('Getting visualization data', { type });
  
  return {
    status: 'unavailable',
    type: type,
    message: 'Visualizations are currently unavailable',
    timestamp: new Date().toISOString()
  };
}

// Similarity search - Simple fallback
export async function searchSimilar(query: string, topK: number = 5): Promise<any> {
  logger.info('Performing similarity search', { query, topK });
  
  return {
    status: 'unavailable',
    query: query,
    results: [],
    message: 'Similarity search is currently unavailable',
    timestamp: new Date().toISOString()
  };
}
