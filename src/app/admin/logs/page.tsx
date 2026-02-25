'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/i18n/context';

interface AuditLogEntry {
  id: string;
  action: string;
  actor: string | null;
  actorEmail: string | null;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  ipAddress: string | null;
  success: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const ACTION_GROUPS = [
  { value: '', label: 'All Actions' },
  { value: 'auth', label: 'Authentication' },
  { value: 'workorder', label: 'Work Orders' },
  { value: 'comment', label: 'Comments' },
  { value: 'user', label: 'Users' },
  { value: 'status', label: 'Statuses' },
  { value: 'feishu', label: 'Feishu' },
];

export default function AdminLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '50' });
      if (actionFilter) params.set('action', actionFilter);
      if (actorFilter) params.set('actor', actorFilter);
      if (successFilter) params.set('success', successFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [actionFilter, actorFilter, successFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const parseDetail = (detail: string | null) => {
    if (!detail) return null;
    try {
      return JSON.parse(detail);
    } catch {
      return detail;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.logs.title')}</h1>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">{t('admin.logs.actionFilter')}</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input-field"
            >
              {ACTION_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('admin.logs.actorFilter')}</label>
            <input
              type="text"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder={t('admin.logs.actorPlaceholder')}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">{t('admin.logs.statusFilter')}</label>
            <select
              value={successFilter}
              onChange={(e) => setSuccessFilter(e.target.value)}
              className="input-field"
            >
              <option value="">{t('admin.logs.allResults')}</option>
              <option value="true">{t('admin.logs.successOnly')}</option>
              <option value="false">{t('admin.logs.failedOnly')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('admin.logs.dateFrom')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">{t('admin.logs.dateTo')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-gray-400">{t('common.loading')}</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-400">{t('common.noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.logs.time')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.logs.action')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.logs.actor')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.logs.target')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.logs.result')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.logs.detail')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => {
                  const detail = parseDetail(log.detail);
                  const isExpanded = expandedRow === log.id;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {log.actorEmail || log.actor || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {log.targetType ? `${log.targetType}${log.targetId ? `:${log.targetId.slice(0, 8)}` : ''}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.success ? t('admin.logs.success') : t('admin.logs.failed')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {detail ? (
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            {isExpanded ? t('admin.logs.hide') : t('admin.logs.show')}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                        {isExpanded && detail && (
                          <pre className="mt-2 max-w-xs overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                            {typeof detail === 'object' ? JSON.stringify(detail, null, 2) : String(detail)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            {t('pagination.showing')} {(pagination.page - 1) * pagination.pageSize + 1} {t('pagination.to')}{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} {t('pagination.of')} {pagination.total} {t('pagination.results')}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {t('pagination.previous')}
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
