"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/context";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.error === "rateLimited") {
          setError(t("errors.rateLimited"));
        } else {
          setError(t("admin.login.error"));
        }
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-amber-50 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitch />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-xl font-bold text-brand-500 shadow-lg">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("admin.login.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {t("admin.login.subtitle")}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                {t("admin.login.email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("admin.login.emailPlaceholder")}
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                {t("admin.login.password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("admin.login.passwordPlaceholder")}
                className="input-field"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t("common.loading") : t("admin.login.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
