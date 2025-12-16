// src/data/drugs-data.ts
export interface Drug {
  generic_name: string;
  drug_classes: string;
  brand_names: string;
  activity: string;
  rx_otc: 'Rx' | 'OTC' | 'Rx/OTC';
  pregnancy_category: 'A' | 'B' | 'C' | 'D' | 'X' | 'N';
  csa: 'M' | 'U' | 'N' | '1' | '2' | '3' | '4' | '5';
  alcohol: 'X' | '';
  rating: number;
  // Add these if they exist in your CSV
  medical_condition?: string;
  side_effects?: string;
}

export interface SearchResult extends Drug {
  relevanceScore: number;
  matchReason: string[];
}

// You'll populate this with your CSV data
export let drugsData: Drug[] = [];

// Function to load CSV data (we'll implement this)
export const loadDrugsData = async () => {
  // We'll load from a JSON file converted from your CSV
  try {
    const response = await fetch('/drugs-database.json');
    const data = await response.json();
    drugsData = data;
    return data;
  } catch (error) {
    console.error('Failed to load drugs database:', error);
    // Fallback sample data
    drugsData = [
      {
        generic_name: "acetaminophen",
        drug_classes: "Analgesics",
        brand_names: "Tylenol, Panadol",
        activity: "Very High",
        rx_otc: "OTC",
        pregnancy_category: "B",
        csa: "N",
        alcohol: "",
        rating: 8.2
      },
      {
        generic_name: "ibuprofen",
        drug_classes: "NSAIDs",
        brand_names: "Advil, Motrin",
        activity: "Very High",
        rx_otc: "OTC",
        pregnancy_category: "C",
        csa: "N",
        alcohol: "",
        rating: 8.5
      }
    ];
    return drugsData;
  }
};
