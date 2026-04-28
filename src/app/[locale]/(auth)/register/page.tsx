"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { register } from "@/lib/actions/auth";

type Step = "role" | "form";
type Role = "CLIENT" | "DEVELOPER";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role>("CLIENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function buildOAuthCallbackUrl(selectedRole: Role) {
    const base = searchParams.get("callbackUrl") || `/${locale}/redirect`;
    const url = new URL(base, "http://placeholder");
    url.searchParams.set("activeRole", selectedRole);
    return url.pathname + url.search;
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

      const callbackUrl = searchParams.get("callbackUrl");
      window.location.href =
        callbackUrl ||
        (role === "DEVELOPER"
          ? `/${locale}/dashboard/developer`
          : `/${locale}/dashboard/client`);
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
            {t("selectRoleHint")}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => setRole("CLIENT")}
            className={`w-full rounded-xl border p-4 text-left transition-colors cursor-pointer ${
              role === "CLIENT"
                ? "border-accent-cyan bg-accent-cyan/5"
                : "border-outline-variant/20 hover:border-accent-cyan hover:bg-surface-container"
            }`}
          >
            <p className="font-semibold text-on-surface">{t("roleClient")}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {t("roleClientDesc")}
            </p>
          </button>

          <button
            onClick={() => setRole("DEVELOPER")}
            className={`w-full rounded-xl border p-4 text-left transition-colors cursor-pointer ${
              role === "DEVELOPER"
                ? "border-accent-violet bg-accent-violet/5"
                : "border-outline-variant/20 hover:border-accent-violet hover:bg-surface-container"
            }`}
          >
            <p className="font-semibold text-on-surface">
              {t("roleDeveloper")}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {t("roleDeveloperDesc")}
            </p>
          </button>

          <Button className="w-full" onClick={() => setStep("form")}>
            {t("continueWithEmail")} &rarr;
          </Button>

          <div className="relative my-2">
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
              onClick={() =>
                signIn("google", {
                  callbackUrl: buildOAuthCallbackUrl(role),
                })
              }
            >
              {t("google")}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() =>
                signIn("github", {
                  callbackUrl: buildOAuthCallbackUrl(role),
                })
              }
            >
              {t("github")}
            </Button>
          </div>

          <p className="text-center text-xs text-on-surface-variant">
            {t("oauthRoleNote")}
          </p>

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
            {loading ? tc("loading") : tc("register")}
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

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-accent-cyan hover:underline"
          >
            {tc("login")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
