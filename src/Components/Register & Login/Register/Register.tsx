"use client";
import { useAddUserToDbMutation } from "@/Redux/features/user/userApi";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { CustomLoadingSpinner } from "@/utils/Loading Spinner/Loading Skeleton/Skeleton";
import auth from "@/utils/firebase.init";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { toast } from "react-hot-toast";
import SocialLogin from "../Social Login/SocialLogin";

function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [email, setEmail] = useState("");

  // Firebase hook for creating a user with email and password
  const [createUserWithEmailAndPassword, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);

  const [
    addUserToMongoDB,
    { data, isLoading: isLoadingMongoDB, error: errorMongoDB },
  ] = useAddUserToDbMutation();

  // Function to handle form submission for registration
  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();

    // Check if passwords match
    if (password !== rePassword) {
      return toast.error("Passwords do not match", {
        position: "bottom-right",
      });
    }

    // Check if password meets minimum length requirement
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters", {
        position: "bottom-right",
      });
    }

    setIsLoading(true);
    try {
      // Attempt to create user with email and password using Firebase
      const result = await createUserWithEmailAndPassword(email, password);
      if (result?.user) {
        const response = await addUserToMongoDB({
          user: {
            ...user,
            email: result.user.email,
            uid: result.user.uid,
            provider: "email",
          },
        });
        if (!response.data.userId) {
          throw new Error("Failed to save user data to database");
        }
        toast.success("Account created and data saved successfully!", {
          position: "bottom-right",
        });
      }
    } catch (err) {
      toast.error("Error creating account", { position: "bottom-right" });
    } finally {
      setIsLoading(false);
    }
  };

  // Use effect hook to manage toast messages based on loading, error, and user states
  useEffect(() => {
    let toastId: any;
    // Show a loading toast while account creation is in progress
    if (loading) {
      toastId = toast.loading("Creating account...", {
        position: "bottom-right",
      });
      // Show an error toast if an error occurs during account creation
    } else if (error) {
      toast.error(error.message || "Error creating account", {
        position: "bottom-right",
      });
      // Show a success toast if the account is created successfully
    } else if (user) {
      toast.success("Account created successfully!", {
        position: "bottom-right",
      });
    }
    // Dismiss the loading toast when the component unmounts or updates
    return () => toast.dismiss(toastId);
  }, [loading, error, user]);

  return (
    <div className="bg-white/80 dark:bg-slate-600  rounded-xl overflow-hidden max-w-md w-full">
        <div className="mt-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-300">
              Create an account
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Keep your progress in one place!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                name="name"
                type="text"
                autoCapitalize="none"
                autoComplete="name"
                autoCorrect="off"
                disabled={isLoading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md "
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                disabled={isLoading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md "
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="rePassword"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirm Password
              </Label>
              <Input
                id="rePassword"
                value={rePassword}
                onChange={(e) => setRePassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                disabled={isLoading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <Button
              type="submit"
              className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 ${loading && "opacity-50 pointer-events-none"
                }`}
              disabled={loading}
            >
              {loading ? <div className="flex justify-center items-center gap-3"><span>Loading </span><CustomLoadingSpinner /></div> : "Register"}
            </Button>
          </form>

          <SocialLogin isLoading={isLoading} />

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
  );
}

export default Register;
