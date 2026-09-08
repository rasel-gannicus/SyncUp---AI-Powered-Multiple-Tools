"use client";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { CustomLoadingSpinner } from "@/utils/Loading Spinner/Loading Skeleton/Skeleton";
import { withAuthRedirect } from "@/utils/Route Protection/RouteProtection";
import auth from "@/utils/firebase.init";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { toast } from "react-hot-toast";
import { FaUnlock } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import SocialLogin from "../Social Login/SocialLogin";


function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState('login');


  const handleAutofillCredentials = () => {
    setEmail('rasel@gmail.com');
    setPassword('aaaaaa');
  };

  // Firebase hook for creating a user with email and password
  const [signIn, user, loading, error] = useSignInWithEmailAndPassword(auth);

  // Function to handle form submission for registration
  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    // Check if password meets minimum length requirement
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters", {
        position: "bottom-right",
      });
    }

    setIsLoading(true);
    try {
      // Attempt to create user with email and password using Firebase
      await signIn(email, password);
    } catch (err) {
      toast.error("Error creating account", { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  // Use effect hook to manage toast messages based on loading, error, and user states
  useEffect(() => {
    let toastId: any;
    if (loading) {
      toastId = toast.loading("Logging in...", {
        position: "bottom-right",
      });
    } else if (error) {
      toast.error(error.message || "Error Logging in", {
        position: "bottom-right",
      });
    } else if (user) {
      toast.success("Logged in successfully!", {
        position: "bottom-right",
      });
    }
    // Dismiss the loading toast when the component unmounts or updates
    return () => toast.dismiss(toastId);
  }, [loading, error, user]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <>
      <div className="text-gray-400 mb-8 text-center">
        <p> --- You may try this credential for testing: --- </p>
        <p className="text-sm text-slate-600 dark:text-gray-300"> Email: rasel@gmail.com</p>
        <p className="text-sm text-slate-600 dark:text-gray-300">Password: aaaaaa</p>
        <Button
          className={`mt-3 bg-gray-400 dark:bg-slate-500 text-white font-semibold py-3 rounded-md hover:bg-gray-600 duration-100 ${loading && "opacity-50 pointer-events-none"
            }`}
          disabled={loading}
          onClick={handleAutofillCredentials}
        >
          {loading ? <CustomLoadingSpinner /> : "Auto fill this credential"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or phone number"
              type="email"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg pl-10"
              disabled={isLoading}
              required
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {/* Email icon placeholder */}
              <MdEmail className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="relative">
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg pl-10"
              disabled={isLoading}
              required
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {/* Password icon placeholder */}
              <FaUnlock className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Link href="/authentication/forgotPassword" className="text-[#00A9A5]">
            Forgot your password?
          </Link>
          <Button
            type="submit"
            className="px-8 py-2 bg-[#00A9A5] text-white rounded-lg hover:bg-[#008B87] transition-colors"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span>Loading</span>
                <CustomLoadingSpinner />
              </div>
            ) : (
              "Login"
            )}
          </Button>
        </div>
      </form>

      <SocialLogin isLoading={isLoading} />
    </>
  );
}

export default withAuthRedirect(Login);
