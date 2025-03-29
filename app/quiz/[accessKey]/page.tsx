"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";
import { Timer, AlertCircle } from "lucide-react";

interface Question {
  id: string;
  type: 'mcq' | 'text' | 'true_false';
  question: string;
  options: string[] | null;
  points: number;
  order: number;
  image_url: string | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number | null;
  show_instant_results: boolean;
}

export default function TakeQuiz({ params }: { params: { accessKey: string } }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const studentName = searchParams.get("name");
  const { toast } = useToast();

  useEffect(() => {
    if (!studentName) {
      router.push("/");
      return;
    }
    fetchQuizData();
  }, [params.accessKey, studentName]);

  useEffect(() => {
    if (quiz?.time_limit && timeRemaining === null) {
      setTimeRemaining(quiz.time_limit * 60);
    }
  }, [quiz]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining !== null && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeRemaining]);

  async function fetchQuizData() {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("access_key", params.accessKey)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizData.id)
        .order("order", { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Create attempt
      const { data: attemptData, error: attemptError } = await supabase
        .from("student_attempts")
        .insert([
          {
            quiz_id: quizData.id,
            student_name: studentName,
            ip_address: "", // Will be set by RLS policy
            start_time: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (attemptError) throw attemptError;
      setAttemptId(attemptData.id);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load quiz. Please try again.",
      });
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnswerSubmit(answer: string) {
    if (!attemptId || !questions[currentQuestionIndex]) return;

    try {
      const { error } = await supabase.from("student_answers").insert([
        {
          attempt_id: attemptId,
          question_id: questions[currentQuestionIndex].id,
          answer: answer,
        },
      ]);

      if (error) throw error;

      setAnswers((prev) => ({
        ...prev,
        [questions[currentQuestionIndex].id]: answer,
      }));

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else if (quiz?.show_instant_results) {
        await handleSubmitQuiz();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit answer. Please try again.",
      });
    }
  }

  async function handleSubmitQuiz() {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("student_attempts")
        .update({
          end_time: new Date().toISOString(),
        })
        .eq("id", attemptId);

      if (error) throw error;

      if (quiz?.show_instant_results) {
        // Fetch results
        const { data, error: resultsError } = await supabase
          .from("student_attempts")
          .select("score")
          .eq("id", attemptId)
          .single();

        if (resultsError) throw resultsError;
        setScore(data.score);
        setShowResults(true);
      } else {
        router.push("/");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-lg">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-8 text-center">
            <h1 className="text-3xl font-bold mb-6">Quiz Complete!</h1>
            {score !== null && (
              <div className="mb-6">
                <p className="text-2xl font-semibold">Your Score</p>
                <p className="text-4xl font-bold text-blue-600">{score}%</p>
              </div>
            )}
            <Button onClick={() => router.push("/")}>Return Home</Button>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{quiz?.title}</h1>
            {timeRemaining !== null && (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                <Timer className="h-5 w-5" />
                <span className="font-mono">
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {currentQuestion && (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.image_url && (
                  <img
                    src={currentQuestion.image_url}
                    alt="Question"
                    className="rounded-lg mb-4 max-w-full h-auto"
                  />
                )}
              </div>

              {currentQuestion.type === "mcq" && currentQuestion.options && (
                <RadioGroup
                  onValueChange={handleAnswerSubmit}
                  value={answers[currentQuestion.id]}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "text" && (
                <div className="space-y-4">
                  <Input
                    placeholder="Type your answer here"
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerSubmit(e.target.value)}
                  />
                </div>
              )}

              {currentQuestion.type === "true_false" && (
                <RadioGroup
                  onValueChange={handleAnswerSubmit}
                  value={answers[currentQuestion.id]}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false">False</Label>
                  </div>
                </RadioGroup>
              )}

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Quiz"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    disabled={!answers[currentQuestion.id]}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}