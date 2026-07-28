import jsPDF from 'jspdf';

interface ReceiptData {
  booking: {
    id: string;
    event_name: string;
    event_date: string;
    start_time: string;
    end_time: string;
    guest_count: number;
    total_amount: number;
    discount_amount?: number | null;
    payment_status: string;
    payment_reference: string | null;
    status: string;
    created_at?: string;
    notes: string | null;
    dietary_preferences?: string[] | null;
  };
  hall?: { name: string; price_per_hour: number } | null;
  catering?: {
    name: string;
    price_per_person: number;
    pricing_type?: string | null;
    flat_price?: number | null;
  } | null;
  decoration?: { name: string; price: number; style?: string | null } | null;
  userEmail?: string;
  userName?: string;
}

const COLORS = {
  navy: [30, 39, 97] as [number, number, number],
  gold: [212, 168, 67] as [number, number, number],
  dark: [33, 33, 33] as [number, number, number],
  mid: [100, 100, 100] as [number, number, number],
  light: [160, 160, 160] as [number, number, number],
  bg: [248, 248, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  line: [220, 220, 225] as [number, number, number],
  green: [34, 139, 34] as [number, number, number],
};

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function generateReceiptPDF(data: ReceiptData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ── Header band ──
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Gold accent line
  doc.setFillColor(...COLORS.gold);
  doc.rect(0, 42, pageWidth, 2, 'F');

  // Brand name
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Enny Event', margin, 20);

  // Document title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(data.booking.payment_status === 'paid' ? 'OFFICIAL RECEIPT' : 'BOOKING INVOICE', margin, 30);

  // Receipt number (right-aligned)
  doc.setFontSize(9);
  doc.text(`#${data.booking.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(new Date().toLocaleDateString('en-NG'), pageWidth - margin, 27, { align: 'right' });

  y = 54;

  // ── Status badge ──
  const isPaid = data.booking.payment_status === 'paid';
  const statusText = isPaid ? 'PAID' : data.booking.payment_status.toUpperCase();
  const statusColor = isPaid ? COLORS.green : COLORS.gold;
  doc.setDrawColor(...statusColor);
  doc.setTextColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.roundedRect(pageWidth - margin - 30, y - 5, 30, 10, 2, 2, 'S');
  doc.text(statusText, pageWidth - margin - 15, y + 1.5, { align: 'center' });

  // ── Customer info ──
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill To:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (data.userName) { doc.text(data.userName, margin, y); y += 5; }
  if (data.userEmail) { doc.text(data.userEmail, margin, y); y += 5; }

  y += 6;

  // ── Divider ──
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Event Details Section ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy);
  doc.text('Event Details', margin, y);
  y += 8;

  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.mid);
    doc.text(label, margin, y);
    doc.setTextColor(...COLORS.dark);
    doc.text(value, margin + 50, y);
    y += 6;
  };

  addRow('Event Name', data.booking.event_name);
  addRow('Date', formatDate(data.booking.event_date));
  addRow('Time', `${formatTime(data.booking.start_time)} – ${formatTime(data.booking.end_time)}`);
  addRow('Guests', `${data.booking.guest_count}`);
  addRow('Status', data.booking.status.charAt(0).toUpperCase() + data.booking.status.slice(1));
  if (data.booking.payment_reference) {
    addRow('Payment Ref', data.booking.payment_reference);
  }

  y += 4;
  doc.setDrawColor(...COLORS.line);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Line Items Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy);
  doc.text('Services', margin, y);
  y += 8;

  // Table header
  doc.setFillColor(...COLORS.bg);
  doc.rect(margin, y - 4, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.mid);
  doc.text('ITEM', margin + 3, y);
  doc.text('DETAILS', margin + 65, y);
  doc.text('AMOUNT', pageWidth - margin - 3, y, { align: 'right' });
  y += 8;

  const addLineItem = (item: string, detail: string, amount: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    doc.text(item, margin + 3, y);
    doc.setTextColor(...COLORS.mid);
    doc.setFontSize(9);
    doc.text(detail, margin + 65, y);
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.text(amount, pageWidth - margin - 3, y, { align: 'right' });
    y += 7;
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.15);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  };

  let subtotal = 0;

  if (data.hall) {
    const hours = (() => {
      const [sh, sm] = data.booking.start_time.split(':').map(Number);
      const [eh, em] = data.booking.end_time.split(':').map(Number);
      return Math.max(1, (eh * 60 + em - sh * 60 - sm) / 60);
    })();
    const amount = data.hall.price_per_hour * hours;
    subtotal += amount;
    addLineItem('Venue', `${data.hall.name} (${hours}h)`, formatPrice(amount));
  }

  if (data.catering) {
    const isFlat = data.catering.pricing_type === 'flat';
    const amount = isFlat
      ? data.catering.flat_price ?? 0
      : data.catering.price_per_person * data.booking.guest_count;
    subtotal += amount;
    addLineItem(
      'Catering',
      isFlat
        ? `${data.catering.name} (flat rate)`
        : `${data.catering.name} x ${data.booking.guest_count} guests`,
      formatPrice(amount)
    );
    const diet = data.booking.dietary_preferences;
    if (diet && diet.length > 0) {
      addLineItem('', `Dietary: ${diet.join(', ')}`, '');
    }
  }

  if (data.decoration) {
    subtotal += data.decoration.price;
    addLineItem(
      'Decoration',
      `${data.decoration.name}${data.decoration.style ? ` (${data.decoration.style})` : ''}`,
      formatPrice(data.decoration.price)
    );
  }

  y += 6;

  // ── Subtotal / discount ──
  const discount = data.booking.discount_amount ?? 0;
  if (subtotal > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.mid);
    doc.text('Subtotal', pageWidth - margin - 65, y);
    doc.setTextColor(...COLORS.dark);
    doc.text(formatPrice(subtotal), pageWidth - margin - 3, y, { align: 'right' });
    y += 6;
  }
  if (discount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.mid);
    doc.text('Discount', pageWidth - margin - 65, y);
    doc.setTextColor(...COLORS.green);
    doc.text(`- ${formatPrice(discount)}`, pageWidth - margin - 3, y, { align: 'right' });
    y += 6;
  }

  y += 2;

  // ── Total ──
  doc.setFillColor(...COLORS.navy);
  doc.rect(pageWidth - margin - 70, y - 4, 70, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.white);
  doc.text('TOTAL', pageWidth - margin - 65, y + 3);
  doc.text(formatPrice(data.booking.total_amount), pageWidth - margin - 3, y + 3, { align: 'right' });

  y += 20;

  // ── Notes ──
  if (data.booking.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.navy);
    doc.text('Notes', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.mid);
    const noteLines = doc.splitTextToSize(data.booking.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4.5 + 6;
  }

  // ── Footer ──
  const footerY = 275;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.light);
  doc.text('Thank you for choosing Enny Event!', pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text('For inquiries: support@eventify.com  |  +234 901 767 5564', pageWidth / 2, footerY + 10, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString('en-NG')}`, pageWidth / 2, footerY + 15, { align: 'center' });

  // Download
  const filename = `enny-event-receipt-${data.booking.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}
