'use client';

import { useTranslation } from '@/i18n/context';
import { STATUS_CONFIG } from '@/types';
import type { WorkOrderStatus } from '@/types';

interface StatusBadgeProps {
  status: WorkOrderStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { locale } = useTranslation();
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const label = locale === 'zh' ? config.labelZh : config.labelEn;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {label}
    </span>
  );
}
