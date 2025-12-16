import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Brain, Pill, Search, BarChart3, Database } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const features = [
    {
      icon: Brain,
      title: "Medical Q&A Bot",
      description: "Ask medical questions and get answers powered by RAG-based AI model trained on MedQuAD dataset",
      link: "/medical-qa",
    },
    {
      icon: Search,
      title: "Medicine Search",
      description: "Search and filter medicines based on conditions, causes, and side effects",
      link: "/medicine-search",
    },
    {
      icon: Pill,
      title: "Medicine Recommendations",
      description: "Get personalized medicine recommendations based on your symptoms",
      link: "/recommendations",
    },
    // {
    //   icon: BarChart3,
    //   title: "Data Visualizations",
    //   description: "Explore NER entities, knowledge graphs, and embedding visualizations",
    //   link: "/visualizations",
    // },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Activity className="h-20 w-20 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Medical AI Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced NLP-powered medical information system with RAG-based Q&A and intelligent medicine recommendations
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Icon className="h-8 w-8 text-primary" />
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="mt-2">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to={feature.link}>Explore</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Architecture Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <span>System Architecture</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Frontend</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• React + TypeScript</li>
                  <li>• Vite Build System</li>
                  <li>• Tailwind CSS</li>
                  <li>• shadcn/ui Components</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Backend</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Lovable Cloud</li>
                  <li>• Edge Functions</li>
                  <li>• Python ML Models</li>
                  <li>• FAISS Vector DB</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">AI Models</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• RAG Q&A System</li>
                  <li>• GROQ LLM</li>
                  <li>• Medicine Recommender</li>
                  <li>• Knowledge Graphs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datasets Section */}
        <Card>
          <CardHeader>
            <CardTitle>Datasets Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">MedQuAD Dataset</h3>
                <p className="text-sm text-muted-foreground">
                  Medical question-answer pairs for training the RAG-based Q&A system
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Drug Side Effects Dataset</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive database of medicines with conditions and side effects
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
