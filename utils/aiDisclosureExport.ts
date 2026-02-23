import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import type { AIDisclosureEvent } from '@/utils/aiDisclosureStorage';

type AIDisclosureSubmissionSnapshot = {
  snapshot_type: 'ai_use_disclosure_submission_snapshot';
  snapshot_version: '1.0';
  generated_at_utc: string;
  screenplay_id: string;
  screenplay_title: string;
  report: any;
};

function toSlugFileTitle(screenplayTitle?: string): string {
  return (screenplayTitle || 'screenplay')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toStableJsonValue(value: any): any {
  if (Array.isArray(value)) return value.map(toStableJsonValue);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const sortedKeys = Object.keys(value).sort();
    const result: Record<string, any> = {};
    for (const key of sortedKeys) {
      result[key] = toStableJsonValue(value[key]);
    }
    return result;
  }
  return value;
}

function stringifyStableJson(value: any): string {
  return JSON.stringify(toStableJsonValue(value), null, 2);
}

async function sha256Hex(input: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure crypto API is unavailable in this browser context');
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const digestArray = Array.from(new Uint8Array(digest));
  return digestArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function addWrappedText(
  doc: jsPDF,
  text: string,
  state: { y: number },
  options: { left: number; right: number; lineHeight: number; pageHeight: number; marginBottom: number }
) {
  const maxWidth = options.right - options.left;
  const lines = doc.splitTextToSize(text, maxWidth);
  const requiredHeight = lines.length * options.lineHeight;
  if (state.y + requiredHeight > options.pageHeight - options.marginBottom) {
    doc.addPage();
    state.y = 42;
  }
  doc.text(lines, options.left, state.y);
  state.y += requiredHeight + 4;
}

function buildAIDisclosureSubmissionPdf(
  snapshot: AIDisclosureSubmissionSnapshot,
  hashHex: string
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const left = 42;
  const right = 570;
  const pageHeight = 792;
  const marginBottom = 42;
  const lineHeight = 14;
  const state = { y: 42 };
  const events: AIDisclosureEvent[] = Array.isArray(snapshot?.report?.events) ? snapshot.report.events : [];
  const consent = snapshot?.report?.consent || {};
  const policyContext = consent?.policy_context || {};
  const sourceCounts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.source] = (acc[event.source] || 0) + 1;
    return acc;
  }, {});

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  addWrappedText(doc, 'AI Use Disclosure - Submission Version', state, { left, right, lineHeight: 20, pageHeight, marginBottom });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addWrappedText(doc, `Generated (UTC): ${snapshot.generated_at_utc}`, state, { left, right, lineHeight, pageHeight, marginBottom });
  addWrappedText(doc, `Screenplay: ${snapshot.screenplay_title}`, state, { left, right, lineHeight, pageHeight, marginBottom });
  addWrappedText(doc, `Screenplay ID: ${snapshot.screenplay_id}`, state, { left, right, lineHeight, pageHeight, marginBottom });

  state.y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  addWrappedText(doc, 'Integrity', state, { left, right, lineHeight: 16, pageHeight, marginBottom });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addWrappedText(doc, `JSON SHA-256: ${hashHex}`, state, { left, right, lineHeight, pageHeight, marginBottom });

  state.y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  addWrappedText(doc, 'Consent & Policy Context', state, { left, right, lineHeight: 16, pageHeight, marginBottom });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addWrappedText(doc, `Consent status: ${consent?.consent_status || 'unknown'}`, state, { left, right, lineHeight, pageHeight, marginBottom });
  addWrappedText(doc, `Consent note: ${consent?.consent_note || 'N/A'}`, state, { left, right, lineHeight, pageHeight, marginBottom });
  addWrappedText(doc, `Organization: ${policyContext?.org_name || 'N/A'}`, state, { left, right, lineHeight, pageHeight, marginBottom });
  addWrappedText(doc, `Policy reference: ${policyContext?.policy_reference || 'N/A'}`, state, { left, right, lineHeight, pageHeight, marginBottom });
  addWrappedText(doc, `Policy version: ${policyContext?.policy_version || 'N/A'}`, state, { left, right, lineHeight, pageHeight, marginBottom });

  state.y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  addWrappedText(doc, 'Event Summary', state, { left, right, lineHeight: 16, pageHeight, marginBottom });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addWrappedText(doc, `Tracked events: ${events.length}`, state, { left, right, lineHeight, pageHeight, marginBottom });
  Object.entries(sourceCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([source, count]) => {
      addWrappedText(doc, `- ${source}: ${count}`, state, { left, right, lineHeight, pageHeight, marginBottom });
    });

  state.y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  addWrappedText(doc, 'Event Timeline', state, { left, right, lineHeight: 16, pageHeight, marginBottom });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const maxEventsInPdf = 500;
  events.slice(0, maxEventsInPdf).forEach((event, index) => {
    const heading = `${index + 1}. ${event.timestamp} | ${event.source} | ${event.feature}`;
    addWrappedText(doc, heading, state, { left, right, lineHeight: 12, pageHeight, marginBottom });
    addWrappedText(
      doc,
      `Scene: ${event.scene_heading || 'N/A'} | Range: ${event.range_start}-${event.range_end}`,
      state,
      { left: left + 12, right, lineHeight: 12, pageHeight, marginBottom }
    );
    addWrappedText(doc, `Preview: ${event.preview || ''}`, state, {
      left: left + 12,
      right,
      lineHeight: 12,
      pageHeight,
      marginBottom,
    });
    state.y += 2;
  });

  if (events.length > maxEventsInPdf) {
    addWrappedText(
      doc,
      `Timeline truncated in PDF: showing first ${maxEventsInPdf} of ${events.length} events. Full events are in JSON.`,
      state,
      { left, right, lineHeight: 12, pageHeight, marginBottom }
    );
  }

  state.y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  addWrappedText(
    doc,
    'This report is a transparency record of attributable in-app events. It is not a legal determination and not universal origin proof.',
    state,
    { left, right, lineHeight: 12, pageHeight, marginBottom }
  );

  return doc.output('blob');
}

