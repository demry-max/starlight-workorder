"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/context";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { useStatusConfig } from "@/hooks/useStatusConfig";

interface WorkOrderListItem {
  id: string;
  workorderNumber: string;
  clientName: string;
  clientCompany: string | null;
  status: string;
  priority: string;
  progressPercentage: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignedStaff: { id: string; name: string } | null;
  salesRep: { id: string; name: string } | null;
}

interface SalesRepOption {
  id: string;
  name: string;
}

export default function AdminWorkOrdersPage() {
  const { t, locale } = useTranslation();
  const { configList, isTerminal, getLabel } = useStatusConfig();
  const [orders, setOrders] = useState<WorkOrderListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [salesRepFilter, setSalesRepFilter] = useState<string>("");
  const [salesReps, setSalesReps] = useState<SalesRepOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
    });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (salesRepFilter) params.set("salesRepId", salesRepFilter);

    try {
      const res = await fetch(`/api/admin/workorders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, salesRepFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetch("/api/admin/sales-reps")
      .then((r) => r.json())
      .then((d) => {
        if (d.success)
          setSalesReps(
            d.data.filter(
              (r: SalesRepOption & { isActive: boolean }) => r.isActive,
            ),
          );
      });
  }, []);

  const handleExport = () => {
    if (!confirm(t("admin.workorders.confirmExport"))) return;
    const params = new URLSearchParams({ export: "csv" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (salesRepFilter) params.set("salesRepId", salesRepFilter);
    window.open(`/api/admin/workorders?${params}`, "_blank");
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm(t("admin.workorders.confirmDelete"))) return;
    const res = await fetch(`/api/admin/workorder/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) fetchOrders();
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate) return false;
    if (isTerminal(status)) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("admin.workorders.title")}
        </h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            {t("common.export")}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            {t("admin.workorders.createNew")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("admin.workorders.searchPlaceholder")}
            className="input-field flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input-field sm:w-48"
          >
            <option value="">{t("admin.workorders.allStatuses")}</option>
            {configList.map((s) => (
              <option key={s.key} value={s.key}>
                {getLabel(s.key, locale)}
              </option>
            ))}
          </select>
          <select
            value={salesRepFilter}
            onChange={(e) => {
              setSalesRepFilter(e.target.value);
              setPage(1);
            }}
            className="input-field sm:w-48"
          >
            <option value="">{t("admin.workorders.allSalesReps")}</option>
            {salesReps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-gray-400">
            {t("common.loading")}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            {t("admin.workorders.noOrders")}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      {t("client.workorder.orderNumber")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      {t("client.workorder.client")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      {t("client.workorder.status")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      {t("client.workorder.priority")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      {t("client.workorder.progress")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      {t("client.workorder.assignedTo")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      {t("admin.workorderForm.salesRep")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      {t("client.workorder.dueDate")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm font-medium">
                        {order.workorderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {order.clientName}
                        </div>
                        {order.clientCompany && (
                          <div className="text-xs text-gray-500">
                            {order.clientCompany}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {t(`priority.${order.priority}`)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-brand-500"
                              style={{ width: `${order.progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {order.progressPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.assignedStaff?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.salesRep?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {order.dueDate ? (
                          <span
                            className={
                              isOverdue(order.dueDate, order.status)
                                ? "font-medium text-red-600"
                                : "text-gray-600"
                            }
                          >
                            {new Date(order.dueDate).toLocaleDateString(
                              locale === "zh" ? "zh-CN" : "en-US",
                            )}
                            {isOverdue(order.dueDate, order.status) && (
                              <span className="ml-1 text-xs">
                                ({t("admin.workorders.overdue")})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/workorders/${order.id}`}
                            className="text-sm font-medium text-brand-600 hover:text-brand-700"
                          >
                            {t("common.edit")}
                          </Link>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            {t("common.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={20}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWorkOrderModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}

function CreateWorkOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assignedStaffId: "",
    salesRepId: "",
    password: "",
  });
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [modalSalesReps, setModalSalesReps] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    workorderNumber: string;
    generatedPassword: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStaff(d.data);
      });
    fetch("/api/admin/sales-reps")
      .then((r) => r.json())
      .then((d) => {
        if (d.success)
          setModalSalesReps(
            d.data.filter((r: { isActive: boolean }) => r.isActive),
          );
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dueDate: form.dueDate
            ? new Date(form.dueDate).toISOString()
            : undefined,
          assignedStaffId: form.assignedStaffId || undefined,
          salesRepId: form.salesRepId || undefined,
          clientEmail: form.clientEmail || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreated({
          workorderNumber: data.data.workorderNumber,
          generatedPassword: data.data.generatedPassword,
        });
      } else {
        setError(t("errors.validation"));
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        {created ? (
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg
                className="h-6 w-6"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("admin.workorderForm.createTitle")}
            </h3>
            <div className="rounded-lg bg-gray-50 p-4 text-left mb-4">
              <p className="text-sm text-gray-500">
                {t("admin.workorderForm.generatedNumber")}
              </p>
              <p className="text-lg font-mono font-bold text-gray-900">
                {created.workorderNumber}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {t("admin.workorderForm.password")}
              </p>
              <p className="text-lg font-mono font-bold text-gray-900">
                {created.generatedPassword}
              </p>
            </div>
            <button onClick={onCreated} className="btn-primary">
              {t("common.close")}
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("admin.workorderForm.createTitle")}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    {t("admin.workorderForm.clientName")} *
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => update("clientName", e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    {t("admin.workorderForm.clientCompany")}
                  </label>
                  <input
                    type="text"
                    value={form.clientCompany}
                    onChange={(e) => update("clientCompany", e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    {t("admin.workorderForm.clientEmail")}
                  </label>
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => update("clientEmail", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">
                    {t("admin.workorderForm.clientPhone")}
                  </label>
                  <input
                    type="text"
                    value={form.clientPhone}
                    onChange={(e) => update("clientPhone", e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="label">
                  {t("admin.workorderForm.description")}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    {t("admin.workorderForm.priority")}
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => update("priority", e.target.value)}
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
                    value={form.dueDate}
                    onChange={(e) => update("dueDate", e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    {t("admin.workorderForm.assignedStaff")}
                  </label>
                  <select
                    value={form.assignedStaffId}
                    onChange={(e) => update("assignedStaffId", e.target.value)}
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
                    value={form.salesRepId}
                    onChange={(e) => update("salesRepId", e.target.value)}
                    className="input-field"
                  >
                    <option value="">
                      {t("admin.workorderForm.selectSalesRep")}
                    </option>
                    {modalSalesReps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">
                  {t("admin.workorderForm.password")} *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className="input-field flex-1"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const chars =
                        "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
                      let pw = "";
                      for (let i = 0; i < 8; i++)
                        pw += chars.charAt(
                          Math.floor(Math.random() * chars.length),
                        );
                      update("password", pw);
                    }}
                    className="btn-secondary whitespace-nowrap"
                    title={t("admin.workorderForm.generatePassword")}
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
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                      />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {t("admin.workorderForm.passwordHint")}
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? t("common.loading") : t("common.create")}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
