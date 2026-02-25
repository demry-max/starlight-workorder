'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/context';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { CommentThread } from '@/components/CommentThread';
import type { WorkOrderClientView, WorkOrderStatus } from '@/types';

export default function ClientWorkOrderPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [order, setOrder] = useState<WorkOrderClientView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      // First, get the work order ID from the JWT (we need a helper endpoint or decode client-side)
      // Since we store workOrderId in the JWT cookie, we'll use a simple approach:
      // Try to fetch and the API will use the session to determine the work order
      const res = await fetch('/api/client/workorder/me');
      if (res.status === 401) {
        router.push('/client/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      } else {
        setError(t('errors.notFound'));
      }
    } catch {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleComment = async (content: string) => {
    if (!order) return;
    const res = await fetch('/api/client/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workOrderId: order.id, content }),
    });
    if (res.ok) {
      fetchOrder();
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout?type=client', { method: 'POST' });
    router.push('/client/login');
  };

  const isOverdue =
    order?.dueDate &&
    new Date(order.dueDate) < new Date() &&
    !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(order.status);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-400">{t('common.loading')}</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error || t('errors.notFound')}</p>
          <button onClick={() => router.push('/client/login')} className="btn-primary mt-4">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              S
            </div>
            <span className="font-semibold text-gray-900">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitch />
            <button onClick={handleLogout} className="btn-secondary text-sm">
              {t('common.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t('client.workorder.title')}
        </h1>

        {/* Status Overview Card */}
        <div className="card mb-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('client.workorder.orderNumber')}</p>
              <p className="text-lg font-mono font-semibold text-gray-900">{order.workorderNumber}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status as WorkOrderStatus} />
              {isOverdue && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-sm font-medium text-red-700">
                  {t('client.workorder.overdue')}
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('client.workorder.progress')}</span>
              <span className="text-sm font-semibold text-brand-600">{order.progressPercentage}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="progress-bar h-3 rounded-full bg-brand-600"
                style={{ width: `${order.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 sm:grid-cols-2 mb-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-4">{t('client.workorder.title')}</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t('client.workorder.client')}</dt>
                <dd className="text-sm font-medium text-gray-900">{order.clientName}</dd>
              </div>
              {order.clientCompany && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">{t('client.workorder.company')}</dt>
                  <dd className="text-sm font-medium text-gray-900">{order.clientCompany}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t('client.workorder.priority')}</dt>
                <dd className="text-sm font-medium text-gray-900">{t(`priority.${order.priority}`)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t('client.workorder.assignedTo')}</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {order.assignedStaffName || '-'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-4">{t('client.workorder.dueDate')}</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t('client.workorder.dueDate')}</dt>
                <dd className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {order.dueDate
                    ? new Date(order.dueDate).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')
                    : t('client.workorder.notSet')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t('client.workorder.createdAt')}</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">{t('client.workorder.updatedAt')}</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(order.updatedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Description */}
        {order.description && (
          <div className="card mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('client.workorder.description')}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.description}</p>
          </div>
        )}

        {/* Status Timeline */}
        <div className="card mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">{t('client.workorder.timeline')}</h3>
          <StatusTimeline entries={order.statusHistory} />
        </div>

        {/* Comments */}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">{t('client.workorder.comments')}</h3>
          <CommentThread
            comments={order.comments}
            onSubmit={handleComment}
            placeholder={t('client.workorder.commentPlaceholder')}
          />
        </div>
      </main>
    </div>
  );
}