export async function downloadAIDisclosureSubmissionBundle(
  report: any,
  screenplayId: string,
  screenplayTitle?: string
): Promise<{ hashHex: string; zipFilename: string }> {
  const fileTitle = toSlugFileTitle(screenplayTitle) || 'screenplay';
  const generatedAtUtc = new Date().toISOString();
  const timestampForFilename = generatedAtUtc.replace(/[:.]/g, '-');

  const snapshot: AIDisclosureSubmissionSnapshot = {
    snapshot_type: 'ai_use_disclosure_submission_snapshot',
    snapshot_version: '1.0',
    generated_at_utc: generatedAtUtc,
    screenplay_id: screenplayId,
    screenplay_title: screenplayTitle || 'Untitled Screenplay',
    report,
  };

  const jsonContent = stringifyStableJson(snapshot);
  const hashHex = await sha256Hex(jsonContent);
  const pdfBlob = buildAIDisclosureSubmissionPdf(snapshot, hashHex);

  const baseName = `${fileTitle}-ai-disclosure-submission-report-${timestampForFilename}`;
  const jsonFilename = `${baseName}.json`;
  const pdfFilename = `${baseName}.pdf`;
  const hashFilename = `${baseName}.sha256.txt`;
  const zipFilename = `${baseName}.zip`;

  const hashFileContent = [
    'algorithm: SHA-256',
    `json_file: ${jsonFilename}`,
    `sha256: ${hashHex}`,
    `generated_at_utc: ${generatedAtUtc}`,
  ].join('\n');

  const zip = new JSZip();
  zip.file(jsonFilename, jsonContent);
  zip.file(pdfFilename, pdfBlob);
  zip.file(hashFilename, hashFileContent);

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = zipFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return { hashHex, zipFilename };
}
