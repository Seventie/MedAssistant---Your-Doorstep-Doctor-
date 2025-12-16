// src/pages/Visualizations.tsx - Display your generated visualizations
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Network, Sparkles, Brain, Download, Eye, Zap } from "lucide-react";

const Visualizations = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Your actual visualization files
  const visualizationFiles = {
    ner: [
      { 
        name: "Entity Type Distribution", 
        file: "/visualizations/ner_entity_distribution.png", 
        description: "Distribution of medical entity types extracted from your dataset using SpaCy NLP" 
      },
      { 
        name: "Entity Types Breakdown", 
        file: "/visualizations/ner_entity_pie.png", 
        description: "Pie chart showing proportion of different medical entity types" 
      },
      { 
        name: "Entity Text Length Analysis", 
        file: "/visualizations/ner_text_lengths.png", 
        description: "Distribution of entity text lengths in your NER dataset" 
      },
    ],
    knowledgeGraph: [
      { 
        name: "Medical Knowledge Network", 
        file: "/visualizations/knowledge_graph_network.png", 
        description: "Network visualization of your medical_kg.graphml file showing drug-condition relationships" 
      },
      { 
        name: "Node Degree Distribution", 
        file: "/visualizations/kg_degree_distribution.png", 
        description: "Distribution of node connections in your knowledge graph" 
      },
      { 
        name: "Graph Statistics", 
        file: "/visualizations/kg_statistics.png", 
        description: "Key metrics and statistics from your medical knowledge graph" 
      },
    ],
    embeddings: [
      { 
        name: "PCA Embeddings Space", 
        file: "/visualizations/embeddings_pca.png", 
        description: "2D visualization of your corpus_embeddings.npy using PCA dimensionality reduction" 
      },
      { 
        name: "t-SNE Clustering", 
        file: "/visualizations/embeddings_tsne.png", 
        description: "t-SNE visualization showing semantic clusters in your embedding space" 
      },
      { 
        name: "K-Means Clusters", 
        file: "/visualizations/embeddings_clusters.png", 
        description: "K-means clustering of your medical text embeddings" 
      },
      { 
        name: "Embedding Statistics", 
        file: "/visualizations/embeddings_statistics.png", 
        description: "Statistical analysis of your embedding vectors" 
      },
    ],
    system: [
      { 
        name: "System Architecture", 
        file: "/visualizations/system_architecture.png", 
        description: "Complete architecture of your Medical AI system" 
      },
    ]
  };

  const ImageDisplay = ({ src, alt, description }: { src: string; alt: string; description: string }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          {!imageError ? (
            <div className="space-y-4">
              <div className="relative bg-gray-50">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <img 
                  src={src} 
                  alt={alt}
                  className={`w-full h-auto max-h-80 object-contain bg-white transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-lg text-gray-800 mb-2">{alt}</h4>
                <p className="text-sm text-gray-600">{description}</p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(src, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Size
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = src;
                      link.download = alt.replace(/\s+/g, '_').toLowerCase() + '.png';
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-600 mb-2">{alt}</h4>
              <p className="text-sm text-gray-500 mb-4">{description}</p>
              <p className="text-xs text-gray-400 mb-4">
                Visualization not generated yet
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                <Zap className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <BarChart3 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Medical AI Visualizations</h1>
          <p className="text-lg text-gray-600">
            Interactive visualizations of your NLP models and medical knowledge system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="ner">NER Analysis</TabsTrigger>
            <TabsTrigger value="knowledge-graph">Knowledge Graph</TabsTrigger>
            <TabsTrigger value="embeddings">Vector Embeddings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              {/* System Architecture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    Medical AI System Architecture
                  </CardTitle>
                  <CardDescription>
                    Complete overview of your NLP pipeline and data flow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {visualizationFiles.system.map((viz, index) => (
                    <ImageDisplay 
                      key={index}
                      src={viz.file}
                      alt={viz.name}
                      description={viz.description}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Data Statistics */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="text-center">
                  <CardHeader>
                    <Sparkles className="h-12 w-12 text-purple-600 mx-auto" />
                    <CardTitle>NER Entities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">2931+</p>
                    <p className="text-sm text-gray-600">Medical entities extracted</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <Network className="h-12 w-12 text-green-600 mx-auto" />
                    <CardTitle>Knowledge Graph</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">GraphML</p>
                    <p className="text-sm text-gray-600">Drug-condition relationships</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <BarChart3 className="h-12 w-12 text-blue-600 mx-auto" />
                    <CardTitle>Vector Embeddings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">FAISS</p>
                    <p className="text-sm text-gray-600">High-dimensional vectors</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ner" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Named Entity Recognition Analysis
                </CardTitle>
                <CardDescription>
                  Medical entities extracted from your ner_entities.csv file using SpaCy NLP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visualizationFiles.ner.map((viz, index) => (
                    <ImageDisplay 
                      key={index}
                      src={viz.file}
                      alt={viz.name}
                      description={viz.description}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge-graph" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-green-600" />
                  Medical Knowledge Graph
                </CardTitle>
                <CardDescription>
                  Network visualization from your medical_kg.graphml file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visualizationFiles.knowledgeGraph.map((viz, index) => (
                    <ImageDisplay 
                      key={index}
                      src={viz.file}
                      alt={viz.name}
                      description={viz.description}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="embeddings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Vector Embeddings & FAISS Analysis
                </CardTitle>
                <CardDescription>
                  Visualization of your corpus_embeddings.npy file and FAISS vector space
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {visualizationFiles.embeddings.map((viz, index) => (
                    <ImageDisplay 
                      key={index}
                      src={viz.file}
                      alt={viz.name}
                      description={viz.description}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Visualizations;
