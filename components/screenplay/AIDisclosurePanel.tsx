'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AIDisclosureConsentStatus,
  AIDisclosureEvent,
  downloadAIDisclosureReportJson,
  getAIDisclosureReport,
  updateAIDisclosureConsent,
} from '@/utils/aiDisclosureStorage';

interface AIDisclosurePanelProps {
  isOpen: boolean;
  onClose: () => void;
  screenplayId: string;
  screenplayTitle?: string;
}

type ConsentFormState = {
  consent_status: AIDisclosureConsentStatus;
  consent_note: string;
  org_name: string;
  policy_reference: string;
  policy_version: string;
};

export default function AIDisclosurePanel({
  isOpen,
  onClose,
  screenplayId,
  screenplayTitle,
}: AIDisclosurePanelProps) {
  const [loading, setLoading] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [events, setEvents] = useState<AIDisclosureEvent[]>([]);
  const [report, setReport] = useState<any>(null);
  const [consentForm, setConsentForm] = useState<ConsentFormState>({
    consent_status: 'unknown',
    consent_note: '',
    org_name: '',
    policy_reference: '',
    policy_version: '',
  });

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of events) {
      counts[event.source] = (counts[event.source] || 0) + 1;
    }
    return counts;
  }, [events]);

  useEffect(() => {
    if (!isOpen) return;

    const loadReport = async () => {
      setLoading(true);
      try {
        const nextReport = await getAIDisclosureReport(screenplayId);
        setReport(nextReport);
        setEvents(nextReport?.events || []);
        const consent = nextReport?.consent || {};
        const policy = consent?.policy_context || {};
        setConsentForm({
          consent_status: consent?.consent_status || 'unknown',
          consent_note: consent?.consent_note || '',
          org_name: policy?.org_name || '',
          policy_reference: policy?.policy_reference || '',
          policy_version: policy?.policy_version || '',
        });
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load AI disclosure report');
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [isOpen, screenplayId]);

  if (!isOpen) return null;

  const handleSaveConsent = async () => {
    setSavingConsent(true);
    try {
      await updateAIDisclosureConsent(screenplayId, {
        consent_status: consentForm.consent_status,
        consent_note: consentForm.consent_note,
        policy_context: {
          org_name: consentForm.org_name || null,
          policy_reference: consentForm.policy_reference || null,
          policy_version: consentForm.policy_version || null,
        },
      });
      toast.success('Consent and policy context saved.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save consent details');
    } finally {
      setSavingConsent(false);
    }
  };

  const handleExportJson = () => {
    if (!report) return;
    downloadAIDisclosureReportJson(report, screenplayTitle);
    toast.success('Disclosure JSON exported.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h2 className="text-lg font-semibold text-white">AI Use Disclosure</h2>
            <p className="text-xs text-gray-400">Optional transparency record for your submission workflow.</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
        </div>

        <div className="max-h-[calc(90vh-64px)] overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-sm text-gray-300">Loading disclosure report...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded border border-white/10 bg-[#121212] p-3">
                  <div className="text-xs text-gray-400">Tracked events</div>
                  <div className="text-xl font-semibold text-white">{events.length}</div>
                </div>
                {Object.entries(sourceCounts).slice(0, 3).map(([source, count]) => (
                  <div key={source} className="rounded border border-white/10 bg-[#121212] p-3">
                    <div className="text-xs text-gray-400">{source}</div>
                    <div className="text-xl font-semibold text-white">{count}</div>
                  </div>
                ))}
              </div>

              <div className="rounded border border-white/10 bg-[#121212] p-3 space-y-3">
                <h3 className="text-sm font-semibold text-white">Consent & Policy Context (optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-xs text-gray-300 flex flex-col gap-1">
                    Consent status
                    <select
                      value={consentForm.consent_status}
                      onChange={(e) => setConsentForm((prev) => ({ ...prev, consent_status: e.target.value as AIDisclosureConsentStatus }))}
                      className="bg-[#1B1B1B] border border-white/10 rounded px-2 py-2 text-sm"
                    >
                      <option value="unknown">Unknown / not declared</option>
                      <option value="declared_yes">Declared yes</option>
                      <option value="declared_no">Declared no</option>
                    </select>
                  </label>
                  <label className="text-xs text-gray-300 flex flex-col gap-1">
                    Organization name
                    <input
                      value={consentForm.org_name}
                      onChange={(e) => setConsentForm((prev) => ({ ...prev, org_name: e.target.value }))}
                      className="bg-[#1B1B1B] border border-white/10 rounded px-2 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs text-gray-300 flex flex-col gap-1">
                    Policy reference
                    <input
                      value={consentForm.policy_reference}
                      onChange={(e) => setConsentForm((prev) => ({ ...prev, policy_reference: e.target.value }))}
                      className="bg-[#1B1B1B] border border-white/10 rounded px-2 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs text-gray-300 flex flex-col gap-1">
                    Policy version
                    <input
                      value={consentForm.policy_version}
                      onChange={(e) => setConsentForm((prev) => ({ ...prev, policy_version: e.target.value }))}
                      className="bg-[#1B1B1B] border border-white/10 rounded px-2 py-2 text-sm"
                    />
                  </label>
                </div>
                <label className="text-xs text-gray-300 flex flex-col gap-1">
                  Consent note
                  <textarea
                    value={consentForm.consent_note}
                    onChange={(e) => setConsentForm((prev) => ({ ...prev, consent_note: e.target.value }))}
                    rows={3}
                    className="bg-[#1B1B1B] border border-white/10 rounded px-2 py-2 text-sm"
                  />
                </label>
                <div className="flex gap-2">
                  <button onClick={handleSaveConsent} disabled={savingConsent} className="btn btn-sm btn-primary">
                    {savingConsent ? 'Saving...' : 'Save Context'}
                  </button>
                  <button onClick={handleExportJson} className="btn btn-sm btn-outline">Export JSON</button>
                </div>
              </div>

              <div className="rounded border border-white/10 bg-[#121212] p-3">
                <h3 className="text-sm font-semibold text-white mb-2">Event Timeline</h3>
                {events.length === 0 ? (
                  <p className="text-sm text-gray-400">No tracked AI insertions yet. This report is optional and for your records.</p>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {events.map((event) => (
                      <div key={event.event_id} className="rounded border border-white/10 bg-[#161616] p-2">
                        <div className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleString()} • {event.source} • {event.feature}
                        </div>
                        <div className="text-sm text-gray-200">{event.scene_heading || 'No scene heading detected'}</div>
                        <div className="text-xs text-gray-400">Range {event.range_start}-{event.range_end}</div>
                        <div className="text-sm text-gray-300 mt-1">{event.preview}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100">
                This report is a transparency record of attributable in-app events. It is not a legal determination and not universal origin proof.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
