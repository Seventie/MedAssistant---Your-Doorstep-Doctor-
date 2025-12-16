// src/pages/MedicineSearch.tsx
import { useState, useEffect } from 'react';
import { Search, Pill, Info, AlertTriangle, Shield, Star, Filter } from 'lucide-react';
import { drugSearch, SearchResult } from '../services/localDrugSearch';
import { Drug } from '../data/drugs-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MedicineSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'drug' | 'condition'>('drug');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    rx_otc: '',
    pregnancy_category: '',
    minRating: 0,
    drugClass: ''
  });

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    
    try {
      const searchResults = searchMode === 'drug' 
        ? await drugSearch.search(query, filters)
        : await drugSearch.searchByCondition(query);
      
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({
      rx_otc: '',
      pregnancy_category: '',
      minRating: 0,
      drugClass: ''
    });
  };

  const getPregnancyCategoryColor = (category: string) => {
    const colors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800', 
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'X': 'bg-red-100 text-red-800',
      'N': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getRxOtcColor = (type: string) => {
    const colors = {
      'OTC': 'bg-green-100 text-green-800',
      'Rx': 'bg-blue-100 text-blue-800',
      'Rx/OTC': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Pill className="w-10 h-10 text-blue-600" />
            Medicine Database Search
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Search our comprehensive database with detailed information about medicines, drug classes, and safety profiles
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Medicines
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={searchMode === 'drug' ? 'default' : 'outline'}
                onClick={() => setSearchMode('drug')}
                size="sm"
              >
                Search by Drug Name
              </Button>
              <Button
                variant={searchMode === 'condition' ? 'default' : 'outline'}
                onClick={() => setSearchMode('condition')}
                size="sm"
              >
                Search by Medical Condition
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                  <Select value={filters.rx_otc} onValueChange={(value) => setFilters(prev => ({...prev, rx_otc: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="OTC">Over-the-Counter</SelectItem>
                      <SelectItem value="Rx">Prescription Only</SelectItem>
                      <SelectItem value="Rx/OTC">Prescription or OTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Pregnancy Category</label>
                  <Select value={filters.pregnancy_category} onValueChange={(value) => setFilters(prev => ({...prev, pregnancy_category: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="A">Category A (Safest)</SelectItem>
                      <SelectItem value="B">Category B (Safe)</SelectItem>
                      <SelectItem value="C">Category C (Caution)</SelectItem>
                      <SelectItem value="D">Category D (Risk)</SelectItem>
                      <SelectItem value="X">Category X (Avoid)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Min Rating</label>
                  <Select value={filters.minRating.toString()} onValueChange={(value) => setFilters(prev => ({...prev, minRating: parseInt(value)}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any rating</SelectItem>
                      <SelectItem value="6">6+ Stars</SelectItem>
                      <SelectItem value="7">7+ Stars</SelectItem>
                      <SelectItem value="8">8+ Stars</SelectItem>
                      <SelectItem value="9">9+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder={
                  searchMode === 'drug' 
                    ? "Enter drug name (e.g., acetaminophen, aspirin)" 
                    : "Enter condition (e.g., pain, diabetes, hypertension)"
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !query.trim()}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Search Results ({results.length} found)
            </h2>
            
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {results.map((drug, index) => (
                <Card key={index} className="hover:shadow-xl transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <span className="text-lg text-blue-700 capitalize">{drug.generic_name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRxOtcColor(drug.rx_otc)}>
                            {drug.rx_otc}
                          </Badge>
                          <Badge className={getPregnancyCategoryColor(drug.pregnancy_category)}>
                            Pregnancy: {drug.pregnancy_category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-semibold">{drug.rating}/10</span>
                        </div>
                        <span className="text-xs text-gray-500">Score: {drug.relevanceScore}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Brand Names */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-sm">Brand Names:</span>
                      </div>
                      <p className="text-sm text-gray-700 ml-6">
                        {drug.brand_names || 'Not specified'}
                      </p>
                    </div>

                    {/* Drug Class */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-sm">Drug Class:</span>
                      </div>
                      <p className="text-sm text-gray-700 ml-6">
                        {drug.drug_classes}
                      </p>
                    </div>

                    {/* Medical Condition */}
                    {drug.medical_condition && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Info className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-sm">Used for:</span>
                        </div>
                        <p className="text-sm text-gray-700 ml-6">
                          {drug.medical_condition}
                        </p>
                      </div>
                    )}

                    {/* Side Effects */}
                    {drug.side_effects && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="font-semibold text-sm">Side effects:</span>
                        </div>
                        <p className="text-sm text-gray-700 ml-6">
                          {drug.side_effects}
                        </p>
                      </div>
                    )}

                    {/* Safety Information */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {drug.alcohol === 'X' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Alcohol Interaction
                        </Badge>
                      )}
                      {drug.csa !== 'N' && drug.csa !== 'U' && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Controlled: Schedule {drug.csa}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        Activity: {drug.activity}
                      </Badge>
                    </div>

                    {/* Match Reasons */}
                    <div className="pt-2">
                      <span className="text-xs text-gray-500">
                        Match: {drug.matchReason.join(', ')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {query && !isSearching && results.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No medicines found
              </h3>
              <p className="text-gray-500">
                Try searching with a different drug name, brand name, or medical condition
              </p>
            </CardContent>
          </Card>
        )}

        {/* Popular Searches & Categories */}
        {!query && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Popular Searches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Acetaminophen', 'Ibuprofen', 'Aspirin', 'Metformin', 'Lisinopril', 'Pain relief', 'Diabetes', 'Blood pressure'].map((term) => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuery(term);
                        setSearchMode(['Pain relief', 'Diabetes', 'Blood pressure'].includes(term) ? 'condition' : 'drug');
                      }}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsSearching(true);
                      const otcDrugs = await drugSearch.getOTCDrugs();
                      setResults(otcDrugs.map(drug => ({
                        ...drug,
                        relevanceScore: drug.rating * 10,
                        matchReason: ['Over-the-counter medicine']
                      })));
                      setIsSearching(false);
                      setQuery('OTC Medicines');
                    }}
                  >
                    OTC Medicines
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsSearching(true);
                      const topRated = await drugSearch.getTopRatedDrugs();
                      setResults(topRated.map(drug => ({
                        ...drug,
                        relevanceScore: drug.rating * 10,
                        matchReason: ['Highly rated medicine']
                      })));
                      setIsSearching(false);
                      setQuery('Top Rated Medicines');
                    }}
                  >
                    Highly Rated
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineSearch;
