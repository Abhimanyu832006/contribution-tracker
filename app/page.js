'use client';

import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = [
  'Research',
  'Design',
  'Documentation',
  'Testing',
  'Meeting',
  'Other',
];

const CATEGORY_COLORS = {
  Research:      'bg-blue-100 text-blue-800',
  Design:        'bg-purple-100 text-purple-800',
  Documentation: 'bg-yellow-100 text-yellow-800',
  Testing:       'bg-green-100 text-green-800',
  Meeting:       'bg-orange-100 text-orange-800',
  Other:         'bg-gray-100 text-gray-700',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Home() {
  const [users, setUsers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    user_id: '',
    category: '',
    description: '',
    time_estimate: '',
  });

  // ── Fetch helpers ──────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
      if (data.length > 0 && !form.user_id) {
        setForm((f) => ({ ...f, user_id: data[0].id }));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/contributions');
    if (res.ok) {
      const data = await res.json();
      setContributions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchContributions();
  }, [fetchUsers, fetchContributions]);

  // ── Form handlers ──────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.user_id || !form.category || !form.description || !form.time_estimate) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:       Number(form.user_id),
          category:      form.category,
          description:   form.description,
          time_estimate: Number(form.time_estimate),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong.');
      }

      setSuccess('Contribution logged!');
      setForm((f) => ({ ...f, category: '', description: '', time_estimate: '' }));
      await fetchContributions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Totals per member ──────────────────────────────────────
  const memberTotals = users.map((u) => {
    const total = contributions
      .filter((c) => c.user_name === u.name)
      .reduce((sum, c) => sum + Number(c.time_estimate), 0);
    return { name: u.name, total };
  });

  // ── Render ─────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-5 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 leading-tight">Contribution Tracker</h1>
            <p className="text-xs text-gray-500">Group Assignment · Log & Dashboard</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Member Summary Cards */}
        {memberTotals.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Team Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              {memberTotals.map(({ name, total }) => (
                <div key={name} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-900">{name}</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{total.toFixed(1)}<span className="text-sm font-normal text-gray-500 ml-1">hrs</span></p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Log Contribution Form */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Log a Contribution</h2>

          {error   && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
          {success && <p className="mb-4 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">{success}</p>}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {/* Member */}
            <div className="flex flex-col gap-1">
              <label htmlFor="user_id" className="text-xs font-medium text-gray-600">Team Member</label>
              <select
                id="user_id"
                name="user_id"
                value={form.user_id}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1">
              <label htmlFor="category" className="text-xs font-medium text-gray-600">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="col-span-2 flex flex-col gap-1">
              <label htmlFor="description" className="text-xs font-medium text-gray-600">Description</label>
              <input
                id="description"
                name="description"
                type="text"
                value={form.description}
                onChange={handleChange}
                placeholder="What did you work on?"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Hours */}
            <div className="flex flex-col gap-1">
              <label htmlFor="time_estimate" className="text-xs font-medium text-gray-600">Hours</label>
              <input
                id="time_estimate"
                name="time_estimate"
                type="number"
                min="0.1"
                step="0.1"
                value={form.time_estimate}
                onChange={handleChange}
                placeholder="0.0"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <button
                id="submit-contribution"
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving…' : 'Log Contribution'}
              </button>
            </div>
          </form>
        </section>

        {/* Recent Contributions */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Contributions</h2>

          {loading && (
            <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
          )}

          {!loading && contributions.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-12 text-center">
              <p className="text-sm text-gray-400">No contributions yet. Log your first one above!</p>
            </div>
          )}

          {!loading && contributions.length > 0 && (
            <div className="space-y-3">
              {contributions.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4"
                >
                  {/* Category badge */}
                  <span className={`mt-0.5 inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.Other}`}>
                    {c.category}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.user_name}</p>
                  </div>

                  {/* Hours + date */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-indigo-600">{Number(c.time_estimate).toFixed(1)} hrs</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
