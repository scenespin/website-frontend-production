'use client';

import { useState, useEffect } from 'react';
import { Mail, Search, Users, Send, UserCheck, UserX, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const ONBOARDING_STEPS = [
  { step: 1, subject: "You're in – here's your first step" },
  { step: 2, subject: "Your first win: one scene on the page" },
  { step: 3, subject: "You don't have to write alone – 5 AI agents, then Produce" },
  { step: 4, subject: "Add one character and one location in Produce" },
  { step: 5, subject: "Generate your first video in Direct" },
  { step: 6, subject: "You're ready – review your shots and what's next" },
];

export default function AdminNewsletterDashboard() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [stats, setStats] = useState({
    total: 0,
    subscribed: 0,
    unsubscribed: 0,
    inOnboarding: 0,
    completedOnboarding: 0,
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadSubscribers();
  }, [page, status, search]);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        status,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/newsletter/subscribers?${params}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to load subscribers');

      setSubscribers(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
      setStats(json.stats || stats);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '–';
    const date = new Date(d);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Mail className="w-7 h-7" />
        Newsletter & Onboarding
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-base-content/70 flex items-center gap-1">
            <Users className="w-4 h-4" /> Total
          </div>
        </div>
        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.subscribed}</div>
          <div className="text-sm text-base-content/70 flex items-center gap-1">
            <UserCheck className="w-4 h-4" /> Subscribed
          </div>
        </div>
        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.unsubscribed}</div>
          <div className="text-sm text-base-content/70 flex items-center gap-1">
            <UserX className="w-4 h-4" /> Unsubscribed
          </div>
        </div>
        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.inOnboarding}</div>
          <div className="text-sm text-base-content/70 flex items-center gap-1">
            <Send className="w-4 h-4" /> In onboarding
          </div>
        </div>
        <div className="bg-base-200 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.completedOnboarding}</div>
          <div className="text-sm text-base-content/70 flex items-center gap-1">
            <Mail className="w-4 h-4" /> Course done
          </div>
        </div>
      </div>

      {/* Onboarding emails reference */}
      <div className="bg-base-200 rounded-lg p-4">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5" />
          Onboarding emails (6 steps)
        </h2>
        <p className="text-sm text-base-content/70 mb-3">
          Copy and templates live in <code className="bg-base-300 px-1 rounded">libs/onboardingEmails.js</code>. Plan: <code className="bg-base-300 px-1 rounded">docs/NEWSLETTER_AND_ONBOARDING_EMAIL_PLAN.md</code>, <code className="bg-base-300 px-1 rounded">docs/NEWSLETTER_ONBOARDING_FINAL_COPY.md</code>.
        </p>
        <ul className="text-sm space-y-1">
          {ONBOARDING_STEPS.map(({ step, subject }) => (
            <li key={step}>
              <span className="font-mono text-base-content/70">Step {step}:</span> {subject}
            </li>
          ))}
        </ul>
      </div>

      {/* Sync to Resend */}
      <div className="bg-base-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Sync to Resend</h2>
        <p className="text-sm text-base-content/70 mb-3">
          Push this list to Resend so you can send one-off campaigns from the Resend Dashboard (Broadcasts). Uses audience &quot;Wryda Newsletter&quot; or <code className="bg-base-300 px-1 rounded">RESEND_AUDIENCE_ID</code> if set.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={syncing || stats.total === 0}
          onClick={async () => {
            setSyncing(true);
            try {
              const res = await fetch('/api/admin/newsletter/sync-resend', { method: 'POST' });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || 'Sync failed');
              toast.success(`Synced ${json.synced} of ${json.total} to Resend${json.errorCount ? ` (${json.errorCount} errors)` : ''}`);
            } catch (e) {
              toast.error(e.message || 'Sync failed');
            } finally {
              setSyncing(false);
            }
          }}
        >
          {syncing ? 'Syncing…' : 'Sync to Resend'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Search (email / name)</span>
          </label>
          <input
            type="text"
            placeholder="Search…"
            className="input input-bordered w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadSubscribers()}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Status</span>
          </label>
          <select
            className="select select-bordered"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="all">All</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="complained">Complained</option>
          </select>
        </div>
        <button className="btn btn-primary mt-6" onClick={loadSubscribers} disabled={loading}>
          {loading ? 'Loading…' : 'Apply'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-base-300">
        {loading ? (
          <div className="p-8 text-center text-base-content/70">Loading subscribers…</div>
        ) : subscribers.length === 0 ? (
          <div className="p-8 text-center text-base-content/70">No subscribers match the filters.</div>
        ) : (
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Source</th>
                <th>Onboarding</th>
                <th>Next send</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-sm">{s.email}</td>
                  <td>{s.name || '–'}</td>
                  <td>{s.source}</td>
                  <td>
                    {s.onboarding_enrolled_at
                      ? `Step ${s.onboarding_step}${s.onboarding_step >= 6 ? ' (done)' : ''}`
                      : '–'}
                  </td>
                  <td className="text-sm">{s.onboarding_next_send_at ? formatDate(s.onboarding_next_send_at) : '–'}</td>
                  <td>
                    {s.unsubscribed_at && <span className="badge badge-ghost">Unsubscribed</span>}
                    {s.bounced_at && <span className="badge badge-warning">Bounced</span>}
                    {s.complaint_at && <span className="badge badge-error">Complained</span>}
                    {!s.unsubscribed_at && !s.bounced_at && !s.complaint_at && (
                      <span className="badge badge-success">Active</span>
                    )}
                  </td>
                  <td className="text-sm text-base-content/70">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            className="btn btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-sm">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <button
            className="btn btn-sm"
            disabled={page >= pagination.pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <p className="text-sm text-base-content/60">
        Sent emails and delivery status: <a href="https://resend.com/emails" target="_blank" rel="noopener noreferrer" className="link">Resend Dashboard</a>.
      </p>
    </div>
  );
}
