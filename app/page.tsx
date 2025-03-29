"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GraduationCap, BookOpen } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [accessKey, setAccessKey] = useState("");
  const [studentName, setStudentName] = useState("");
  const router = useRouter();

  const handleStudentAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessKey && studentName) {
      router.push(`/quiz/${accessKey}?name=${encodeURIComponent(studentName)}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to QuizMaster
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Create and take quizzes with ease
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-center mb-6">
              <GraduationCap className="w-12 h-12 mx-auto text-blue-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">I'm a Teacher</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Create and manage your quizzes
              </p>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/teacher/login")}
            >
              Login / Sign Up
            </Button>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-center mb-6">
              <BookOpen className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">I'm a Student</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Take a quiz using an access key
              </p>
            </div>
            <form onSubmit={handleStudentAccess} className="space-y-4">
              <Input
                placeholder="Enter your name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
              <Input
                placeholder="Enter quiz access key"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" size="lg">
                Start Quiz
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}