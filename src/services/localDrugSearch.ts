// src/services/localDrugSearch.ts - WITH AUTOCOMPLETE
import { drugsData, Drug, SearchResult, loadDrugsData } from '../data/drugs-data';

export interface AutocompleteResult {
  value: string;
  type: 'drug_name' | 'brand_name' | 'condition' | 'drug_class';
  count: number;
}

export class LocalDrugSearch {
  private data: Drug[] = [];
  private isLoaded = false;
  private autocompleteIndex: {
    drugNames: string[];
    brandNames: string[];
    conditions: string[];
    drugClasses: string[];
  } = {
    drugNames: [],
    brandNames: [],
    conditions: [],
    drugClasses: []
  };

  async initialize() {
    if (!this.isLoaded) {
      this.data = await loadDrugsData();
      this.buildAutocompleteIndex();
      this.isLoaded = true;
    }
  }

  private buildAutocompleteIndex() {
    const drugNames = new Set<string>();
    const brandNames = new Set<string>();
    const conditions = new Set<string>();
    const drugClasses = new Set<string>();

    this.data.forEach(drug => {
      // Generic names
      if (drug.generic_name.trim()) {
        drugNames.add(drug.generic_name.toLowerCase().trim());
      }

      // Brand names (split by comma)
      if (drug.brand_names) {
        drug.brand_names.split(',').forEach(brand => {
          const cleanBrand = brand.trim();
          if (cleanBrand) brandNames.add(cleanBrand.toLowerCase());
        });
      }

      // Medical conditions (split by comma)
      if (drug.medical_condition) {
        drug.medical_condition.split(',').forEach(condition => {
          const cleanCondition = condition.trim();
          if (cleanCondition) conditions.add(cleanCondition.toLowerCase());
        });
      }

      // Drug classes (split by comma) 
      if (drug.drug_classes) {
        drug.drug_classes.split(',').forEach(drugClass => {
          const cleanClass = drugClass.trim();
          if (cleanClass) drugClasses.add(cleanClass.toLowerCase());
        });
      }
    });

    this.autocompleteIndex = {
      drugNames: Array.from(drugNames).sort(),
      brandNames: Array.from(brandNames).sort(),
      conditions: Array.from(conditions).sort(),
      drugClasses: Array.from(drugClasses).sort()
    };

    console.log('✅ Autocomplete index built:', {
      drugNames: this.autocompleteIndex.drugNames.length,
      brandNames: this.autocompleteIndex.brandNames.length,
      conditions: this.autocompleteIndex.conditions.length,
      drugClasses: this.autocompleteIndex.drugClasses.length
    });
  }

