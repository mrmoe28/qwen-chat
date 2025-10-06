"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SignInValues {
  email: string;
  password: string;
}

interface MagicLinkValues {
  email: string;
}

export function SignInForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = React.useState(false);
  const [signInMode, setSignInMode] = React.useState<"credentials" | "magic">("magic");
  
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register: registerMagic,
    handleSubmit: handleSubmitMagic,
    formState: { isSubmitting: isSubmittingMagic },
  } = useForm<MagicLinkValues>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: SignInValues) => {
    setErrorMessage(null);
    const email = values.email.trim().toLowerCase();
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password: values.password,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setErrorMessage("Invalid email or password.");
      return;
    }

    if (result?.ok) {
      window.location.href = result?.url ?? "/dashboard";
    } else {
      router.push(result?.url ?? "/dashboard");
    }
  };

  const onMagicLinkSubmit = async (values: MagicLinkValues) => {
    setErrorMessage(null);
    const email = values.email.trim().toLowerCase();
    
    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setErrorMessage("Failed to send magic link. Please try again.");
      return;
    }

    setMagicLinkSent(true);
  };

  if (magicLinkSent) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3">
          <p className="text-sm text-green-600">
            Check your email! We&apos;ve sent you a magic link to sign in.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            setMagicLinkSent(false);
            setErrorMessage(null);
          }}
          className="w-full"
        >
          Send another link
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex space-x-1 rounded-md bg-muted p-1">
        <Button
          type="button"
          variant={signInMode === "magic" ? "default" : "ghost"}
          size="sm"
          className="flex-1 text-xs"
          onClick={() => setSignInMode("magic")}
        >
          Magic Link
        </Button>
        <Button
          type="button"
          variant={signInMode === "credentials" ? "default" : "ghost"}
          size="sm"
          className="flex-1 text-xs"
          onClick={() => setSignInMode("credentials")}
        >
          Password
        </Button>
      </div>

      {signInMode === "magic" ? (
        <form onSubmit={handleSubmitMagic(onMagicLinkSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email</Label>
            <Input 
              id="magic-email" 
              type="email" 
              autoComplete="email" 
              placeholder="Enter your email"
              {...registerMagic("email")} 
            />
          </div>
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <Button type="submit" className="w-full" disabled={isSubmittingMagic}>
            {isSubmittingMagic ? "Sending..." : "Send Magic Link"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link 
                href="/forgot-password" 
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          </div>
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      )}
    </div>
  );
}
