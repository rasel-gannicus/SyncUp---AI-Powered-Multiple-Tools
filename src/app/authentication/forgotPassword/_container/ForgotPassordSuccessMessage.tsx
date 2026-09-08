"use client";

import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordSuccessMessage() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-100">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Check Your Email
            </h1>
            <p className="text-sm text-muted-foreground">
              We have sent password reset instructions to your email address. 
              Please check your inbox and follow the link to reset your password.
            </p>
          </div>

          <div className="space-y-3 w-full">
            <Button
              className="w-full bg-purple-900"
              onClick={() => router.replace('/login')}
            >
              Return to Login
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the email?{" "}
              <button 
                onClick={() => router.replace('/authentication/forgotPassword')}
                className="text-primary hover:underline font-medium"
              >
                Try again
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}