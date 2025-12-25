"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import BackgroundEmojis from "@/components/BackgroundEmojis";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDemoLogin() {
    setIsLoading(true);
    try {
      // 1. Seed the account
      const seedRes = await fetch('/api/seed', { method: 'POST' });
      if (!seedRes.ok) throw new Error("Failed to seed demo account");
      const { email, password } = await seedRes.json();

      // 2. Sign in
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result || result.error) {
        setErrorMessage("Demo login failed");
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
      setErrorMessage("Could not start demo mode");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      // Debugging help: log the raw result
      console.log("signIn result:", result);

      // Handle possible outcomes. In some setups result may be undefined,
      // so treat that as a failure and show a message.
      if (!result || result.error) {
        let msg = "Invalid email or password.";
        // Handle specific error codes if needed, or just default to generic for security
        if (result?.error === "CredentialsSignin" || result?.error === "CredentialsSignal") {
          msg = "Invalid email or password.";
        } else {
          // Fallback for other errors
          msg = result?.error || "Login failed.";
        }

        setErrorMessage(msg);
        console.error("Login failed (code):", result?.error);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Unexpected login error", err);
      setErrorMessage(
        "An unexpected error occurred. Check console for details."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-neutral-50 dark:bg-gray-950 transition-colors duration-300">
      <BackgroundEmojis />
      <Card className="w-full max-w-md relative z-10 bg-white/30 dark:bg-black/30 backdrop-blur-md shadow-xl border-white/20 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-blue-600 dark:text-blue-400">Login</CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300">
            Welcome back! Please login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-200">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} className="bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-200">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="********"
                        {...field}
                        className="bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
                <span className="bg-transparent px-2 text-xs text-gray-500 uppercase">Or</span>
                <div className="border-t border-gray-300 dark:border-gray-600 w-full"></div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                disabled={isLoading}
              >
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full border-blue-400 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/30"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                Try Demo Account
              </Button>
              {errorMessage && (
                <p className="mt-2 text-sm text-destructive text-center">
                  {errorMessage}
                </p>
              )}
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="underline hover:text-blue-600 dark:hover:text-blue-400">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
