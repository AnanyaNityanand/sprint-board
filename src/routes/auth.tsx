import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SquareKanban as KanbanSquare } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/oauth/index";
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from "@/lib/schemas";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Sprint Board" },
      {
        name: "description",
        content: "Log in or create your Sprint Board account to manage projects and sprint tasks.",
      },
      { property: "og:title", content: "Sign in — Sprint Board" },
      { property: "og:description", content: "Log in or create your Sprint Board account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");
  const [checkEmail, setCheckEmail] = useState(false);
  // The Lovable OAuth broker endpoint is only served by the hosted runtime.
  // Probe it so we only offer Google sign-in where it's actually configured.
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/~oauth/initiate", { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        setGoogleReady(res.status !== 404);
      })
      .catch(() => {
        if (!cancelled) setGoogleReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Link to="/" className="mx-auto mb-8 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <KanbanSquare className="size-4" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-bold">Sprint Board</span>
        </Link>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle>{tab === "signin" ? "Welcome back" : "Create your account"}</CardTitle>
            <CardDescription>
              {tab === "signin"
                ? "Log in to continue with your projects."
                : "Start organising your sprints in minutes."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {checkEmail ? (
              <div className="space-y-4 text-sm">
                <p className="rounded-md border bg-secondary/60 p-4 text-secondary-foreground">
                  Check your inbox — we sent you a confirmation link. Click it to activate your
                  account, then come back and log in.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setCheckEmail(false);
                    setTab("signin");
                  }}
                >
                  Back to log in
                </Button>
              </div>
            ) : (
              <>
                {googleReady && (
                  <>
                    <GoogleButton />
                    <div className="flex items-center gap-3">
                      <Separator className="flex-1" />
                      <span className="text-xs uppercase text-muted-foreground">or</span>
                      <Separator className="flex-1" />
                    </div>
                  </>
                )}
                {tab === "signin" ? (
                  <SignInForm onSuccess={() => navigate({ to: "/dashboard", replace: true })} />
                ) : (
                  <SignUpForm onNeedsConfirmation={() => setCheckEmail(true)} />
                )}
                <p className="text-center text-sm text-muted-foreground">
                  {tab === "signin" ? "New to Sprint Board?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
                  >
                    {tab === "signin" ? "Create an account" : "Log in"}
                  </button>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleButton() {
  const [pending, setPending] = useState(false);

  async function handleGoogle() {
    setPending(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      setPending(false);
      return;
    }
    if (result.redirected) return;
    window.location.href = "/dashboard";
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={pending}>
      {pending ? "Connecting…" : "Continue with Google"}
    </Button>
  );
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) {
          setFormError(
            error.message.toLowerCase().includes("invalid")
              ? "Incorrect email or password."
              : error.message,
          );
          return;
        }
        onSuccess();
      })}
    >
      {formError && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}

function SignUpForm({ onNeedsConfirmation }: { onNeedsConfirmation: () => void }) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            
            data: { full_name: values.fullName },
          },
        });
        if (error) {
          setFormError(
            error.message.toLowerCase().includes("already")
              ? "An account with this email already exists. Try logging in."
              : error.message,
          );
          return;
        }
        if (data.session) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        onNeedsConfirmation();
      })}
    >
      {formError && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input
          id="signup-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive" role="alert">
            {errors.fullName.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
