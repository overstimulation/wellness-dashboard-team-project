"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useState } from "react";
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
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await axios.post("/api/auth/register", values);
      console.log("register response:", res);
      router.push("/login");
    } catch (error: any) {
      // Axios error may have a response with a message from the server
      console.error("Registration failed", error);
      const serverMessage = error?.response?.data?.message;
      if (serverMessage) {
        setErrorMessage(`${serverMessage} (status ${error.response.status})`);
      } else if (error?.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Registration failed. Check console for details.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-neutral-50 dark:bg-gray-950 transition-colors duration-300">
      <BackgroundEmojis />
      <Card className="w-full max-w-md relative z-10 bg-white/30 dark:bg-black/30 backdrop-blur-md shadow-xl border-white/20 dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-blue-600 dark:text-blue-400">Register</CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300">Create an account to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-200">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} className="bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isLoading ? "Registering..." : "Register"}
              </Button>
              {errorMessage && (
                <p className="mt-2 text-sm text-destructive text-center">
                  {errorMessage}
                </p>
              )}
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-blue-600 dark:hover:text-blue-400">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
