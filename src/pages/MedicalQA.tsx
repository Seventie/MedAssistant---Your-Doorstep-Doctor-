import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, Loader2 } from "lucide-react";
import { askMedicalQuestion, QAResponse } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const MedicalQA = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QAResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await askMedicalQuestion(question);
      setAnswer(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get answer. Please make sure the backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background py-12">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">Medical Q&A Assistant</h1>
          <p className="text-muted-foreground">Ask any medical question and get AI-powered answers</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
            <CardDescription>
              Enter your medical question below. The AI will search our medical database and provide an answer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="e.g., What are the symptoms of diabetes?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={handleAskQuestion}
              disabled={isLoading || !question.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Ask Question
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {answer && (
          <Card>
            <CardHeader>
              <CardTitle>Answer</CardTitle>
              <CardDescription className="font-medium text-foreground">
                {answer.question}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-foreground whitespace-pre-wrap">{answer.answer}</p>
              </div>
              
              {answer.metadata && (
                <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
                  <div>
                    <strong>Source:</strong> {answer.source}
                  </div>
                  <div>
                    <strong>Retrieval Method:</strong> {answer.metadata.retrieval_method}
                  </div>
                  <div>
                    <strong>Generation Method:</strong> {answer.metadata.generation_method}
                  </div>
                  <div>
                    <strong>Context Used:</strong> {answer.metadata.context_used} documents
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This is an AI-powered system for educational purposes. 
            Always consult with healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicalQA;
