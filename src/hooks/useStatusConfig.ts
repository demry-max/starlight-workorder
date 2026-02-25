'use client';

import { useEffect, useState } from 'react';
import { STATUS_CONFIG } from '@/types';
import type { StatusConfig } from '@/types';

interface StatusTransition {
  fromStatusKey: string;
  toStatusKey: string;
}

interface UseStatusConfigReturn {
  configs: Record<string, StatusConfig>;
  configList: StatusConfig[];
  transitions: StatusTransition[];
  getValidNextStatuses: (current: string) => string[];
  isTerminal: (status: string) => boolean;
  getLabel: (status: string, locale: string) => string;
  loading: boolean;
}

let cachedConfigs: Record<string, StatusConfig> | null = null;
let cachedConfigList: StatusConfig[] | null = null;
let cachedTransitions: StatusTransition[] | null = null;
let fetchPromise: Promise<void> | null = null;

function fetchStatusData(): Promise<void> {
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/statuses')
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const map: Record<string, StatusConfig> = {};
        for (const c of data.data.configs) {
          map[c.key] = c;
        }
        cachedConfigs = map;
        cachedConfigList = data.data.configs;
        cachedTransitions = data.data.transitions;
      }
    })
    .catch(() => {
      // Fallback to hardcoded configs
      cachedConfigs = STATUS_CONFIG;
      cachedConfigList = Object.values(STATUS_CONFIG);
      cachedTransitions = [];
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function useStatusConfig(): UseStatusConfigReturn {
  const [configs, setConfigs] = useState<Record<string, StatusConfig>>(
    cachedConfigs || STATUS_CONFIG,
  );
  const [configList, setConfigList] = useState<StatusConfig[]>(
    cachedConfigList || Object.values(STATUS_CONFIG),
  );
  const [transitions, setTransitions] = useState<StatusTransition[]>(
    cachedTransitions || [],
  );
  const [loading, setLoading] = useState(!cachedConfigs);

  useEffect(() => {
    if (cachedConfigs) {
      setConfigs(cachedConfigs);
      setConfigList(cachedConfigList!);
      setTransitions(cachedTransitions!);
      setLoading(false);
      return;
    }

    fetchStatusData().then(() => {
      if (cachedConfigs) {
        setConfigs(cachedConfigs);
        setConfigList(cachedConfigList!);
        setTransitions(cachedTransitions!);
      }
      setLoading(false);
    });
  }, []);

  const getValidNextStatuses = (current: string): string[] => {
    return transitions
      .filter((t) => t.fromStatusKey === current)
      .map((t) => t.toStatusKey);
  };

  const isTerminal = (status: string): boolean => {
    return configs[status]?.isTerminal ?? false;
  };

  const getLabel = (status: string, locale: string): string => {
    const config = configs[status];
    if (!config) return status;
    return locale === 'zh' ? config.labelZh : config.labelEn;
  };

  return { configs, configList, transitions, getValidNextStatuses, isTerminal, getLabel, loading };
}

// Force re-fetch on next hook usage (call after admin edits statuses)
export function invalidateStatusCache() {
  cachedConfigs = null;
  cachedConfigList = null;
  cachedTransitions = null;
  fetchPromise = null;
}
