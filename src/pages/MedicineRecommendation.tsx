import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, X, Loader2, Sparkles } from "lucide-react";
import { getMedicineRecommendations, RecommendationResponse } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const MedicineRecommendation = () => {
  const [symptom, setSymptom] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addSymptom = () => {
    if (symptom.trim() && !symptoms.includes(symptom.trim())) {
      setSymptoms([...symptoms, symptom.trim()]);
      setSymptom("");
    }
  };

  const removeSymptom = (symptomToRemove: string) => {
    setSymptoms(symptoms.filter(s => s !== symptomToRemove));
  };

  const handleGetRecommendations = async () => {
    if (symptoms.length === 0) {
      toast({
        title: "Please add at least one symptom",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await getMedicineRecommendations(symptoms, additionalInfo);
      setRecommendations(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please make sure the backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background py-12">
      <div className="container max-w-6xl">
        <div className="text-center mb-8">
          <Pill className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">Medicine Recommendations</h1>
          <p className="text-muted-foreground">
            Get personalized medicine recommendations based on your symptoms
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Your Symptoms</CardTitle>
            <CardDescription>
              Add one or more symptoms to receive AI-powered medicine recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., headache, fever, nausea"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
              />
              <Button onClick={addSymptom} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {symptoms.map((s, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {s}
                    <button
                      onClick={() => removeSymptom(s)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional Information (Optional)
              </label>
              <Textarea
                placeholder="Any additional medical history or information..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleGetRecommendations}
              disabled={isLoading || symptoms.length === 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Recommendations...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {recommendations && (
          <div className="space-y-6">
            {recommendations.ai_advice && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Medical Advice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{recommendations.ai_advice}</p>
                </CardContent>
              </Card>
            )}

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Recommended Medicines ({recommendations.total_recommendations})
              </h2>
              <div className="grid gap-4">
                {recommendations.recommendations.map((rec, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{rec.drug_name}</CardTitle>
                          <CardDescription className="mt-1">
                            {rec.medical_condition}
                          </CardDescription>
                        </div>
                        {rec.relevance_score && (
                          <Badge variant="secondary">
                            {(rec.relevance_score * 100).toFixed(0)}% relevant
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {rec.recommendation_reason && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Why This Medicine:</h4>
                          <p className="text-sm text-muted-foreground">
                            {rec.recommendation_reason}
                          </p>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Side Effects:</h4>
                        <p className="text-sm text-muted-foreground">
                          {rec.side_effects}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Disclaimer:</strong> These recommendations are AI-generated for educational purposes only. 
            Always consult with a qualified healthcare professional before taking any medication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicineRecommendation;
