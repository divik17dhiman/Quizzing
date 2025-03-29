"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PlusCircle,
  ClipboardList,
  Users,
  BarChart,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  access_key: string;
  created_at: string;
}

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        router.push("/teacher/login");
        return;
      }

      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setQuizzes(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch quizzes.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Teacher Dashboard
              </h1>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="text-gray-600 dark:text-gray-300"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-blue-500 text-white">
            <h3 className="text-lg font-semibold">Total Quizzes</h3>
            <p className="text-3xl font-bold">{quizzes.length}</p>
          </Card>
          <Card className="p-6 bg-green-500 text-white">
            <h3 className="text-lg font-semibold">Active Students</h3>
            <p className="text-3xl font-bold">0</p>
          </Card>
          <Card className="p-6 bg-purple-500 text-white">
            <h3 className="text-lg font-semibold">Questions Created</h3>
            <p className="text-3xl font-bold">0</p>
          </Card>
          <Card className="p-6 bg-orange-500 text-white">
            <h3 className="text-lg font-semibold">Total Attempts</h3>
            <p className="text-3xl font-bold">0</p>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your Quizzes
          </h2>
          <Button onClick={() => router.push("/teacher/quizzes/create")}>
            <PlusCircle className="h-5 w-5 mr-2" />
            Create New Quiz
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : quizzes.length === 0 ? (
          <Card className="p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              No quizzes yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first quiz to get started
            </p>
            <Button onClick={() => router.push("/teacher/quizzes/create")}>
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Quiz
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/teacher/quizzes/${quiz.id}`)}
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {quiz.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {quiz.description || "No description"}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Access Key: {quiz.access_key}</span>
                  <span>
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}