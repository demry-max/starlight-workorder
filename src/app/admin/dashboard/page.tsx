'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/context';
import type { DashboardStats, WorkOrderStatus } from '@/types';
import { STATUS_CONFIG } from '@/types';

export default function AdminDashboardPage() {
  const { t, locale } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-8 text-center text-gray-400">{t('common.loading')}</div>;
  }

  if (!stats) {
    return <div className="py-8 text-center text-red-500">{t('errors.generic')}</div>;
  }

  const statCards = [
    {
      label: t('admin.dashboard.totalOpen'),
      value: stats.totalOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: t('admin.dashboard.overdue'),
      value: stats.overdue,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      label: t('admin.dashboard.waitingForClient'),
      value: stats.waitingForClient,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      label: t('admin.dashboard.completedThisWeek'),
      value: stats.completedThisWeek,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.dashboard.title')}</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className={`card ${card.bgColor}`}>
            <p className="text-sm font-medium text-gray-600">{card.label}</p>
            <p className={`mt-2 text-3xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Orders by Status */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            {t('admin.dashboard.ordersByStatus')}
          </h3>
          <div className="space-y-3">
            {stats.byStatus.map((item) => {
              const config = STATUS_CONFIG[item.status as WorkOrderStatus];
              const maxCount = Math.max(...stats.byStatus.map((s) => s.count), 1);
              const width = (item.count / maxCount) * 100;

              return (
                <div key={item.status} className="flex items-center gap-3">
                  <span className="w-36 text-sm text-gray-600 truncate">
                    {locale === 'zh' ? config?.labelZh : config?.labelEn}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${width}%`,
                        backgroundColor: config?.color || '#6B7280',
                      }}
                    />
                  </div>
                  <span className="w-8 text-sm font-medium text-gray-700 text-right">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Workload */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            {t('admin.dashboard.staffWorkload')}
          </h3>
          {stats.staffWorkload.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('common.noData')}</p>
          ) : (
            <div className="space-y-3">
              {stats.staffWorkload.map((item) => {
                const maxCount = Math.max(...stats.staffWorkload.map((s) => s.count), 1);
                const width = (item.count / maxCount) * 100;

                return (
                  <div key={item.staffId} className="flex items-center gap-3">
                    <span className="w-36 text-sm text-gray-600 truncate">
                      {item.staffName}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="w-16 text-sm text-gray-500 text-right">
                      {item.count} {t('admin.dashboard.orders')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
