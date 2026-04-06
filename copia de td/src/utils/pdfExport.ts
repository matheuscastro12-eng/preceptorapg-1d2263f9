// PDF Export — PreceptorMED
// Uses jsPDF directly for reliable rendering with professional formatting

interface PDFExportOptions {
  tema: string;
  contentElement?: HTMLElement;
  markdown?: string;
}

const C = {
  green:       [0, 83, 68]     as [number, number, number],
  greenDark:   [0, 60, 48]     as [number, number, number],
  greenMid:    [0, 109, 91]    as [number, number, number],  // tom diferente p/ H3
  greenLight:  [200, 234, 222] as [number, number, number],
  greenBg:     [243, 250, 248] as [number, number, number],
  gold:        [201, 168, 76]  as [number, number, number],
  black:       [30, 32, 33]    as [number, number, number],
  text:        [45, 50, 52]    as [number, number, number],  // corpo de texto
  gray:        [120, 128, 125] as [number, number, number],
  grayLight:   [190, 195, 193] as [number, number, number],
  white:       [255, 255, 255] as [number, number, number],
  tableBorder: [220, 228, 225] as [number, number, number],
  tableHeader: [0, 73, 58]     as [number, number, number],
  tableStripe: [248, 251, 250] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const ML = 22;
const MR = 22;
const MT = 28;
const MB = 24;
const CW = PAGE_W - ML - MR;

// Font sizes
const F = {
  body: 11,
  bodySmall: 10,
  bullet: 11,
  h1: 20,
  h2: 14.5,
  h3: 12.5,
  h4: 11.5,
  quote: 10.5,
  table: 9.5,
  footer: 7.5,
};

// Line heights
const LH = {
  body: 5.2,
  bullet: 5,
  h1: 8.5,
  h2: 7,
  h3: 5.8,
  h4: 5.2,
  quote: 4.8,
  table: 5.5,
};

// Font helpers — titles in helvetica (sans), body in times (serif) like academic papers
const setTitleFont = (doc: any, style: 'bold' | 'normal' = 'bold') => doc.setFont('helvetica', style);
const setBodyFont = (doc: any, style: 'normal' | 'bold' | 'italic' = 'normal') => doc.setFont('times', style);

export const exportToPDF = async ({ tema, contentElement, markdown }: PDFExportOptions): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MT;

  let rawText = markdown || '';
  if (!rawText && contentElement) rawText = extractMarkdownFromHTML(contentElement);
  if (!rawText.trim()) throw new Error('Sem conteúdo para exportar');

  // ══════════════════════════════════════════════════════════
  // COVER PAGE
  // ══════════════════════════════════════════════════════════

  // Background
  doc.setFillColor(...C.green);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Corner accents (sem GState/opacity)
  doc.setFillColor(0, 93, 78);
  doc.triangle(PAGE_W, 0, PAGE_W, 70, PAGE_W - 70, 0, 'F');
  doc.setFillColor(0, 70, 55);
  doc.triangle(0, PAGE_H, 55, PAGE_H, 0, PAGE_H - 55, 'F');

  // Gold accent line
  doc.setFillColor(...C.gold);
  doc.rect(ML, 42, 45, 1.8, 'F');

  // Brand label
  doc.setTextColor(...C.gold);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PRECEPTORMED', ML, 38);

  // Title
  doc.setTextColor(...C.white);
  doc.setFontSize(34);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(tema, CW - 10);
  doc.text(titleLines, ML, 65);

  const titleEndY = 65 + titleLines.length * 14;

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.greenLight);
  doc.text('Fechamento de Objetivos', ML, titleEndY + 10);

  // Second gold accent
  doc.setFillColor(...C.gold);
  doc.rect(ML, titleEndY + 16, 25, 0.8, 'F');

  // Bottom info
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  doc.setFillColor(0, 93, 78);
  doc.roundedRect(ML, PAGE_H - 75, CW, 45, 3, 3, 'F');

  doc.setTextColor(...C.greenLight);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('DATA DE GERAÇÃO', ML + 10, PAGE_H - 62);
  doc.setTextColor(...C.white);
  doc.setFontSize(12);
  doc.text(dateStr, ML + 10, PAGE_H - 55);

  doc.setTextColor(...C.greenLight);
  doc.setFontSize(9);
  doc.text('GERADO POR', ML + 10, PAGE_H - 44);
  doc.setTextColor(...C.white);
  doc.setFontSize(12);
  doc.text('Inteligência Artificial — PreceptorMED', ML + 10, PAGE_H - 37);

  // Legal
  doc.setTextColor(...C.greenLight);
  doc.setFontSize(7.5);
  doc.text('Conteúdo gerado por IA para fins educacionais. Não substitui orientação médica. (CFM 2.338/2023)', ML, PAGE_H - 15);

  // ══════════════════════════════════════════════════════════
  // CONTENT PAGES
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  y = MT;

  const lines = rawText.split('\n');
  let tableRows: string[][] = [];
  let inTable = false;

  const checkPage = (needed: number) => {
    if (y + needed > PAGE_H - MB) { doc.addPage(); y = MT; }
  };

  // ── Table renderer with proper text wrapping ──
  const flushTable = () => {
    if (tableRows.length === 0) return;
    const cols = tableRows[0]?.length || 1;
    const colW = (CW - 2) / cols;  // -2 for border padding
    const cellPad = 2.5;

    // Calculate row heights based on content wrapping
    const getRowHeight = (row: string[], fontSize: number): number => {
      doc.setFontSize(fontSize);
      let maxLines = 1;
      row.forEach(cell => {
        const wrapped = doc.splitTextToSize(cleanMd(cell), colW - cellPad * 2);
        maxLines = Math.max(maxLines, wrapped.length);
      });
      return maxLines * (fontSize * 0.38) + 5;  // dynamic height
    };

    // Header
    if (tableRows.length > 0) {
      const headerH = getRowHeight(tableRows[0], F.table);
      checkPage(headerH + 4);
      doc.setFillColor(...C.tableHeader);
      doc.roundedRect(ML, y, CW, headerH, 1.5, 1.5, 'F');
      doc.setTextColor(...C.white);
      doc.setFontSize(F.table);
      doc.setFont('helvetica', 'bold');
      tableRows[0].forEach((cell, ci) => {
        const wrapped = doc.splitTextToSize(cleanMd(cell), colW - cellPad * 2);
        doc.text(wrapped, ML + ci * colW + cellPad + 1, y + 4);
      });
      y += headerH;

      // Column separator lines in header
      doc.setDrawColor(0, 100, 80);
      doc.setLineWidth(0.1);
      for (let ci = 1; ci < cols; ci++) {
        doc.line(ML + ci * colW + 1, y - headerH + 2, ML + ci * colW + 1, y - 2);
      }
    }

    // Data rows
    for (let ri = 1; ri < tableRows.length; ri++) {
      const row = tableRows[ri];
      doc.setFontSize(F.table);
      doc.setFont('times', 'normal');
      const rowH = getRowHeight(row, F.table);
      checkPage(rowH + 2);

      // Stripe background
      if (ri % 2 === 0) {
        doc.setFillColor(...C.tableStripe);
        doc.rect(ML, y, CW, rowH, 'F');
      }

      // Row border
      doc.setDrawColor(...C.tableBorder);
      doc.setLineWidth(0.15);
      doc.line(ML, y + rowH, ML + CW, y + rowH);

      // Column separators
      for (let ci = 1; ci < cols; ci++) {
        doc.setDrawColor(...C.tableBorder);
        doc.line(ML + ci * colW + 1, y, ML + ci * colW + 1, y + rowH);
      }

      // Cell text
      doc.setTextColor(...C.text);
      row.forEach((cell, ci) => {
        const wrapped = doc.splitTextToSize(cleanMd(cell), colW - cellPad * 2);
        doc.text(wrapped, ML + ci * colW + cellPad + 1, y + 4);
      });
      y += rowH;
    }

    // Outer border
    doc.setDrawColor(...C.tableBorder);
    doc.setLineWidth(0.3);
    const totalH = y - (tableRows.length > 0 ? tableRows.reduce((_, __, i) => i, 0) : 0);
    y += 6;
    tableRows = [];
    inTable = false;
  };

  for (let li = 0; li < lines.length; li++) {
    const trimmed = lines[li].trim();

    // ── Table ──
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').filter(c => c.trim() !== '').map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) { inTable = true; continue; }
      tableRows.push(cells);
      inTable = true;
      continue;
    }
    if (inTable && !trimmed.startsWith('|')) flushTable();

    if (!trimmed) { y += 3; continue; }

    // ── H1 ──
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      checkPage(22);
      y += 10;
      doc.setFillColor(...C.green);
      doc.rect(ML, y - 6, 3.5, 12, 'F');
      doc.setFontSize(F.h1);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.black);
      const h = doc.splitTextToSize(trimmed.replace(/^# /, ''), CW - 10);
      doc.text(h, ML + 8, y);
      y += h.length * LH.h1 + 3;
      doc.setDrawColor(...C.green);
      doc.setLineWidth(0.7);
      doc.line(ML, y, ML + CW, y);
      y += 8;
      continue;
    }

    // ── H2 ──
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      checkPage(18);
      y += 8;
      const h2t = trimmed.replace(/^## /, '');
      const h2 = doc.splitTextToSize(h2t, CW - 8);
      const h2H = h2.length * LH.h2 + 8;
      doc.setFillColor(...C.greenBg);
      doc.roundedRect(ML, y - 6, CW, h2H, 2, 2, 'F');
      doc.setFillColor(...C.green);
      doc.rect(ML, y - 6, 2.5, h2H, 'F');
      doc.setFontSize(F.h2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.green);
      doc.text(h2, ML + 7, y);
      y += h2H + 5;
      continue;
    }

    // ── H3 (tom diferente de verde) ──
    if (trimmed.startsWith('### ')) {
      checkPage(15);
      y += 6;
      doc.setFontSize(F.h3);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.greenMid);  // verde mais claro diferente
      const h3 = doc.splitTextToSize(trimmed.replace(/^### /, ''), CW);
      doc.text(h3, ML, y);
      y += h3.length * LH.h3 + 1;
      doc.setDrawColor(...C.gold);
      doc.setLineWidth(0.5);
      doc.line(ML, y, ML + 30, y);
      y += 5;
      continue;
    }

    // ── H4 ──
    if (trimmed.startsWith('#### ')) {
      checkPage(12);
      y += 4;
      doc.setFontSize(F.h4);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.black);
      const h4 = doc.splitTextToSize(trimmed.replace(/^#### /, ''), CW);
      doc.text(h4, ML, y);
      y += h4.length * LH.h4 + 3;
      continue;
    }

    // ── Blockquote ──
    if (trimmed.startsWith('> ')) {
      checkPage(14);
      const qt = cleanMd(trimmed.replace(/^> /, ''));
      doc.setFontSize(F.quote);
      doc.setFont('times', 'italic');
      doc.setTextColor(...C.gray);
      const ql = doc.splitTextToSize(qt, CW - 14);
      const qH = ql.length * LH.quote + 10;
      doc.setFillColor(...C.greenBg);
      doc.roundedRect(ML, y - 3, CW, qH, 2, 2, 'F');
      doc.setFillColor(...C.gold);
      doc.rect(ML, y - 3, 2, qH, 'F');
      doc.text(ql, ML + 8, y + 3);
      y += qH + 4;
      continue;
    }

    // ── HR ──
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      checkPage(10);
      y += 5;
      doc.setDrawColor(...C.grayLight);
      doc.setLineWidth(0.2);
      const dashLen = 3;
      for (let x = ML + 25; x < ML + CW - 25; x += dashLen * 2) {
        doc.line(x, y, x + dashLen, y);
      }
      y += 6;
      continue;
    }

    // ── Bullet ──
    if (/^[-*•]\s/.test(trimmed)) {
      const bt = cleanMd(trimmed.replace(/^[-*•]\s/, ''));
      doc.setFontSize(F.bullet);
      doc.setFont('times', 'normal');
      doc.setTextColor(...C.text);
      const bl = doc.splitTextToSize(bt, CW - 12);
      checkPage(bl.length * LH.bullet + 4);
      doc.setFillColor(...C.greenMid);
      doc.circle(ML + 2.5, y - 1.2, 0.9, 'F');
      doc.text(bl, ML + 7, y);
      y += bl.length * LH.bullet + 2;
      continue;
    }

    // ── Sub-bullet ──
    if (/^\s{2,}[-*•]\s/.test(lines[li])) {
      const sbt = cleanMd(lines[li].trim().replace(/^[-*•]\s/, ''));
      doc.setFontSize(F.bodySmall);
      doc.setFont('times', 'normal');
      doc.setTextColor(...C.gray);
      const sbl = doc.splitTextToSize(sbt, CW - 18);
      checkPage(sbl.length * 4 + 3);
      doc.setDrawColor(...C.grayLight);
      doc.circle(ML + 8, y - 1, 0.5, 'S');
      doc.text(sbl, ML + 12, y);
      y += sbl.length * 4 + 1.5;
      continue;
    }

    // ── Numbered list ──
    if (/^\d+\.\s/.test(trimmed)) {
      const nm = trimmed.match(/^(\d+)\.\s(.*)/);
      if (nm) {
        doc.setFontSize(F.bullet);
        doc.setFont('times', 'normal');
        const nl = doc.splitTextToSize(cleanMd(nm[2]), CW - 14);
        checkPage(nl.length * LH.bullet + 4);
        doc.setFillColor(...C.green);
        doc.roundedRect(ML, y - 4, 6, 6, 1.2, 1.2, 'F');
        doc.setTextColor(...C.white);
        doc.setFont('helvetica', 'bold');
        doc.text(nm[1], ML + 3, y, { align: 'center' });
        doc.setFont('times', 'normal');
        doc.setTextColor(...C.text);
        doc.text(nl, ML + 9, y);
        y += nl.length * LH.bullet + 2.5;
      }
      continue;
    }

    // ── Paragraph ──
    checkPage(10);
    doc.setFontSize(F.body);
    doc.setFont('times', 'normal');
    doc.setTextColor(...C.text);
    const pt = cleanMd(trimmed);
    const pl = doc.splitTextToSize(pt, CW);
    doc.text(pl, ML, y);
    y += pl.length * LH.body + 2.5;
  }

  if (inTable) flushTable();

  // ── Page headers + footers ──
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    // Top green line
    doc.setFillColor(...C.green);
    doc.rect(ML, MT - 10, CW, 0.5, 'F');
    // Footer left
    doc.setFontSize(F.footer);
    doc.setTextColor(...C.grayLight);
    doc.setFont('helvetica', 'normal');
    doc.text('PreceptorMED', ML, PAGE_H - 10);
    doc.setTextColor(...C.gray);
    doc.text(tema.substring(0, 55), ML, PAGE_H - 6);
    // Page badge
    doc.setFillColor(...C.green);
    doc.roundedRect(PAGE_W - MR - 12, PAGE_H - 14, 12, 7, 1.5, 1.5, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i - 1}`, PAGE_W - MR - 6, PAGE_H - 9.5, { align: 'center' });
  }

  const filename = `preceptormed-${tema.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-àáâãéêíóôõúç]/g, '').substring(0, 50)}.pdf`;
  doc.save(filename);
};

function cleanMd(t: string): string {
  return t
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    // Replace special chars that jsPDF can't render (causes monospace bug)
    .replace(/β/g, 'beta')
    .replace(/α/g, 'alfa')
    .replace(/γ/g, 'gama')
    .replace(/δ/g, 'delta')
    .replace(/Δ/g, 'Delta')
    .replace(/μ/g, 'micro')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/¹/g, '1')
    .replace(/°/g, 'o')
    .replace(/±/g, '+/-')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/→/g, ' -> ')
    .replace(/←/g, ' <- ')
    .replace(/↑/g, '(aumenta)')
    .replace(/↓/g, '(diminui)')
    .replace(/⚠️/g, '[!]')
    .replace(/✅/g, '[OK]')
    .replace(/❌/g, '[X]')
    .replace(/•/g, '-')
    .replace(/–/g, '-')
    .replace(/—/g, ' - ')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/…/g, '...')
    .replace(/\u00A0/g, ' ')  // non-breaking space
    .replace(/[^\x00-\x7F\xC0-\xFF\u0100-\u017F]/g, '');  // remove remaining non-latin chars
}

function extractMarkdownFromHTML(el: HTMLElement): string {
  const out: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { const t = node.textContent?.trim(); if (t) out.push(t); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (node as HTMLElement).tagName.toLowerCase();
    const text = (node as HTMLElement).textContent?.trim() || '';
    if (tag === 'h1') { out.push(`# ${text}`); return; }
    if (tag === 'h2') { out.push(`## ${text}`); return; }
    if (tag === 'h3') { out.push(`### ${text}`); return; }
    if (tag === 'h4') { out.push(`#### ${text}`); return; }
    if (tag === 'li') { out.push(`- ${text}`); return; }
    if (tag === 'blockquote') { out.push(`> ${text}`); return; }
    if (tag === 'hr') { out.push('---'); return; }
    if (tag === 'br') { out.push(''); return; }
    if (tag === 'th' || tag === 'td') return;
    if (tag === 'tr') {
      const cells = Array.from((node as HTMLElement).querySelectorAll('th, td')).map(c => c.textContent?.trim() || '');
      out.push('| ' + cells.join(' | ') + ' |');
      if ((node as HTMLElement).querySelector('th')) out.push('| ' + cells.map(() => '---').join(' | ') + ' |');
      return;
    }
    if (tag === 'p') { if (text) out.push(text); out.push(''); return; }
    node.childNodes.forEach(walk);
    if (['div', 'section', 'article', 'table'].includes(tag)) out.push('');
  };
  el.childNodes.forEach(walk);
  return out.join('\n');
}
