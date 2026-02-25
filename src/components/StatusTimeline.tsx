'use client';

import { useTranslation } from '@/i18n/context';
import { useStatusConfig } from '@/hooks/useStatusConfig';

interface TimelineEntry {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  note: string | null;
  createdAt: string;
}

interface StatusTimelineProps {
  entries: TimelineEntry[];
}

export function StatusTimeline({ entries }: StatusTimelineProps) {
  const { t, locale } = useTranslation();
  const { configs } = useStatusConfig();

  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">{t('common.noData')}</p>;
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {entries.map((entry, idx) => {
          const config = configs[entry.newStatus];
          const isLast = idx === entries.length - 1;

          return (
            <li key={entry.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-gray-200" />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white"
                      style={{ backgroundColor: config?.color || '#6B7280' }}
                    >
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {config
                        ? (locale === 'zh' ? config.labelZh : config.labelEn)
                        : entry.newStatus}
                    </div>
                    {entry.note && (
                      <p className="mt-0.5 text-sm text-gray-500">{entry.note}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(entry.createdAt).toLocaleString(
                        locale === 'zh' ? 'zh-CN' : 'en-US'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