  // Get autocomplete suggestions
  async getAutocomplete(query: string, mode: 'drug' | 'condition' = 'drug', limit: number = 10): Promise<AutocompleteResult[]> {
    await this.initialize();
    
    if (!query.trim() || query.length < 2) return [];

    const searchTerm = query.toLowerCase().trim();
    const suggestions: AutocompleteResult[] = [];

    if (mode === 'drug') {
      // Search in generic names
      this.autocompleteIndex.drugNames
        .filter(name => name.includes(searchTerm))
        .slice(0, 5)
        .forEach(name => {
          suggestions.push({
            value: name,
            type: 'drug_name',
            count: this.data.filter(d => d.generic_name.toLowerCase() === name).length
          });
        });

      // Search in brand names  
      this.autocompleteIndex.brandNames
        .filter(brand => brand.includes(searchTerm))
        .slice(0, 3)
        .forEach(brand => {
          suggestions.push({
            value: brand,
            type: 'brand_name',
            count: this.data.filter(d => d.brand_names.toLowerCase().includes(brand)).length
          });
        });

      // Search in drug classes
      this.autocompleteIndex.drugClasses
        .filter(drugClass => drugClass.includes(searchTerm))
        .slice(0, 2)
        .forEach(drugClass => {
          suggestions.push({
            value: drugClass,
            type: 'drug_class',
            count: this.data.filter(d => d.drug_classes.toLowerCase().includes(drugClass)).length
          });
        });

    } else {
      // Search in conditions
      this.autocompleteIndex.conditions
        .filter(condition => condition.includes(searchTerm))
        .slice(0, 8)
        .forEach(condition => {
          suggestions.push({
            value: condition,
            type: 'condition',
            count: this.data.filter(d => d.medical_condition?.toLowerCase().includes(condition)).length
          });
        });
    }

    return suggestions
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.value.startsWith(searchTerm) ? 1 : 0;
        const bExact = b.value.startsWith(searchTerm) ? 1 : 0;
        return bExact - aExact || b.count - a.count;
      })
      .slice(0, limit);
  }

  // Existing search methods (keep all your previous code)
  async search(query: string, filters: {
    rx_otc?: 'Rx' | 'OTC' | 'Rx/OTC';
    pregnancy_category?: string;
    minRating?: number;
    drugClass?: string;
  } = {}, limit: number = 20): Promise<SearchResult[]> {
    await this.initialize();
    
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    this.data.forEach(drug => {
      let score = 0;
      const matchReasons: string[] = [];
      
      // Search in generic name (highest priority)
      if (drug.generic_name.toLowerCase().includes(searchTerm)) {
        score += 100;
        matchReasons.push('Generic name match');
      }
      
      // Exact generic name match (bonus)
      if (drug.generic_name.toLowerCase() === searchTerm) {
        score += 200;
        matchReasons.push('Exact generic name match');
      }
      
      // Search in brand names
      if (drug.brand_names.toLowerCase().includes(searchTerm)) {
        score += 80;
        matchReasons.push('Brand name match');
      }
      
      // Search in drug classes
      if (drug.drug_classes.toLowerCase().includes(searchTerm)) {
        score += 60;
        matchReasons.push('Drug class match');
      }
      
      // Search in medical condition (if available)
      if (drug.medical_condition && drug.medical_condition.toLowerCase().includes(searchTerm)) {
        score += 70;
        matchReasons.push('Medical condition match');
      }
      
      // Search in side effects (if available)
      if (drug.side_effects && drug.side_effects.toLowerCase().includes(searchTerm)) {
        score += 40;
        matchReasons.push('Side effects match');
      }

      // Apply filters
      let passesFilters = true;
      
      if (filters.rx_otc && drug.rx_otc !== filters.rx_otc) {
        passesFilters = false;
      }
      
      if (filters.pregnancy_category && drug.pregnancy_category !== filters.pregnancy_category) {
        passesFilters = false;
      }
      
      if (filters.minRating && drug.rating < filters.minRating) {
        passesFilters = false;
      }
      
      if (filters.drugClass && !drug.drug_classes.toLowerCase().includes(filters.drugClass.toLowerCase())) {
        passesFilters = false;
      }

      if (score > 0 && passesFilters) {
        results.push({
          ...drug,
          relevanceScore: score,
          matchReason: matchReasons
        });
      }
    });

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Keep all other existing methods...
  async searchByCondition(condition: string, limit: number = 15): Promise<SearchResult[]> {
    await this.initialize();
    
    const searchTerm = condition.toLowerCase().trim();
    const results: SearchResult[] = [];

    this.data.forEach(drug => {
      let score = 0;
      const matchReasons: string[] = [];

      if (drug.medical_condition && drug.medical_condition.toLowerCase().includes(searchTerm)) {
        score += 100;
        matchReasons.push('Treats this condition');
      }

      if (drug.drug_classes.toLowerCase().includes(searchTerm)) {
        score += 60;
        matchReasons.push('Drug class for condition');
      }

      if (score > 0) {
        results.push({
          ...drug,
          relevanceScore: score,
          matchReason: matchReasons
        });
      }
    });

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  async getOTCDrugs(limit: number = 20): Promise<Drug[]> {
    await this.initialize();
    return this.data
      .filter(drug => drug.rx_otc === 'OTC' || drug.rx_otc === 'Rx/OTC')
      .slice(0, limit);
  }

  async getTopRatedDrugs(minRating: number = 8, limit: number = 10): Promise<Drug[]> {
    await this.initialize();
    return this.data
      .filter(drug => drug.rating >= minRating)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
}

export const drugSearch = new LocalDrugSearch();
