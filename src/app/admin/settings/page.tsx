"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/context";

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_pass: "",
    smtp_from: "",
  });
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setForm((prev) => ({
            ...prev,
            ...d.data,
          }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: t("admin.settings.saveSuccess") });
      } else {
        setMessage({ type: "error", text: t("errors.generic") });
      }
    } catch {
      setMessage({ type: "error", text: t("errors.generic") });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: t("admin.settings.testSuccess") });
      } else {
        setMessage({ type: "error", text: data.error || t("errors.generic") });
      }
    } catch {
      setMessage({ type: "error", text: t("errors.generic") });
    } finally {
      setTesting(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-400">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div>
      <div className="card max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("admin.settings.smtpTitle")}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t("admin.settings.smtpDescription")}
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t("admin.settings.smtpHost")}</label>
              <input
                type="text"
                value={form.smtp_host}
                onChange={(e) => update("smtp_host", e.target.value)}
                placeholder="smtp.example.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">{t("admin.settings.smtpPort")}</label>
              <input
                type="number"
                value={form.smtp_port}
                onChange={(e) => update("smtp_port", e.target.value)}
                placeholder="587"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t("admin.settings.smtpUser")}</label>
              <input
                type="text"
                value={form.smtp_user}
                onChange={(e) => update("smtp_user", e.target.value)}
                placeholder="user@example.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">{t("admin.settings.smtpPass")}</label>
              <input
                type="password"
                value={form.smtp_pass}
                onChange={(e) => update("smtp_pass", e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">{t("admin.settings.smtpFrom")}</label>
            <input
              type="text"
              value={form.smtp_from}
              onChange={(e) => update("smtp_from", e.target.value)}
              placeholder="Starlight WorkOrder <noreply@example.com>"
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {t("admin.settings.testEmailTitle")}
        </h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder={t("admin.settings.testEmailPlaceholder")}
            className="input-field flex-1"
          />
          <button
            onClick={handleTestEmail}
            disabled={testing || !testEmail}
            className="btn-secondary whitespace-nowrap"
          >
            {testing ? t("common.loading") : t("admin.settings.sendTestEmail")}
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
