"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/i18n/context";
import { LanguageSwitch } from "@/components/LanguageSwitch";

const QUICK_COMMENT_KEYS = [
  "excellent",
  "professional",
  "goodCommunication",
  "slow",
  "unclearProcess",
  "needsImprovement",
] as const;

export default function RatingPage() {
  const { t } = useTranslation();
  const params = useParams();
  const workOrderId = params.id as string;

  const [score, setScore] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleQuickComment = useCallback((text: string) => {
    setComment((prev) => {
      if (prev.includes(text)) return prev;
      return prev ? `${prev}\n${text}` : text;
    });
  }, []);

  const handleSubmit = async () => {
    if (score === 0) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/client/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId,
          score,
          comment: comment.trim() || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
      } else if (data.error === "Already rated") {
        setError(t("client.workorder.ratingAlreadySubmitted"));
      } else {
        setError(t("errors.generic"));
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-white to-yellow-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t("client.workorder.ratingSuccess")}
          </h1>
          <div className="flex justify-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`h-8 w-8 ${star <= score ? "text-amber-400" : "text-gray-200"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-500">{t("common.copyright")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-white to-yellow-50 px-4 py-8">
      <div className="absolute top-4 right-4">
        <LanguageSwitch />
      </div>

      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <img
            src="/logo.svg"
            alt="Starlight"
            className="mb-4 inline-block h-14 w-14 rounded-2xl shadow-lg"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            {t("client.workorder.ratingTitle")}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {t("client.workorder.ratingSubtitle")}
          </p>
        </div>

        <div className="card">
          {/* Star Rating */}
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setScore(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <svg
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoveredStar || score)
                      ? "text-amber-400"
                      : "text-gray-200"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>

          {/* Quick Comment Buttons */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_COMMENT_KEYS.map((key) => {
                const text = t(`client.workorder.quickComments.${key}`);
                const isSelected = comment.includes(text);
                const isPositive = [
                  "excellent",
                  "professional",
                  "goodCommunication",
                ].includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleQuickComment(text)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                      isSelected
                        ? isPositive
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-red-100 text-red-700 border-red-300"
                        : isPositive
                          ? "bg-white text-green-600 border-green-200 hover:bg-green-50"
                          : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                    }`}
                  >
                    {isPositive ? "+" : "-"} {text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Text Area */}
          <div className="mb-4">
            <label className="label">
              {t("client.workorder.ratingComment")}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("client.workorder.ratingCommentPlaceholder")}
              rows={4}
              className="input-field resize-none"
              maxLength={1000}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={score === 0 || submitting}
            className="btn-primary w-full"
          >
            {submitting
              ? t("common.loading")
              : t("client.workorder.submitRating")}
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          {t("common.copyright")}
        </p>
      </div>
    </div>
  );
}
