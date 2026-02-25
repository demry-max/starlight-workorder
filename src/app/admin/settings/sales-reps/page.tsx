"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/i18n/context";

interface SalesRep {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminSalesRepsPage() {
  const { t } = useTranslation();
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRep, setEditRep] = useState<SalesRep | null>(null);

  const fetchSalesReps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sales-reps");
      const data = await res.json();
      if (data.success) setSalesReps(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesReps();
  }, [fetchSalesReps]);

  const handleToggleActive = async (rep: SalesRep) => {
    const res = await fetch(`/api/admin/sales-reps/${rep.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rep.isActive }),
    });
    const data = await res.json();
    if (data.success) fetchSalesReps();
  };

  const handleDelete = async (rep: SalesRep) => {
    if (!confirm(t("admin.salesReps.confirmDelete"))) return;
    const res = await fetch(`/api/admin/sales-reps/${rep.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) fetchSalesReps();
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => {
            setEditRep(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          {t("admin.salesReps.createNew")}
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-gray-400">
            {t("common.loading")}
          </div>
        ) : salesReps.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            {t("admin.salesReps.noData")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("admin.salesReps.name")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("admin.users.status")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {salesReps.map((rep) => (
                  <tr
                    key={rep.id}
                    className={`hover:bg-gray-50 ${!rep.isActive ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {rep.name}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(rep)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          rep.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {rep.isActive
                          ? t("admin.users.active")
                          : t("admin.users.inactive")}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditRep(rep);
                            setShowModal(true);
                          }}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(rep)}
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

      {showModal && (
        <SalesRepModal
          rep={editRep}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchSalesReps();
          }}
        />
      )}
    </div>
  );
}

function SalesRepModal({
  rep,
  onClose,
  onSaved,
}: {
  rep: SalesRep | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!rep;
  const [name, setName] = useState(rep?.name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/admin/sales-reps/${rep.id}`
        : "/api/admin/sales-reps";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(t("errors.validation"));
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit
            ? t("admin.salesReps.editTitle")
            : t("admin.salesReps.createNew")}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t("admin.salesReps.name")} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              required
            />
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
              {loading
                ? t("common.loading")
                : isEdit
                  ? t("common.save")
                  : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
