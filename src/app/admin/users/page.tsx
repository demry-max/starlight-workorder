'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/i18n/context';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = ['ADMIN', 'MANAGER', 'STAFF'] as const;

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (user: User) => {
    if (!confirm(t('admin.users.confirmDelete').replace('{name}', user.name))) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) fetchUsers();
  };

  const handleToggleActive = async (user: User) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    const data = await res.json();
    if (data.success) fetchUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.users.title')}</h1>
        <button onClick={() => { setEditUser(null); setShowModal(true); }} className="btn-primary">
          {t('admin.users.createNew')}
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="py-12 text-center text-gray-400">{t('common.loading')}</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-400">{t('admin.users.noUsers')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.users.name')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.users.email')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.users.role')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('admin.users.status')}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                        user.role === 'MANAGER' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t(`admin.users.role_${user.role}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {user.isActive ? t('admin.users.active') : t('admin.users.inactive')}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditUser(user); setShowModal(true); }}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          {t('common.delete')}
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
        <UserModal
          user={editUser}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchUsers(); }}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'STAFF',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = isEdit ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = isEdit ? 'PATCH' : 'POST';
      const body: Record<string, string> = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        onSaved();
      } else if (data.error === 'emailExists') {
        setError(t('admin.users.emailExists'));
      } else {
        setError(t('errors.validation'));
      }
    } catch {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? t('admin.users.editUser') : t('admin.users.createNew')}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('admin.users.name')} *</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="label">{t('admin.users.email')} *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="label">
              {t('admin.users.password')} {!isEdit && '*'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="input-field"
              required={!isEdit}
              minLength={6}
              placeholder={isEdit ? t('admin.users.passwordPlaceholder') : ''}
            />
          </div>
          <div>
            <label className="label">{t('admin.users.role')}</label>
            <select value={form.role} onChange={(e) => update('role', e.target.value)} className="input-field">
              {ROLES.map((r) => (
                <option key={r} value={r}>{t(`admin.users.role_${r}`)}</option>
              ))}
            </select>
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? t('common.loading') : (isEdit ? t('common.save') : t('common.create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
