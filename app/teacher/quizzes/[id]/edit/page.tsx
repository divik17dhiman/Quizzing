"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

interface Question {
  id: string;
  type: 'mcq' | 'text' | 'true_false';
  question: string;
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  order: number;
  image_url: string | null;
}

const questionSchema = z.object({
  type: z.enum(['mcq', 'text', 'true_false']),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).optional(),
  correct_answer: z.string().optional(),
  points: z.number().min(1),
  image_url: z.string().optional(),
});

export default function EditQuiz({ params }: { params: { id: string } }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: 'mcq',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
      image_url: '',
    },
  });

  useEffect(() => {
    fetchQuizAndQuestions();
  }, [params.id]);

  async function fetchQuizAndQuestions() {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.push("/teacher/login");
        return;
      }

      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", params.id)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", params.id)
        .order("order", { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch quiz data.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof questionSchema>) {
    setIsLoading(true);
    try {
      const newOrder = questions.length;
      const { data, error } = await supabase.from("questions").insert([
        {
          quiz_id: params.id,
          type: values.type,
          question: values.question,
          options: values.type === 'mcq' ? values.options : null,
          correct_answer: values.correct_answer,
          points: values.points,
          order: newOrder,
          image_url: values.image_url || null,
        },
      ]).select();

      if (error) throw error;

      toast({
        title: "Question added successfully",
      });

      form.reset();
      fetchQuizAndQuestions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add question.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Quiz: {quiz?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Access Key: {quiz?.access_key}
              </p>
            </div>
            <Button onClick={() => router.push("/teacher/dashboard")}>
              Back to Dashboard
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="text">Text Answer</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your question"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("type") === "mcq" && (
                    <div className="space-y-4">
                      <FormLabel>Options</FormLabel>
                      {[0, 1, 2, 3].map((index) => (
                        <Input
                          key={index}
                          placeholder={`Option ${index + 1}`}
                          {...form.register(`options.${index}`)}
                        />
                      ))}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="correct_answer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Answer</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter correct answer"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Question"}
                  </Button>
                </form>
              </Form>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Questions</h2>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={question.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <DragHandleDots2Icon className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">
                            {index + 1}. {question.question}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {question.points} pts
                          </span>
                        </div>
                        {question.type === 'mcq' && question.options && (
                          <div className="mt-2 space-y-1">
                            {question.options.map((option, i) => (
                              <div
                                key={i}
                                className={`text-sm ${
                                  option === question.correct_answer
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {questions.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No questions added yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}