"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { register } from "@/lib/actions/auth";

type Step = "role" | "form";
type Role = "CLIENT" | "DEVELOPER";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role>("CLIENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function selectRole(selectedRole: Role) {
    setRole(selectedRole);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await register({ email, name, password, role });

      if (res.error) {
        if (res.error === "Email exists") {
          setError(t("errorEmailExists"));
        } else if (res.error === "Invalid input") {
          setError(t("errorGeneric"));
        } else {
          setError(res.error);
        }
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError(t("errorInvalidCredentials"));
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setError(t("errorGeneric"));
      setLoading(false);
    }
  }

  if (step === "role") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {t("registerTitle")}
          </CardTitle>
          <p className="text-center text-sm text-on-surface-variant">
            {t("selectRole")}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => selectRole("CLIENT")}
            className="w-full rounded-xl border border-outline-variant/20 p-4 text-left transition-colors hover:border-accent-cyan hover:bg-surface-container cursor-pointer"
          >
            <p className="font-semibold text-on-surface">{t("roleClient")}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {t("roleClientDesc")}
            </p>
          </button>

          <button
            onClick={() => selectRole("DEVELOPER")}
            className="w-full rounded-xl border border-outline-variant/20 p-4 text-left transition-colors hover:border-accent-violet hover:bg-surface-container cursor-pointer"
          >
            <p className="font-semibold text-on-surface">
              {t("roleDeveloper")}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {t("roleDeveloperDesc")}
            </p>
          </button>

          <p className="mt-4 text-center text-sm text-on-surface-variant">
            {t("hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-accent-cyan hover:underline"
            >
              {t("loginTitle")}
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {t("registerTitle")}
        </CardTitle>
        <p className="text-center text-sm text-on-surface-variant">
          {t("registerSubtitle")}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-on-surface">
              {t("name")}
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-on-surface">
              {t("email")}
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-on-surface">
              {t("password")}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : t("registerTitle")}
          </Button>

          <Button
            type="button"
            variant="tertiary"
            className="w-full"
            onClick={() => setStep("role")}
          >
            &larr; {t("selectRole")}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/20" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-container-lowest px-2 text-on-surface-variant">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            {t("google")}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl: "/" })}
          >
            {t("github")}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-accent-cyan hover:underline"
          >
            {t("loginTitle")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
