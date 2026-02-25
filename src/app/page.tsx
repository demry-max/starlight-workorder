'use client';

import Link from 'next/link';
import { useTranslation } from '@/i18n/context';
import { LanguageSwitch } from '@/components/LanguageSwitch';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
      <div className="absolute top-4 right-4">
        <LanguageSwitch />
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-900 text-2xl font-bold text-brand-500 shadow-lg">
            S
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {t('common.appName')}
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            {t('common.companyName')}
          </p>
        </div>

        <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
          <Link
            href="/client/login"
            className="card flex flex-col items-center p-8 text-center transition hover:shadow-md hover:ring-brand-200"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('client.login.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('client.login.subtitle')}
            </p>
          </Link>

          <Link
            href="/admin/login"
            className="card flex flex-col items-center p-8 text-center transition hover:shadow-md hover:ring-brand-200"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('admin.login.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('admin.login.subtitle')}
            </p>
          </Link>
        </div>

        <p className="mt-12 text-xs text-gray-400">
          {t('common.copyright')}
        </p>
      </div>
    </div>
  );
}
