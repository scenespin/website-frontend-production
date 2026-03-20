'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { RefreshCw, Shield, Sparkles, ListChecks } from 'lucide-react';

function toDateTimeLocal(ms) {
  if (!ms || !Number.isFinite(ms)) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPromoDashboard() {
  const { getToken } = useAuth();
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState(null);
  const [ledger, setLedger] = useState([]);

  const [policy, setPolicy] = useState({
    protect_from_free_reset: true,
    allow_self_serve_purchase: true,
    spend_order: 'promo_first',
    promo_tag: '',
    promo_expiry_at: '',
  });

  const [creditAction, setCreditAction] = useState({
    mode: 'grant',
    credits: 100,
    reason: 'admin_promo_adjustment',
  });

  const normalizedUserId = useMemo(() => userId.trim(), [userId]);

  async function authedFetch(url, options = {}) {
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) throw new Error('Authentication required');
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }

  async function loadUser() {
    if (!normalizedUserId) return;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const [detailsRes, ledgerRes] = await Promise.all([
        authedFetch(`/api/admin/users/${normalizedUserId}`),
        authedFetch(`/api/admin/users/${normalizedUserId}/promo/ledger?limit=100`),
      ]);

      if (!detailsRes.ok) {
        const msg = await detailsRes.json().catch(() => ({}));
        throw new Error(msg.error || 'Failed loading user');
      }
      if (!ledgerRes.ok) {
        const msg = await ledgerRes.json().catch(() => ({}));
        throw new Error(msg.error || 'Failed loading promo ledger');
      }

      const detailsData = await detailsRes.json();
      const ledgerData = await ledgerRes.json();

      setDetails(detailsData);
      setLedger(ledgerData.entries || []);

      const incomingPolicy = detailsData?.user?.promo_policy || {};
      setPolicy({
        protect_from_free_reset: incomingPolicy.protect_from_free_reset !== false,
        allow_self_serve_purchase: incomingPolicy.allow_self_serve_purchase !== false,
        spend_order: incomingPolicy.spend_order === 'core_first' ? 'core_first' : 'promo_first',
        promo_tag: incomingPolicy.promo_tag || '',
        promo_expiry_at: toDateTimeLocal(incomingPolicy.promo_expiry_at),
      });
    } catch (e) {
      setError(e.message || 'Failed loading promo user');
    } finally {
      setBusy(false);
    }
  }

  async function togglePromo(enabled) {
    if (!normalizedUserId) return;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const res = await authedFetch(`/api/admin/users/${normalizedUserId}/promo/${enabled ? 'enable' : 'disable'}`, {
        method: 'POST',
        body: JSON.stringify({ reason: enabled ? 'admin_enable_promo' : 'admin_disable_promo' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed updating promo mode');
      setStatus(enabled ? 'Promo mode enabled' : 'Promo mode disabled');
      await loadUser();
    } catch (e) {
      setError(e.message || 'Failed updating promo mode');
    } finally {
      setBusy(false);
    }
  }

  async function savePolicy() {
    if (!normalizedUserId) return;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const promoExpiryMs = policy.promo_expiry_at ? new Date(policy.promo_expiry_at).getTime() : null;
      const payload = {
        protect_from_free_reset: policy.protect_from_free_reset,
        allow_self_serve_purchase: policy.allow_self_serve_purchase,
        spend_order: policy.spend_order,
        promo_tag: policy.promo_tag || null,
        promo_expiry_at: Number.isFinite(promoExpiryMs) ? promoExpiryMs : null,
      };

      const res = await authedFetch(`/api/admin/users/${normalizedUserId}/promo/policy`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed updating policy');

      setStatus('Promo policy updated');
      await loadUser();
    } catch (e) {
      setError(e.message || 'Failed updating policy');
    } finally {
      setBusy(false);
    }
  }

  async function submitCredits() {
    if (!normalizedUserId) return;
    if (!creditAction.reason.trim()) {
      setError('Reason is required');
      return;
    }
    if (!Number.isFinite(Number(creditAction.credits)) || Number(creditAction.credits) <= 0) {
      setError('Credits must be a positive number');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('');

    try {
      const endpoint = creditAction.mode === 'grant' ? 'grant' : 'revoke';
      const idempotencyKey = `admin-${endpoint}-${normalizedUserId}-${Date.now()}`;
      const payload = {
        credits: Number(creditAction.credits),
        reason: creditAction.reason.trim(),
        idempotencyKey,
      };

      const res = await authedFetch(`/api/admin/users/${normalizedUserId}/promo/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Failed to ${endpoint} credits`);

      setStatus(`Promo credits ${endpoint === 'grant' ? 'granted' : 'revoked'} successfully`);
      await loadUser();
    } catch (e) {
      setError(e.message || 'Failed updating promo credits');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center gap-2 text-zinc-100">
          <Sparkles className="h-4 w-4 text-red-400" />
          <h2 className="text-lg font-semibold">Promo Account Controls</h2>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter Clerk/BACKEND user_id"
            className="input input-bordered w-full border-zinc-700 bg-black text-zinc-100"
          />
          <button className="btn border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={loadUser} disabled={busy || !normalizedUserId}>
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            Load
          </button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{error}</div> : null}
      {status ? <div className="rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-300">{status}</div> : null}

      {details ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs uppercase text-zinc-500">Core Balance</div>
              <div className="mt-1 text-2xl font-semibold">{details.user?.credit_balance ?? 0}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs uppercase text-zinc-500">Promo Balance</div>
              <div className="mt-1 text-2xl font-semibold">{details.user?.credit_balance_promo ?? 0}</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs uppercase text-zinc-500">Promo Enabled</div>
              <div className="mt-1 text-2xl font-semibold">{details.user?.promo_enabled ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center gap-2 text-zinc-100">
              <Shield className="h-4 w-4 text-red-400" />
              <h3 className="text-base font-semibold">Promo Mode</h3>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-sm border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => togglePromo(true)} disabled={busy}>Enable</button>
              <button className="btn btn-sm border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => togglePromo(false)} disabled={busy}>Disable</button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-base font-semibold text-zinc-100">Promo Policy</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={policy.protect_from_free_reset}
                  onChange={(e) => setPolicy((s) => ({ ...s, protect_from_free_reset: e.target.checked }))}
                />
                <span className="text-sm">Protect from free reset</span>
              </label>
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={policy.allow_self_serve_purchase}
                  onChange={(e) => setPolicy((s) => ({ ...s, allow_self_serve_purchase: e.target.checked }))}
                />
                <span className="text-sm">Allow self-serve purchase</span>
              </label>
              <select
                className="select select-bordered border-zinc-700 bg-black text-zinc-100"
                value={policy.spend_order}
                onChange={(e) => setPolicy((s) => ({ ...s, spend_order: e.target.value }))}
              >
                <option value="promo_first">promo_first</option>
                <option value="core_first">core_first</option>
              </select>
              <input
                className="input input-bordered border-zinc-700 bg-black text-zinc-100"
                placeholder="promo_tag"
                value={policy.promo_tag}
                onChange={(e) => setPolicy((s) => ({ ...s, promo_tag: e.target.value }))}
              />
              <input
                type="datetime-local"
                className="input input-bordered border-zinc-700 bg-black text-zinc-100 md:col-span-2"
                value={policy.promo_expiry_at}
                onChange={(e) => setPolicy((s) => ({ ...s, promo_expiry_at: e.target.value }))}
              />
            </div>
            <div className="mt-3">
              <button className="btn btn-sm border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={savePolicy} disabled={busy}>
                Save Policy
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-base font-semibold text-zinc-100">Promo Credit Mutation</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <select
                className="select select-bordered border-zinc-700 bg-black text-zinc-100"
                value={creditAction.mode}
                onChange={(e) => setCreditAction((s) => ({ ...s, mode: e.target.value }))}
              >
                <option value="grant">grant</option>
                <option value="revoke">revoke</option>
              </select>
              <input
                type="number"
                min="1"
                className="input input-bordered border-zinc-700 bg-black text-zinc-100"
                value={creditAction.credits}
                onChange={(e) => setCreditAction((s) => ({ ...s, credits: Number(e.target.value || 0) }))}
              />
              <input
                className="input input-bordered border-zinc-700 bg-black text-zinc-100 md:col-span-2"
                value={creditAction.reason}
                onChange={(e) => setCreditAction((s) => ({ ...s, reason: e.target.value }))}
                placeholder="reason"
              />
            </div>
            <div className="mt-3">
              <button className="btn btn-sm border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={submitCredits} disabled={busy}>
                Submit
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center gap-2 text-zinc-100">
              <ListChecks className="h-4 w-4 text-red-400" />
              <h3 className="text-base font-semibold">Promo Ledger (latest 100)</h3>
            </div>
            <div className="max-h-[440px] overflow-auto rounded-lg border border-zinc-800">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Delta Promo</th>
                    <th>Promo After</th>
                    <th>Actor</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-zinc-500">No promo ledger entries found</td>
                    </tr>
                  ) : ledger.map((entry) => (
                    <tr key={entry.ledger_id}>
                      <td>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '-'}</td>
                      <td>{entry.event_type || '-'}</td>
                      <td>{entry.delta_promo ?? '-'}</td>
                      <td>{entry.balance_after_promo ?? '-'}</td>
                      <td>{entry.actor_id || entry.actor_type || '-'}</td>
                      <td>{entry.reason_note || entry.reason_code || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
