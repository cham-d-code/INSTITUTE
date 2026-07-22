import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Client-side export helpers (FR-114, FR-079).
 *
 * These cover the demo. In production, exports should be generated
 * SERVER-side: the API already holds the RBAC-filtered data, and every export
 * of personal data must be written to the audit log (FR-090) — something a
 * browser download cannot do. Treat these as a stopgap for the mock.
 *
 * CSV rather than a native .xlsx: the maintained SheetJS build is off npm and
 * the published one carries unpatched advisories, so we avoid it entirely. CSV
 * opens directly in Excel and Google Sheets.
 */

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function escapeCsv(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))]
  // BOM so Excel reads UTF-8 (rupee sign, names) correctly.
  download(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }), filename)
}

export function exportToPdf(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  subtitle?: string,
) {
  const doc = new jsPDF({ orientation: headers.length > 5 ? 'landscape' : 'portrait' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(subtitle, 14, 25)
  }
  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c))),
    startY: subtitle ? 30 : 24,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [10, 10, 10] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })
  doc.save(title.toLowerCase().replace(/\s+/g, '-') + '.pdf')
}
