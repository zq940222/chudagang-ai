"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(t("errorInvalidCredentials"));
    } else {
      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl) {
        window.location.href = callbackUrl;
      } else {
        const session = await getSession();
        const role = session?.user?.role;
        window.location.href =
          role === "DEVELOPER" ? `/${locale}/dashboard/developer` : `/${locale}/dashboard/client`;
      }
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">{t("loginTitle")}</CardTitle>
        <p className="text-center text-sm text-on-surface-variant">
          {t("loginSubtitle")}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
          </div>

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? tc("loading") : tc("login")}
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
            onClick={() =>
              signIn("google", {
                callbackUrl: searchParams.get("callbackUrl") || `/${locale}/redirect`,
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
                callbackUrl: searchParams.get("callbackUrl") || `/${locale}/redirect`,
              })
            }
          >
            {t("github")}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-accent-cyan hover:underline"
          >
            {tc("register")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
