'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n/context';

interface Comment {
  id: string;
  authorType: string;
  authorName: string | null;
  content: string;
  isInternal?: boolean;
  createdAt: string;
}

interface CommentThreadProps {
  comments: Comment[];
  onSubmit: (content: string, isInternal?: boolean) => Promise<void>;
  showInternalToggle?: boolean;
  placeholder?: string;
}

export function CommentThread({
  comments,
  onSubmit,
  showInternalToggle = false,
  placeholder,
}: CommentThreadProps) {
  const { t, locale } = useTranslation();
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(content.trim(), isInternal);
      setContent('');
      setIsInternal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">
          {t('client.workorder.noComments')}
        </p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-lg p-4 ${
                comment.isInternal
                  ? 'border-l-4 border-yellow-400 bg-yellow-50'
                  : comment.authorType === 'STAFF'
                  ? 'bg-brand-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {comment.authorName || (comment.authorType === 'CLIENT' ? t('admin.detail.clientLabel') : t('admin.detail.staffLabel'))}
                  </span>
                  {comment.isInternal && (
                    <span className="rounded bg-yellow-200 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
                      {t('admin.detail.internalLabel')}
                    </span>
                  )}
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    comment.authorType === 'CLIENT'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-brand-100 text-brand-700'
                  }`}>
                    {comment.authorType === 'CLIENT' ? t('admin.detail.clientLabel') : t('admin.detail.staffLabel')}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(comment.createdAt).toLocaleString(
                    locale === 'zh' ? 'zh-CN' : 'en-US'
                  )}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || t('client.workorder.commentPlaceholder')}
          rows={3}
          className="input-field resize-none"
          maxLength={2000}
        />
        <div className="flex items-center justify-between">
          {showInternalToggle && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-gray-600">{t('admin.workorderForm.internalNote')}</span>
            </label>
          )}
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="btn-primary ml-auto"
          >
            {submitting ? t('common.loading') : t('client.workorder.submitComment')}
          </button>
        </div>
      </form>
    </div>
  );
}
