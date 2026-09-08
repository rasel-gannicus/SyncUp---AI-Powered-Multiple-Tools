"use client";
import { useEffect, useState } from 'react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Card } from "@/Components/ui/card";
import { toast } from "react-hot-toast";
import { Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSendPasswordResetEmail } from 'react-firebase-hooks/auth';
import auth from '@/utils/firebase.init';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sendPasswordResetEmail, sending, error] = useSendPasswordResetEmail(
    auth
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      const success = await sendPasswordResetEmail(email);
      if(success){
        toast.success('Reset password instructions sent to your email.');
        router.push('forgotPassword/successMessage');
      }
      
    } catch (error) {
      alert('Something went wrong');
      toast.error('Something went wrong. Please try again.');
    } 
  };

  useEffect(() => {
    let toastId: any;
    if (sending) {
      toastId = toast.loading("Sending reset password informations...", {
        position: "bottom-center",
      });
    } else if (error) {
      toast.error(error.message || "Error resetting password", {
        position: "bottom-center",
      });
    } 
    // Dismiss the loading toast when the component unmounts or updates
    return () => toast.dismiss(toastId);
  }, [sending,error,sendPasswordResetEmail]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-100">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Forgot Password?</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={sending}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-900"
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Reset Password'}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push('/login')}
            disabled={sending}
          >
            Back to Login
          </Button>
        </form>
      </Card>
    </div>
  );
}