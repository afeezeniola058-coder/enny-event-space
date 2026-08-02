import jsPDF from 'jspdf';

export interface TimelineEntry {
  id: string;
  field: string;
  old_value: string | null;
  new_value: string;
  reason: string | null;
  actor: string;
  created_at: string;
}

export interface TimelineMeta {
  bookingId: string;
  eventName: string;
  customerName?: string | null;
  eventDate?: string | null;
}

const COLORS = {
  navy: [30, 39, 97] as [number, number, number],
  gold: [212, 168, 67] as [number, number, number],
  dark: [33, 33, 33] as [number, number, number],
  mid: [100, 100, 100] as [number, number, number],
  line: [220, 220, 225] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const FIELD_LABELS: Record<string, string> = {
  created: 'Booking created',
  status: 'Booking status changed',
  payment_status: 'Payment status changed',
  event_date: 'Event date changed',
};

const ACTOR_LABELS: Record<string, string> = {
  admin: 'Staff',
  customer: 'Customer',
  system: 'System',
};

const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field;
const actorLabel = (actor: string) => ACTOR_LABELS[actor] ?? actor;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

const safeName = (value: string) =>
  value.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'booking';

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function exportStatusHistoryCSV(entries: TimelineEntry[], meta: TimelineMeta): void {
  const header = ['Date', 'Change', 'From', 'To', 'Changed by', 'Reason'];
  const rows = entries.map((entry) => [
    formatDateTime(entry.created_at),
    fieldLabel(entry.field),
    entry.old_value ?? '',
    entry.new_value,
    actorLabel(entry.actor),
    entry.reason ?? '',
  ]);

  const preamble = [
    ['Enny Event — Booking Status History'],
    ['Booking', meta.eventName],
    ['Booking ID', meta.bookingId],
    ...(meta.customerName ? [['Customer', meta.customerName]] : []),
    ...(meta.eventDate ? [['Event date', meta.eventDate]] : []),
    ['Exported', formatDateTime(new Date().toISOString())],
    [],
  ];

  const csv = [...preamble, header, ...rows]
    .map((row) => row.map((cell) => escapeCsv(String(cell))).join(','))
    .join('\r\n');

  triggerDownload(
    new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }),
    `status-history-${safeName(meta.eventName)}-${meta.bookingId.slice(0, 8)}.csv`,
  );
}

export function exportStatusHistoryPDF(entries: TimelineEntry[], meta: TimelineMeta): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const drawHeader = () => {
    doc.setFillColor(...COLORS.navy);
    doc.rect(0, 0, pageWidth, 36, 'F');
    doc.setFillColor(...COLORS.gold);
    doc.rect(0, 36, pageWidth, 2, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Enny Event', margin, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('BOOKING STATUS HISTORY', margin, 27);
    doc.setFontSize(9);
    doc.text(`#${meta.bookingId.slice(0, 8).toUpperCase()}`, pageWidth - margin, 18, { align: 'right' });
    doc.text(new Date().toLocaleDateString('en-NG'), pageWidth - margin, 25, { align: 'right' });
  };

  drawHeader();
  let y = 50;

  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(meta.eventName, margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.mid);
  if (meta.customerName) {
    doc.text(`Customer: ${meta.customerName}`, margin, y);
    y += 5;
  }
  if (meta.eventDate) {
    doc.text(`Event date: ${meta.eventDate}`, margin, y);
    y += 5;
  }
  y += 3;
  doc.setDrawColor(...COLORS.line);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  if (entries.length === 0) {
    doc.setTextColor(...COLORS.mid);
    doc.setFontSize(10);
    doc.text('No status changes recorded yet.', margin, y);
  }

  entries.forEach((entry, index) => {
    const reasonLines = entry.reason
      ? doc.splitTextToSize(`Reason: ${entry.reason}`, contentWidth - 4)
      : [];
    const blockHeight = 16 + reasonLines.length * 4.5;

    if (y + blockHeight > pageHeight - 20) {
      doc.addPage();
      drawHeader();
      y = 50;
    }

    doc.setFillColor(...COLORS.gold);
    doc.circle(margin + 1.5, y - 1.5, 1.5, 'F');

    doc.setTextColor(...COLORS.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(fieldLabel(entry.field), margin + 6, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.mid);
    doc.text(formatDateTime(entry.created_at), pageWidth - margin, y, { align: 'right' });
    y += 5;

    const transition = entry.old_value
      ? `${entry.old_value}  ->  ${entry.new_value}`
      : entry.new_value;
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(9);
    doc.text(transition, margin + 6, y);
    doc.setTextColor(...COLORS.mid);
    doc.text(`by ${actorLabel(entry.actor)}`, pageWidth - margin, y, { align: 'right' });
    y += 5;

    if (reasonLines.length) {
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.mid);
      doc.text(reasonLines, margin + 6, y);
      y += reasonLines.length * 4.5;
    }

    y += 4;
    if (index < entries.length - 1) {
      doc.setDrawColor(...COLORS.line);
      doc.line(margin + 6, y - 2, pageWidth - margin, y - 2);
      y += 2;
    }
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.mid);
    doc.text(`Page ${i} of ${pages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`status-history-${safeName(meta.eventName)}-${meta.bookingId.slice(0, 8)}.pdf`);
}
