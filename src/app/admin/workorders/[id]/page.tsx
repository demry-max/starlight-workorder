"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/context";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { CommentThread } from "@/components/CommentThread";
import type { WorkOrderStatus } from "@/types";
import { STATUS_CONFIG } from "@/types";

interface StaffOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminWorkOrderDetailPage() {
  const { t, locale } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState("");

  // Valid next statuses from current
  const VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ["RECEIVED", "CANCELLED"],
    RECEIVED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: [
      "WAITING_FOR_CLIENT",
      "WAITING_FOR_THIRD_PARTY",
      "COMPLETED",
      "CANCELLED",
    ],
    WAITING_FOR_CLIENT: ["IN_PROGRESS", "CANCELLED"],
    WAITING_FOR_THIRD_PARTY: ["IN_PROGRESS", "CANCELLED"],
    COMPLETED: ["CLOSED"],
    CLOSED: [],
    CANCELLED: [],
  };

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/workorder/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setStaff(data.staff || []);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/workorder/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, statusNote }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setStatusNote("");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleFieldUpdate = async (field: string, value: unknown) => {
    try {
      const res = await fetch(`/api/admin/workorder/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.success) setOrder(data.data);
    } catch {
      /* ignore */
    }
  };

  const handleComment = async (content: string, isInternal?: boolean) => {
    await fetch(`/api/admin/workorder/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, isInternal: isInternal || false }),
    });
    fetchOrder();
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-400">
        {t("common.loading")}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-8 text-center text-red-500">
        {t("errors.notFound")}
      </div>
    );
  }

  const currentStatus = order.status as string;
  const nextStatuses = VALID_TRANSITIONS[currentStatus] || [];
  const isOverdue = Boolean(
    order.dueDate &&
    new Date(order.dueDate as string) < new Date() &&
    !["COMPLETED", "CLOSED", "CANCELLED"].includes(currentStatus),
  );

  return (
    <div>
      <button
        onClick={() => router.push("/admin/workorders")}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        {t("common.back")}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">
            {order.workorderNumber as string}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {order.clientName as string}{" "}
            {order.clientCompany ? `- ${order.clientCompany}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={currentStatus as WorkOrderStatus} />
          {isOverdue && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-sm font-medium text-red-700">
              {t("admin.workorders.overdue")}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details & Edit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Update */}
          {nextStatuses.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                {t("admin.detail.updateStatus")}
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {nextStatuses.map((s) => {
                  const config = STATUS_CONFIG[s as WorkOrderStatus];
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusUpdate(s)}
                      disabled={updating}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:shadow"
                      style={{
                        borderColor: config?.color,
                        color: config?.color,
                      }}
                    >
                      {locale === "zh" ? config?.labelZh : config?.labelEn}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={t("admin.detail.statusNote")}
                className="input-field"
              />
            </div>
          )}

          {/* Editable Fields */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              {t("admin.workorderForm.editTitle")}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">
                  {t("admin.workorderForm.progress")}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={order.progressPercentage as number}
                  onChange={(e) =>
                    handleFieldUpdate(
                      "progressPercentage",
                      parseInt(e.target.value),
                    )
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">
                  {t("admin.workorderForm.priority")}
                </label>
                <select
                  value={order.priority as string}
                  onChange={(e) =>
                    handleFieldUpdate("priority", e.target.value)
                  }
                  className="input-field"
                >
                  <option value="LOW">{t("priority.LOW")}</option>
                  <option value="MEDIUM">{t("priority.MEDIUM")}</option>
                  <option value="HIGH">{t("priority.HIGH")}</option>
                  <option value="URGENT">{t("priority.URGENT")}</option>
                </select>
              </div>
              <div>
                <label className="label">
                  {t("admin.workorderForm.dueDate")}
                </label>
                <input
                  type="date"
                  value={
                    order.dueDate ? (order.dueDate as string).split("T")[0] : ""
                  }
                  onChange={(e) =>
                    handleFieldUpdate(
                      "dueDate",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    )
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">
                  {t("admin.workorderForm.assignedStaff")}
                </label>
                <select
                  value={(order.assignedStaffId as string) || ""}
                  onChange={(e) =>
                    handleFieldUpdate("assignedStaffId", e.target.value || null)
                  }
                  className="input-field"
                >
                  <option value="">
                    {t("admin.workorderForm.selectStaff")}
                  </option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              {t("admin.workorderForm.description")}
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {(order.description as string) || t("common.noData")}
            </p>
          </div>

          {/* Comments */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              {t("admin.detail.comments")}
            </h3>
            <CommentThread
              comments={
                (order.comments as Array<{
                  id: string;
                  authorType: string;
                  authorName: string | null;
                  content: string;
                  isInternal?: boolean;
                  createdAt: string;
                }>) || []
              }
              onSubmit={handleComment}
              showInternalToggle={true}
              placeholder={t("admin.detail.replyPlaceholder")}
            />
          </div>
        </div>

        {/* Right Column - Info & Timeline */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              {t("client.workorder.client")}
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-400">
                  {t("admin.workorderForm.clientName")}
                </dt>
                <dd className="font-medium text-gray-900">
                  {order.clientName as string}
                </dd>
              </div>
              {Boolean(order.clientCompany) && (
                <div>
                  <dt className="text-gray-400">
                    {t("admin.workorderForm.clientCompany")}
                  </dt>
                  <dd className="text-gray-700">
                    {order.clientCompany as string}
                  </dd>
                </div>
              )}
              {Boolean(order.clientEmail) && (
                <div>
                  <dt className="text-gray-400">
                    {t("admin.workorderForm.clientEmail")}
                  </dt>
                  <dd className="text-gray-700">
                    {order.clientEmail as string}
                  </dd>
                </div>
              )}
              {Boolean(order.clientPhone) && (
                <div>
                  <dt className="text-gray-400">
                    {t("admin.workorderForm.clientPhone")}
                  </dt>
                  <dd className="text-gray-700">
                    {order.clientPhone as string}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Metadata */}
          <div className="card">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">
                  {t("client.workorder.createdAt")}
                </dt>
                <dd className="text-gray-700">
                  {new Date(order.createdAt as string).toLocaleDateString(
                    locale === "zh" ? "zh-CN" : "en-US",
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">
                  {t("client.workorder.updatedAt")}
                </dt>
                <dd className="text-gray-700">
                  {new Date(order.updatedAt as string).toLocaleString(
                    locale === "zh" ? "zh-CN" : "en-US",
                  )}
                </dd>
              </div>
              {Boolean(order.lastSyncedAt) && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">
                    {t("admin.feishu.lastSync")}
                  </dt>
                  <dd className="text-gray-700">
                    {new Date(order.lastSyncedAt as string).toLocaleString(
                      locale === "zh" ? "zh-CN" : "en-US",
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-4">
              {t("client.workorder.timeline")}
            </h3>
            <StatusTimeline
              entries={
                (order.statusHistory as Array<{
                  id: string;
                  oldStatus: WorkOrderStatus | null;
                  newStatus: WorkOrderStatus;
                  note: string | null;
                  createdAt: string;
                }>) || []
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
