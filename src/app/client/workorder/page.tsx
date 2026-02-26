"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/context";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { CommentThread } from "@/components/CommentThread";
import { useStatusConfig } from "@/hooks/useStatusConfig";
import type { WorkOrderClientView } from "@/types";

export default function ClientWorkOrderPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { isTerminal } = useStatusConfig();
  const [order, setOrder] = useState<WorkOrderClientView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch("/api/client/workorder/me");
      if (res.status === 401) {
        router.push("/client/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      } else {
        setError(t("errors.notFound"));
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleComment = async (content: string) => {
    if (!order) return;
    const res = await fetch("/api/client/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workOrderId: order.id, content }),
    });
    if (res.ok) {
      fetchOrder();
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout?type=client", { method: "POST" });
    router.push("/client/login");
  };

  const isOverdue =
    order?.dueDate &&
    new Date(order.dueDate) < new Date() &&
    !isTerminal(order.status);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-sm text-gray-400">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red-500 mb-4">{error || t("errors.notFound")}</p>
          <button
            onClick={() => router.push("/client/login")}
            className="btn-primary"
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  const orderIsTerminal = isTerminal(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-brand-500 shadow">
              S
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm">
                {t("common.appName")}
              </span>
              <p className="text-xs text-gray-400">{t("common.companyName")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <button onClick={handleLogout} className="btn-secondary text-sm">
              {t("common.logout")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero Card - Order Number + Status */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  {t("client.workorder.orderNumber")}
                </p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wide">
                  {order.workorderNumber}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                {isOverdue && (
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-300 border border-red-500/30">
                    {t("client.workorder.overdue")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {t("client.workorder.progress")}
              </span>
              <span className="text-sm font-bold text-brand-600">
                {order.progressPercentage}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500"
                style={{ width: `${order.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status Timeline - Yellow Highlighted (2nd position) */}
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 sm:px-8 border-b border-amber-200 bg-amber-100/50">
            <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("client.workorder.timeline")}
            </h3>
          </div>
          <div className="px-6 py-4 sm:px-8">
            <StatusTimeline entries={order.statusHistory} />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Description */}
            {order.description && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 sm:px-8 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    {t("client.workorder.description")}
                  </h3>
                </div>
                <div className="px-6 py-4 sm:px-8">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {order.description}
                  </p>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 sm:px-8 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  {t("client.workorder.comments")}
                </h3>
              </div>
              <div className="px-6 py-4 sm:px-8">
                <CommentThread
                  comments={order.comments}
                  onSubmit={handleComment}
                  placeholder={t("client.workorder.commentPlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Info Cards */}
          <div className="space-y-6">
            {/* Order Information */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  {t("client.workorder.orderInfo")}
                </h3>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">
                      {t("client.workorder.priority")}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {t(`priority.${order.priority}`)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">
                      {t("client.workorder.dueDate")}
                    </dt>
                    <dd className={`text-sm font-medium ${isOverdue ? "text-red-600" : "text-gray-900"}`}>
                      {order.dueDate
                        ? new Date(order.dueDate).toLocaleDateString(
                            locale === "zh" ? "zh-CN" : "en-US",
                          )
                        : t("client.workorder.notSet")}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">
                      {t("client.workorder.createdAt")}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString(
                        locale === "zh" ? "zh-CN" : "en-US",
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">
                      {t("client.workorder.updatedAt")}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {new Date(order.updatedAt).toLocaleString(
                        locale === "zh" ? "zh-CN" : "en-US",
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Contact & Staff */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {t("client.workorder.contactInfo")}
                </h3>
              </div>
              <div className="px-6 py-4">
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">
                      {t("client.workorder.client")}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {order.clientName}
                    </dd>
                  </div>
                  {order.clientCompany && (
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-400 uppercase tracking-wider">
                        {t("client.workorder.company")}
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {order.clientCompany}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">
                      {t("client.workorder.assignedTo")}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {order.assignedStaffName || "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Rating Card - Show if completed and not yet rated */}
            {orderIsTerminal && order.status === "COMPLETED" && !order.rating && (
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 text-center">
                  <p className="text-2xl mb-2">&#11088;</p>
                  <h3 className="text-sm font-semibold text-amber-800 mb-1">
                    {t("client.workorder.rating")}
                  </h3>
                  <p className="text-xs text-amber-600 mb-4">
                    {t("client.workorder.ratingSubtitle")}
                  </p>
                  <a
                    href={`/client/rate/${order.id}`}
                    className="inline-block rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
                  >
                    {t("client.workorder.submitRating")}
                  </a>
                </div>
              </div>
            )}

            {/* Show existing rating */}
            {order.rating && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {t("client.workorder.ratingTitle")}
                  </h3>
                </div>
                <div className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-6 w-6 ${star <= order.rating!.score ? "text-amber-400" : "text-gray-200"}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  {order.rating.comment && (
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                      {order.rating.comment}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(order.rating.createdAt).toLocaleDateString(
                      locale === "zh" ? "zh-CN" : "en-US",
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">
            {t("common.copyright")}
          </p>
        </div>
      </main>
    </div>
  );
}
