"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/i18n/context";
import { invalidateStatusCache } from "@/hooks/useStatusConfig";

interface StatusConfigItem {
  id: string;
  key: string;
  labelEn: string;
  labelZh: string;
  color: string;
  bgColor: string;
  textColor: string;
  sortOrder: number;
  defaultProgress: number;
  isTerminal: boolean;
  isDefault: boolean;
  isActive: boolean;
}

interface TransitionItem {
  id: string;
  fromStatusKey: string;
  toStatusKey: string;
}

export default function AdminStatusesPage() {
  const { t, locale } = useTranslation();
  const [statuses, setStatuses] = useState<StatusConfigItem[]>([]);
  const [transitions, setTransitions] = useState<TransitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState<StatusConfigItem | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransitionsModal, setShowTransitionsModal] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, transRes] = await Promise.all([
        fetch("/api/admin/statuses"),
        fetch("/api/admin/statuses/transitions"),
      ]);
      const statusData = await statusRes.json();
      const transData = await transRes.json();
      if (statusData.success) setStatuses(statusData.data);
      if (transData.success) setTransitions(transData.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (key: string) => {
    if (!confirm(t("admin.statuses.confirmDelete"))) return;
    setError("");
    const res = await fetch(`/api/admin/statuses/${key}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      invalidateStatusCache();
      fetchData();
    } else {
      setError(data.error || t("errors.generic"));
    }
  };

  const handleSetDefault = async (key: string) => {
    const res = await fetch(`/api/admin/statuses/${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    const data = await res.json();
    if (data.success) {
      invalidateStatusCache();
      fetchData();
    }
  };

  const handleToggleActive = async (key: string, isActive: boolean) => {
    const res = await fetch(`/api/admin/statuses/${key}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    const data = await res.json();
    if (data.success) {
      invalidateStatusCache();
      fetchData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransitionsModal(true)}
            className="btn-secondary"
          >
            {t("admin.statuses.editTransitions")}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            {t("admin.statuses.create")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-gray-400">
            {t("common.loading")}
          </div>
        ) : statuses.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            {t("common.noData")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("admin.statuses.order")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("admin.statuses.key")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("admin.statuses.preview")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("admin.statuses.labelEn")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("admin.statuses.labelZh")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("admin.statuses.flags")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {statuses.map((s) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-gray-50 ${!s.isActive ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3 text-gray-500">{s.sortOrder}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.key}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: s.bgColor,
                          color: s.textColor,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {locale === "zh" ? s.labelZh : s.labelEn}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.labelEn}</td>
                    <td className="px-4 py-3">{s.labelZh}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {s.isDefault && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                            {t("admin.statuses.default")}
                          </span>
                        )}
                        {s.isTerminal && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                            {t("admin.statuses.terminal")}
                          </span>
                        )}
                        {!s.isActive && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">
                            {t("admin.statuses.inactive")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingStatus(s)}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          {t("common.edit")}
                        </button>
                        {!s.isDefault && (
                          <button
                            onClick={() => handleSetDefault(s.key)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            {t("admin.statuses.setDefault")}
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(s.key, s.isActive)}
                          className="text-sm font-medium text-gray-600 hover:text-gray-700"
                        >
                          {s.isActive
                            ? t("admin.statuses.deactivate")
                            : t("admin.statuses.activate")}
                        </button>
                        <button
                          onClick={() => handleDelete(s.key)}
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
        )}
      </div>

      {(showCreateModal || editingStatus) && (
        <StatusFormModal
          status={editingStatus}
          onClose={() => {
            setShowCreateModal(false);
            setEditingStatus(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditingStatus(null);
            invalidateStatusCache();
            fetchData();
          }}
        />
      )}

      {showTransitionsModal && (
        <TransitionsModal
          statuses={statuses}
          transitions={transitions}
          onClose={() => setShowTransitionsModal(false)}
          onSaved={() => {
            setShowTransitionsModal(false);
            invalidateStatusCache();
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function StatusFormModal({
  status,
  onClose,
  onSaved,
}: {
  status: StatusConfigItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!status;

  const [form, setForm] = useState({
    key: status?.key || "",
    labelEn: status?.labelEn || "",
    labelZh: status?.labelZh || "",
    color: status?.color || "#6B7280",
    bgColor: status?.bgColor || "#F3F4F6",
    textColor: status?.textColor || "#374151",
    sortOrder: status?.sortOrder ?? 0,
    defaultProgress: status?.defaultProgress ?? -1,
    isTerminal: status?.isTerminal ?? false,
    isDefault: status?.isDefault ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/admin/statuses/${status.key}`
        : "/api/admin/statuses";
      const method = isEdit ? "PATCH" : "POST";

      const body = isEdit
        ? {
            labelEn: form.labelEn,
            labelZh: form.labelZh,
            color: form.color,
            bgColor: form.bgColor,
            textColor: form.textColor,
            sortOrder: form.sortOrder,
            defaultProgress: form.defaultProgress,
            isTerminal: form.isTerminal,
            isDefault: form.isDefault,
          }
        : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(data.error || t("errors.generic"));
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: unknown) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit
            ? t("admin.statuses.editTitle")
            : t("admin.statuses.createTitle")}
        </h3>

        {/* Preview */}
        <div className="mb-4 p-3 rounded-lg bg-gray-50 flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {t("admin.statuses.preview")}:
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: form.bgColor, color: form.textColor }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: form.color }}
            />
            {form.labelEn || "Preview"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="label">{t("admin.statuses.key")} *</label>
              <input
                type="text"
                value={form.key}
                onChange={(e) =>
                  update(
                    "key",
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
                  )
                }
                className="input-field font-mono"
                placeholder="e.g. PENDING_REVIEW"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                {t("admin.statuses.keyHint")}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t("admin.statuses.labelEn")} *</label>
              <input
                type="text"
                value={form.labelEn}
                onChange={(e) => update("labelEn", e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">{t("admin.statuses.labelZh")} *</label>
              <input
                type="text"
                value={form.labelZh}
                onChange={(e) => update("labelZh", e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">{t("admin.statuses.dotColor")}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => update("color", e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => update("color", e.target.value)}
                  className="input-field font-mono text-xs flex-1"
                />
              </div>
            </div>
            <div>
              <label className="label">
                {t("admin.statuses.bgColorLabel")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.bgColor}
                  onChange={(e) => update("bgColor", e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={form.bgColor}
                  onChange={(e) => update("bgColor", e.target.value)}
                  className="input-field font-mono text-xs flex-1"
                />
              </div>
            </div>
            <div>
              <label className="label">
                {t("admin.statuses.textColorLabel")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.textColor}
                  onChange={(e) => update("textColor", e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={form.textColor}
                  onChange={(e) => update("textColor", e.target.value)}
                  className="input-field font-mono text-xs flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t("admin.statuses.sortOrder")}</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  update("sortOrder", parseInt(e.target.value) || 0)
                }
                className="input-field"
                min={0}
              />
            </div>
            <div>
              <label className="label">
                {t("admin.statuses.defaultProgress")}
              </label>
              <input
                type="number"
                value={form.defaultProgress}
                onChange={(e) =>
                  update("defaultProgress", parseInt(e.target.value))
                }
                className="input-field"
                min={-1}
                max={100}
              />
              <p className="mt-1 text-xs text-gray-400">
                {t("admin.statuses.progressHint")}
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isTerminal}
                onChange={(e) => update("isTerminal", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{t("admin.statuses.isTerminal")}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => update("isDefault", e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">
                {t("admin.statuses.isDefaultLabel")}
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              {t("common.cancel")}
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransitionsModal({
  statuses,
  transitions: initialTransitions,
  onClose,
  onSaved,
}: {
  statuses: StatusConfigItem[];
  transitions: TransitionItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, locale } = useTranslation();

  // Build a matrix: rows = from, cols = to
  const activeStatuses = statuses.filter((s) => s.isActive);
  const keys = activeStatuses.map((s) => s.key);

  const buildMatrix = () => {
    const m: Record<string, Record<string, boolean>> = {};
    for (const from of keys) {
      m[from] = {};
      for (const to of keys) {
        m[from][to] = false;
      }
    }
    for (const t of initialTransitions) {
      if (m[t.fromStatusKey]?.[t.toStatusKey] !== undefined) {
        m[t.fromStatusKey][t.toStatusKey] = true;
      }
    }
    return m;
  };

  const [matrix, setMatrix] = useState(buildMatrix);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (from: string, to: string) => {
    setMatrix((prev) => ({
      ...prev,
      [from]: { ...prev[from], [to]: !prev[from][to] },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    const newTransitions: { fromStatusKey: string; toStatusKey: string }[] = [];
    for (const from of keys) {
      for (const to of keys) {
        if (matrix[from][to]) {
          newTransitions.push({ fromStatusKey: from, toStatusKey: to });
        }
      }
    }

    try {
      const res = await fetch("/api/admin/statuses/transitions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTransitions),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(data.error || t("errors.generic"));
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSaving(false);
    }
  };

  const getLabel = (key: string) => {
    const s = activeStatuses.find((st) => st.key === key);
    return s ? (locale === "zh" ? s.labelZh : s.labelEn) : key;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("admin.statuses.editTransitions")}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {t("admin.statuses.transitionsHint")}
        </p>

        <div className="overflow-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left font-medium text-gray-500 border-b">
                  {t("admin.statuses.from")} \ {t("admin.statuses.to")}
                </th>
                {keys.map((to) => (
                  <th
                    key={to}
                    className="px-2 py-1 text-center font-medium text-gray-500 border-b min-w-[80px]"
                  >
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                      style={{
                        backgroundColor: activeStatuses.find(
                          (s) => s.key === to,
                        )?.bgColor,
                        color: activeStatuses.find((s) => s.key === to)
                          ?.textColor,
                      }}
                    >
                      {getLabel(to)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((from) => (
                <tr key={from} className="border-b">
                  <td className="px-2 py-2 font-medium text-gray-700">
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                      style={{
                        backgroundColor: activeStatuses.find(
                          (s) => s.key === from,
                        )?.bgColor,
                        color: activeStatuses.find((s) => s.key === from)
                          ?.textColor,
                      }}
                    >
                      {getLabel(from)}
                    </span>
                  </td>
                  {keys.map((to) => (
                    <td key={to} className="px-2 py-2 text-center">
                      {from === to ? (
                        <span className="text-gray-300">-</span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={matrix[from]?.[to] ?? false}
                          onChange={() => toggle(from, to)}
                          className="rounded"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 mt-4">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
