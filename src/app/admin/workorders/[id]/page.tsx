"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/context";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { CommentThread } from "@/components/CommentThread";
import { useStatusConfig } from "@/hooks/useStatusConfig";

interface StaffOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SalesRepOption {
  id: string;
  name: string;
}

export default function AdminWorkOrderDetailPage() {
  const { t, locale } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { configs, getValidNextStatuses, isTerminal, getLabel } =
    useStatusConfig();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRepOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [resetPwResult, setResetPwResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Local form state for editable fields (manual save)
  interface FormState {
    progressPercentage: number;
    priority: string;
    dueDate: string;
    assignedStaffId: string;
    salesRepId: string;
    description: string;
  }
  const [formState, setFormState] = useState<FormState>({
    progressPercentage: 0,
    priority: "MEDIUM",
    dueDate: "",
    assignedStaffId: "",
    salesRepId: "",
    description: "",
  });

  const initFormFromOrder = useCallback((o: Record<string, unknown>) => {
    setFormState({
      progressPercentage: (o.progressPercentage as number) || 0,
      priority: (o.priority as string) || "MEDIUM",
      dueDate: o.dueDate ? (o.dueDate as string).split("T")[0] : "",
      assignedStaffId: (o.assignedStaffId as string) || "",
      salesRepId: (o.salesRepId as string) || "",
      description: (o.description as string) || "",
    });
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/workorder/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        initFormFromOrder(data.data);
        setStaff(data.staff || []);
        setSalesReps(data.salesReps || []);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id, initFormFromOrder]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Dirty check
  const isDirty = useMemo(() => {
    if (!order) return false;
    const origDueDate = order.dueDate
      ? (order.dueDate as string).split("T")[0]
      : "";
    return (
      formState.progressPercentage !==
        ((order.progressPercentage as number) || 0) ||
      formState.priority !== ((order.priority as string) || "MEDIUM") ||
      formState.dueDate !== origDueDate ||
      formState.assignedStaffId !== ((order.assignedStaffId as string) || "") ||
      formState.salesRepId !== ((order.salesRepId as string) || "") ||
      formState.description !== ((order.description as string) || "")
    );
  }, [formState, order]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        progressPercentage: formState.progressPercentage,
        priority: formState.priority,
        dueDate: formState.dueDate
          ? new Date(formState.dueDate).toISOString()
          : null,
        assignedStaffId: formState.assignedStaffId || null,
        salesRepId: formState.salesRepId || null,
        description: formState.description,
      };
      const res = await fetch(`/api/admin/workorder/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        initFormFromOrder(data.data);
        setSaveMsg(t("admin.detail.saveSuccess"));
        setTimeout(() => setSaveMsg(null), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (order) initFormFromOrder(order);
  };

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
        setSelectedStatus(null);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("admin.workorders.confirmDelete"))) return;
    const res = await fetch(`/api/admin/workorder/${params.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) router.push("/admin/workorders");
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
  const nextStatuses = getValidNextStatuses(currentStatus);
  const isOverdue = Boolean(
    order.dueDate &&
    new Date(order.dueDate as string) < new Date() &&
    !isTerminal(currentStatus),
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
          <StatusBadge status={currentStatus} />
          {isOverdue && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-sm font-medium text-red-700">
              {t("admin.workorders.overdue")}
            </span>
          )}
          <button onClick={handleDelete} className="btn-danger text-sm">
            {t("common.delete")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details & Edit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Update - Inline compact bar */}
          {nextStatuses.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                {t("admin.detail.updateStatus")}
              </h3>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <select
                    value={selectedStatus || ""}
                    onChange={(e) => setSelectedStatus(e.target.value || null)}
                    className="input-field"
                  >
                    <option value="">{t("admin.detail.selectStatus")}</option>
                    {nextStatuses.map((s) => (
                      <option key={s} value={s}>
                        {getLabel(s, locale)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder={t("admin.detail.statusNote")}
                    className="input-field"
                  />
                </div>
                {selectedStatus && (
                  <button
                    onClick={() => handleStatusUpdate(selectedStatus)}
                    disabled={updating}
                    className="btn-secondary text-sm whitespace-nowrap"
                  >
                    {updating
                      ? t("common.loading")
                      : t("admin.detail.updateStatus")}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Save bar - only shows when form fields are changed */}
          {saveMsg && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {saveMsg}
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
                  value={formState.progressPercentage}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      progressPercentage: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">
                  {t("admin.workorderForm.priority")}
                </label>
                <select
                  value={formState.priority}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
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
                  value={formState.dueDate}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">
                  {t("admin.workorderForm.assignedStaff")}
                </label>
                <select
                  value={formState.assignedStaffId}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      assignedStaffId: e.target.value,
                    }))
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
              <div>
                <label className="label">
                  {t("admin.workorderForm.salesRep")}
                </label>
                <select
                  value={formState.salesRepId}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      salesRepId: e.target.value,
                    }))
                  }
                  className="input-field"
                >
                  <option value="">
                    {t("admin.workorderForm.selectSalesRep")}
                  </option>
                  {salesReps.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
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
            <textarea
              value={formState.description}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="input-field resize-none"
              rows={4}
              placeholder={t("admin.workorderForm.description")}
            />
          </div>

          {/* Single Save Button - only when fields changed */}
          {isDirty && (
            <div className="flex items-center justify-end gap-3">
              <button onClick={handleDiscard} className="btn-secondary text-sm">
                {t("admin.detail.discard")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-sm"
              >
                {saving ? t("common.loading") : t("common.save")}
              </button>
            </div>
          )}

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
            <button
              onClick={async () => {
                const chars =
                  "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
                let pw = "";
                for (let i = 0; i < 8; i++)
                  pw += chars.charAt(Math.floor(Math.random() * chars.length));
                try {
                  const res = await fetch(`/api/admin/workorder/${params.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: pw }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    navigator.clipboard.writeText(pw).catch(() => {});
                    setResetPwResult(pw);
                    setTimeout(() => setResetPwResult(null), 10000);
                  }
                } catch {
                  /* ignore */
                }
              }}
              className="btn-secondary mt-3 w-full text-sm"
            >
              {t("admin.detail.resetPassword")}
            </button>
            {resetPwResult && (
              <div className="mt-2 rounded-lg bg-green-50 p-3 text-sm">
                <p className="text-green-700 font-medium">
                  {t("admin.detail.passwordResetSuccess")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono font-bold text-green-900">
                    {resetPwResult}
                  </span>
                  <span className="text-xs text-green-600">
                    {t("common.copied")}
                  </span>
                </div>
              </div>
            )}
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

          {/* Client Rating */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              {t("admin.detail.clientRating")}
            </h3>
            {order.rating ? (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-5 w-5 ${star <= (order.rating as { score: number }).score ? "text-amber-400" : "text-gray-200"}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                  <span className="ml-1 text-sm text-gray-500">
                    {(order.rating as { score: number }).score}/5
                  </span>
                </div>
                {(order.rating as { comment: string | null }).comment && (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                    {(order.rating as { comment: string | null }).comment}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(
                    (order.rating as { createdAt: string }).createdAt,
                  ).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                {t("admin.detail.noRating")}
              </p>
            )}
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
                  oldStatus: string | null;
                  newStatus: string;
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
