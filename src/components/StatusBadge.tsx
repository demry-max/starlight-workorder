'use client';

import { useTranslation } from '@/i18n/context';
import { useStatusConfig } from '@/hooks/useStatusConfig';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { locale } = useTranslation();
  const { configs } = useStatusConfig();
  const config = configs[status];

  const label = config
    ? (locale === 'zh' ? config.labelZh : config.labelEn)
    : status;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: config?.bgColor || '#F3F4F6',
        color: config?.textColor || '#374151',
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: config?.color || '#6B7280' }}
      />
      {label}
    </span>
  );
}
