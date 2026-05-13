// PDF Export — PreceptorMED
// Visual estilo revista/journal academico premium:
//   - Capa editorial em marfim com hairlines + acentos verde/ouro
//   - Sumario automatico (TOC) em pagina dedicada
//   - Hierarquia de titulos numerada (01. / 1.1 / 1.1.1)
//   - Drop cap na primeira letra do primeiro paragrafo
//   - Callouts diferenciados (perola clinica, atencao, dica)
//   - Tipografia Helvetica display + Times body com kerning manual
//   - Footer elegante com paginacao em badge ouro + monogram
//
// API publica: exportToPDF({ tema, contentElement, markdown }) — inalterada.

interface PDFExportOptions {
  tema: string;
  contentElement?: HTMLElement;
  markdown?: string;
}

// ─── PALETA REFINADA ─────────────────────────────────────────────
const C = {
  // Verdes da marca
  greenInk:    [0, 50, 40]      as [number, number, number], // body verde escuro pra titulos
  greenDeep:   [0, 61, 50]      as [number, number, number],
  green:       [0, 83, 68]      as [number, number, number],
  greenMid:    [0, 109, 91]     as [number, number, number],
  greenSoft:   [232, 244, 240]  as [number, number, number], // bg sutil
  greenWash:   [243, 250, 248]  as [number, number, number], // bg muito sutil
  // Dourado
  gold:        [201, 168, 76]   as [number, number, number],
  goldDeep:    [138, 111, 38]   as [number, number, number],
  goldSoft:    [248, 240, 218]  as [number, number, number],
  // Neutros
  ink:         [25, 28, 29]     as [number, number, number], // text principal
  text:        [45, 50, 52]     as [number, number, number], // body
  textSoft:    [74, 85, 104]    as [number, number, number],
  muted:       [120, 128, 125]  as [number, number, number],
  hairline:    [220, 228, 225]  as [number, number, number],
  hairlineDeep:[200, 210, 205]  as [number, number, number],
  paper:       [250, 248, 244]  as [number, number, number], // marfim
  white:       [255, 255, 255]  as [number, number, number],
  // Callouts
  redSoft:     [253, 232, 232]  as [number, number, number],
  redDeep:     [180, 35, 35]    as [number, number, number],
  blueSoft:    [232, 240, 254]  as [number, number, number],
  blueDeep:    [30, 64, 175]    as [number, number, number],
  // Tabela
  tableBorder: [220, 228, 225]  as [number, number, number],
  tableHeader: [0, 73, 58]      as [number, number, number],
  tableStripe: [248, 251, 250]  as [number, number, number],
};

// ─── LAYOUT ──────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML = 24;
const MR = 24;
const MT = 32;
const MB = 26;
const CW = PAGE_W - ML - MR;

// ─── TIPOGRAFIA ──────────────────────────────────────────────────
const F = {
  bodySerif:    10.5,
  bodyDrop:     10.5,
  bodySmall:    9.5,
  caption:      8.5,
  bullet:       10.5,
  h1:           22,
  h1Number:     38,
  h2:           14,
  h2Number:     11,
  h3:           11.5,
  h4:           10.5,
  callout:      10.5,
  calloutLabel: 9,
  quote:        11,
  table:        9.5,
  footer:       7.5,
  toc:          11,
  tocPage:      10,
};

const LH = {
  body:    5.4,
  bullet:  5.2,
  h1:      9.5,
  h2:      6.8,
  h3:      5.6,
  h4:      5.2,
  callout: 5.2,
  quote:   5.6,
  table:   5.2,
  toc:     6.5,
};

// ─── DOC TYPING ──────────────────────────────────────────────────
type JsPDF = any; // eslint-disable-line @typescript-eslint/no-explicit-any

// ─── INLINE TOKEN PARSER (bold/italic) ──────────────────────────
type InlineToken = { text: string; bold: boolean; italic: boolean };

function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const regex = /(\*\*\*[^*]+\*\*\*)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|([^*]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) tokens.push({ text: match[1].slice(3, -3), bold: true, italic: true });
    else if (match[2]) tokens.push({ text: match[2].slice(2, -2), bold: true, italic: false });
    else if (match[3]) tokens.push({ text: match[3].slice(1, -1), bold: false, italic: true });
    else if (match[4]) tokens.push({ text: match[4], bold: false, italic: false });
  }
  return tokens;
}

// Renderiza texto rico (bold/italic) com word-wrap. Retorna numero de linhas usadas.
function renderRichText(
  doc: JsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fontFamily: 'times' | 'helvetica' = 'times',
): number {
  const tokens = parseInlineTokens(text);
  let curX = x;
  let curY = y;
  let linesUsed = 1;

  for (const token of tokens) {
    const cleanedText = cleanMdNoStyle(token.text);
    const style: 'normal' | 'bold' | 'italic' | 'bolditalic' =
      token.bold && token.italic
        ? 'bolditalic'
        : token.bold
          ? 'bold'
          : token.italic
            ? 'italic'
            : 'normal';
    doc.setFont(fontFamily, style);

    const words = cleanedText.split(/(\s+)/).filter((w: string) => w.length > 0);
    for (const word of words) {
      const wordWidth = doc.getTextWidth(word);
      if (curX + wordWidth > x + maxWidth && word.trim().length > 0) {
        curY += lineHeight;
        curX = x;
        linesUsed++;
      }
      doc.text(word, curX, curY);
      curX += wordWidth;
    }
  }
  doc.setFont(fontFamily, 'normal');
  return linesUsed;
}

// Renderiza texto rico justificado (controlando spacing entre palavras).
// Para a ultima linha — mantem alinhamento à esquerda (padrao academico).
function renderJustified(
  doc: JsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fontFamily: 'times' | 'helvetica' = 'times',
): number {
  type Word = { str: string; w: number; bold: boolean; italic: boolean; trailingSpaceW: number };
  const tokens = parseInlineTokens(text);
  // Achata em palavras com info de estilo
  const words: Word[] = [];
  for (const t of tokens) {
    const cleaned = cleanMdNoStyle(t.text);
    const style: 'normal' | 'bold' | 'italic' | 'bolditalic' =
      t.bold && t.italic ? 'bolditalic' : t.bold ? 'bold' : t.italic ? 'italic' : 'normal';
    doc.setFont(fontFamily, style);
    const parts = cleaned.split(/(\s+)/).filter((s: string) => s.length > 0);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (/^\s+$/.test(p)) continue;
      const trailing = parts[i + 1] && /^\s+$/.test(parts[i + 1]) ? parts[i + 1] : ' ';
      words.push({
        str: p,
        w: doc.getTextWidth(p),
        bold: t.bold,
        italic: t.italic,
        trailingSpaceW: doc.getTextWidth(trailing),
      });
    }
  }

  // Quebra em linhas
  const lines: Word[][] = [];
  let line: Word[] = [];
  let lineW = 0;
  for (const w of words) {
    const wWithSpace = lineW === 0 ? w.w : lineW + w.trailingSpaceW + w.w - w.trailingSpaceW; // placeholder
    const candidateW = lineW === 0 ? w.w : lineW + w.trailingSpaceW + w.w;
    if (candidateW <= maxWidth) {
      line.push(w);
      lineW = candidateW;
    } else {
      if (line.length) lines.push(line);
      line = [w];
      lineW = w.w;
    }
    void wWithSpace;
  }
  if (line.length) lines.push(line);

  // Renderiza cada linha
  let curY = y;
  for (let li = 0; li < lines.length; li++) {
    const isLast = li === lines.length - 1;
    const lineWords = lines[li];
    const naturalGap =
      lineWords.length > 1
        ? lineWords.slice(0, -1).reduce((s, w) => s + w.trailingSpaceW, 0)
        : 0;
    const wordsW = lineWords.reduce((s, w) => s + w.w, 0);
    const gaps = lineWords.length - 1;
    const extraSpace = isLast || gaps === 0 ? 0 : maxWidth - wordsW - naturalGap;
    const extraPerGap = gaps > 0 ? extraSpace / gaps : 0;

    let curX = x;
    for (let wi = 0; wi < lineWords.length; wi++) {
      const w = lineWords[wi];
      const style: 'normal' | 'bold' | 'italic' | 'bolditalic' =
        w.bold && w.italic ? 'bolditalic' : w.bold ? 'bold' : w.italic ? 'italic' : 'normal';
      doc.setFont(fontFamily, style);
      doc.text(w.str, curX, curY);
      curX += w.w + (wi < lineWords.length - 1 ? w.trailingSpaceW + extraPerGap : 0);
    }
    curY += lineHeight;
  }
  doc.setFont(fontFamily, 'normal');
  return lines.length;
}

// ─── ESTRUTURAS DE PARSE ────────────────────────────────────────
type BlockType =
  | 'h1' | 'h2' | 'h3' | 'h4'
  | 'paragraph' | 'bullet' | 'subbullet' | 'numbered'
  | 'blockquote' | 'callout' | 'hr' | 'table' | 'spacer';

interface Block {
  type: BlockType;
  text?: string;
  level?: number;
  number?: string;
  rows?: string[][];
  callout?: 'pearl' | 'attention' | 'tip';
}

// Detecta se um trimmed e bullet com prefixo definicional **Termo:** ...
function isDefinitionalBullet(text: string): boolean {
  return /^\*\*[^*]+\*\*\s*:/.test(text) || /^\*\*[^*]+:\*\*/.test(text);
}

function parseToBlocks(rawText: string): Block[] {
  const blocks: Block[] = [];
  const lines = rawText.split('\n');
  let tableRows: string[][] = [];
  let inTable = false;

  // Counters pra numeracao automatica
  let h2Count = 0;
  let h3CountWithinH2 = 0;

  const flushTable = () => {
    if (tableRows.length) {
      blocks.push({ type: 'table', rows: tableRows });
      tableRows = [];
    }
    inTable = false;
  };

  for (let li = 0; li < lines.length; li++) {
    const trimmed = lines[li].trim();

    // Tabela
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').filter((c) => c.trim() !== '').map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        inTable = true;
        continue;
      }
      tableRows.push(cells);
      inTable = true;
      continue;
    }
    if (inTable && !trimmed.startsWith('|')) flushTable();

    if (!trimmed) {
      blocks.push({ type: 'spacer' });
      continue;
    }

    // H1
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      blocks.push({ type: 'h1', text: trimmed.replace(/^# /, '') });
      continue;
    }
    // H2 (numerado)
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      h2Count++;
      h3CountWithinH2 = 0;
      const raw = trimmed.replace(/^## /, '');
      // Se ja tem numero do tipo "1. ", "2. " etc, usa esse.
      const numeroMatch = raw.match(/^(\d+)[\.\)]\s*(.+)$/);
      if (numeroMatch) {
        blocks.push({ type: 'h2', number: numeroMatch[1].padStart(2, '0'), text: numeroMatch[2] });
      } else {
        blocks.push({ type: 'h2', number: String(h2Count).padStart(2, '0'), text: raw });
      }
      continue;
    }
    // H3
    if (trimmed.startsWith('### ') && !trimmed.startsWith('#### ')) {
      h3CountWithinH2++;
      const raw = trimmed.replace(/^### /, '');
      const numeroMatch = raw.match(/^(\d+\.\d+)\s+(.+)$/);
      if (numeroMatch) {
        blocks.push({ type: 'h3', number: numeroMatch[1], text: numeroMatch[2] });
      } else {
        blocks.push({
          type: 'h3',
          number: `${h2Count}.${h3CountWithinH2}`,
          text: raw,
        });
      }
      continue;
    }
    // H4
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: trimmed.replace(/^#### /, '') });
      continue;
    }
    // HR
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'hr' });
      continue;
    }
    // Blockquote / Callouts
    if (trimmed.startsWith('> ')) {
      const qt = trimmed.replace(/^> /, '');
      // Detecta tipo de callout pelas primeiras palavras
      let callout: 'pearl' | 'attention' | 'tip' | undefined;
      let body = qt;
      const lower = qt.toLowerCase();
      if (/^(\*\*)?p[eé]rola(s)?( cl[ií]nica)?( importante)?:?(\*\*)?/i.test(qt)) {
        callout = 'pearl';
        body = qt.replace(/^(\*\*)?p[eé]rola(s)?( cl[ií]nica)?( importante)?:?(\*\*)?\s*/i, '');
      } else if (lower.startsWith('atenção') || lower.startsWith('atencao') || lower.startsWith('cuidado') || lower.startsWith('alerta')) {
        callout = 'attention';
        body = qt.replace(/^(aten[cç][aã]o|cuidado|alerta):?\s*/i, '');
      } else if (lower.startsWith('dica') || lower.startsWith('observação') || lower.startsWith('observacao')) {
        callout = 'tip';
        body = qt.replace(/^(dica|observa[cç][aã]o):?\s*/i, '');
      }
      if (callout) {
        blocks.push({ type: 'callout', callout, text: body });
      } else {
        blocks.push({ type: 'blockquote', text: qt });
      }
      continue;
    }
    // Bullet
    if (/^[-*•]\s/.test(trimmed)) {
      const bt = trimmed.replace(/^[-*•]\s/, '');
      const subbullet = /^\s{2,}[-*•]\s/.test(lines[li]);
      blocks.push({ type: subbullet ? 'subbullet' : 'bullet', text: bt });
      continue;
    }
    if (/^\s{2,}[-*•]\s/.test(lines[li])) {
      const sbt = lines[li].trim().replace(/^[-*•]\s/, '');
      blocks.push({ type: 'subbullet', text: sbt });
      continue;
    }
    // Numbered
    if (/^\d+\.\s/.test(trimmed)) {
      const nm = trimmed.match(/^(\d+)\.\s(.*)/);
      if (nm) blocks.push({ type: 'numbered', number: nm[1], text: nm[2] });
      continue;
    }
    // Paragraph
    blocks.push({ type: 'paragraph', text: trimmed });
  }
  if (inTable) flushTable();
  return blocks;
}

// ─── HELPERS DE DESENHO ──────────────────────────────────────────
function drawHairline(doc: JsPDF, x: number, y: number, w: number, color = C.hairline) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.2);
  doc.line(x, y, x + w, y);
}

function drawDottedLine(doc: JsPDF, x1: number, y: number, x2: number, color = C.hairlineDeep) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.25);
  const step = 1.4;
  for (let x = x1; x < x2; x += step * 2) {
    doc.line(x, y, Math.min(x + step, x2), y);
  }
}

function drawSquareBullet(doc: JsPDF, x: number, y: number, color = C.gold) {
  doc.setFillColor(...color);
  doc.rect(x, y - 1.6, 1.4, 1.4, 'F');
}

function drawDot(doc: JsPDF, x: number, y: number, color = C.greenMid, r = 0.7) {
  doc.setFillColor(...color);
  doc.circle(x, y, r, 'F');
}

// Cabeçalho de página decorativo (não-cover)
function drawRunningHeader(doc: JsPDF, tema: string, sectionLabel: string) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.greenInk);
  const monogram = 'PM';
  doc.text(monogram, ML, MT - 14);
  // Hairline com gold dot
  drawHairline(doc, ML + 8, MT - 15, CW - 8 - 60, C.hairline);
  // Brand
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  doc.text('PRECEPTORMED', ML + 8 + (CW - 8 - 60) + 3, MT - 14.5);
  // Tema curto na direita
  const themeShort = tema.length > 32 ? tema.slice(0, 32) + '…' : tema;
  doc.setTextColor(...C.muted);
  doc.text(themeShort, PAGE_W - MR, MT - 14.5, { align: 'right' });
  void sectionLabel;
}

// Footer com badge ouro de pagina
function drawPageFooter(doc: JsPDF, pageNumber: number, totalPages: number, tema: string) {
  // Linha
  drawHairline(doc, ML, PAGE_H - 14, CW, C.hairline);
  // Tema esquerda
  doc.setFontSize(F.footer);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  const themeShort = tema.length > 50 ? tema.slice(0, 50) + '…' : tema;
  doc.text(themeShort.toUpperCase(), ML, PAGE_H - 9);
  // Page badge (right)
  const badgeW = 18;
  const badgeH = 5.5;
  const badgeX = PAGE_W - MR - badgeW;
  const badgeY = PAGE_H - 13;
  doc.setFillColor(...C.greenInk);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 0.8, 0.8, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gold);
  doc.text(
    `${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`,
    badgeX + badgeW / 2,
    badgeY + 3.7,
    { align: 'center' },
  );
}

// ─── MAIN EXPORT ────────────────────────────────────────────────
export const exportToPDF = async ({ tema, contentElement, markdown }: PDFExportOptions): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const doc: JsPDF = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  let rawText = markdown || '';
  if (!rawText && contentElement) rawText = extractMarkdownFromHTML(contentElement);
  if (!rawText.trim()) throw new Error('Sem conteúdo para exportar');

  const blocks = parseToBlocks(rawText);
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const wordCount = rawText.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean).length;
  const readingMin = Math.max(1, Math.round(wordCount / 220));

  // ══════════════════════════════════════════════════════════════
  // PASS 1 — COVER (página 1)
  // ══════════════════════════════════════════════════════════════
  drawCover(doc, tema, dateStr, readingMin, wordCount);

  // ══════════════════════════════════════════════════════════════
  // PASS 2 — TOC PLACEHOLDER (página 2 — vamos rerender depois)
  // ══════════════════════════════════════════════════════════════
  doc.addPage();
  // Conteudo: deixaremos vazio por agora; vamos voltar e renderizar
  const tocPageNumber = doc.getNumberOfPages();

  // ══════════════════════════════════════════════════════════════
  // PASS 3 — CONTENT (paginas 3+) com tracking pra TOC
  // ══════════════════════════════════════════════════════════════
  doc.addPage();
  let y = MT;
  const tocEntries: Array<{ level: 1 | 2 | 3; number?: string; title: string; page: number }> = [];

  // Track if we already used the drop cap (only on first paragraph)
  let dropCapUsed = false;
  let firstContentBlockSeen = false;

  const checkPage = (needed: number) => {
    if (y + needed > PAGE_H - MB) {
      doc.addPage();
      y = MT;
    }
  };

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];

    switch (block.type) {
      case 'spacer':
        y += 2.4;
        break;

      case 'h1': {
        checkPage(36);
        // Brand cap
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.gold);
        doc.text('PARTE', ML, y);
        // Big number
        doc.setFontSize(F.h1Number);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.greenWash);
        doc.text('I', ML + 22, y + 4);
        // Title
        y += 14;
        doc.setFontSize(F.h1);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.ink);
        const h = doc.splitTextToSize(cleanMdNoStyle(block.text!), CW);
        doc.text(h, ML, y);
        y += h.length * LH.h1;
        // Hairline
        drawHairline(doc, ML, y + 2, 30, C.gold);
        y += 12;
        tocEntries.push({ level: 1, title: cleanMdNoStyle(block.text!), page: doc.getNumberOfPages() });
        firstContentBlockSeen = true;
        break;
      }

      case 'h2': {
        checkPage(28);
        if (firstContentBlockSeen) y += 6;
        // Number badge
        const badgeSize = 9;
        const badgeY = y - 2;
        // Slim left ribbon
        doc.setFillColor(...C.gold);
        doc.rect(ML, badgeY, 2, 14, 'F');
        // Section number
        doc.setFontSize(F.h2Number);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.gold);
        doc.text(block.number ?? '', ML + 5, badgeY + 4.5);
        // Hairline below number
        drawHairline(doc, ML + 5, badgeY + 5.8, 8, C.gold);
        // Title
        doc.setFontSize(F.h2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.greenInk);
        const h2text = cleanMdNoStyle(block.text!);
        const h2lines = doc.splitTextToSize(h2text, CW - 16);
        doc.text(h2lines, ML + 16, badgeY + 4.5);
        y = badgeY + Math.max(14, h2lines.length * LH.h2 + 4) + 3;
        // Closing rule
        drawHairline(doc, ML, y, CW, C.hairline);
        y += 6;
        tocEntries.push({
          level: 2,
          number: block.number,
          title: h2text,
          page: doc.getNumberOfPages(),
        });
        dropCapUsed = false;
        firstContentBlockSeen = true;
        void badgeSize;
        break;
      }

      case 'h3': {
        checkPage(16);
        y += 4;
        const text = cleanMdNoStyle(block.text!);
        // Number in gold serif
        doc.setFontSize(F.h3 - 0.5);
        doc.setFont('times', 'italic');
        doc.setTextColor(...C.gold);
        const numWidth = doc.getTextWidth(block.number ?? '');
        doc.text(block.number ?? '', ML, y);
        // Title
        doc.setFontSize(F.h3);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.greenDeep);
        const h3lines = doc.splitTextToSize(text, CW - numWidth - 4);
        doc.text(h3lines, ML + numWidth + 3, y);
        y += h3lines.length * LH.h3 + 3;
        tocEntries.push({
          level: 3,
          number: block.number,
          title: text,
          page: doc.getNumberOfPages(),
        });
        firstContentBlockSeen = true;
        break;
      }

      case 'h4': {
        checkPage(12);
        y += 2;
        doc.setFontSize(F.h4);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.ink);
        const text = cleanMdNoStyle(block.text!);
        const h4lines = doc.splitTextToSize(text, CW);
        doc.text(h4lines, ML, y);
        y += h4lines.length * LH.h4 + 2.5;
        firstContentBlockSeen = true;
        break;
      }

      case 'paragraph': {
        const txt = block.text!;
        // Drop cap apenas no primeiro paragrafo do documento (apos um H1/H2)
        const tokens = parseInlineTokens(txt);
        const cleanFirst = cleanMdNoStyle(tokens[0]?.text ?? '').trimStart();
        const useDropCap = !dropCapUsed && cleanFirst.length > 30 && cleanFirst[0]?.match(/[A-ZÁÀÂÃÉÊÍÓÔÕÚa-záàâãéêíóôõú]/);
        if (useDropCap) {
          dropCapUsed = true;
          checkPage(20);
          const first = cleanFirst[0];
          const rest = cleanFirst.slice(1);
          // Drop cap: 3 lines tall
          doc.setFontSize(28);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.gold);
          doc.text(first, ML, y + 7.5);
          // Wrapped body em volta — primeiras 3 linhas indentadas
          const dropCapW = doc.getTextWidth(first) + 1.2;
          const indentW = CW - dropCapW;
          doc.setFontSize(F.bodySerif);
          doc.setFont('times', 'normal');
          doc.setTextColor(...C.text);
          // Reconstroi texto restante: rest + restante dos tokens
          const reconstructedFirstToken = { ...tokens[0], text: rest };
          const reconstructed = [reconstructedFirstToken, ...tokens.slice(1)];
          const fullCleanRest = reconstructed
            .map((t) => (t.bold ? `**${cleanMdNoStyle(t.text)}**` : t.italic ? `*${cleanMdNoStyle(t.text)}*` : cleanMdNoStyle(t.text)))
            .join('');
          // Renderiza primeiras ~3 linhas indentadas, resto largura cheia
          const linesUsed = renderRichText(doc, fullCleanRest, ML + dropCapW, y, indentW, LH.body, 'times');
          if (linesUsed > 3) {
            // Continua o resto em linha cheia abaixo
            // (Aproximação — em pratica o renderRichText ja renderiza tudo mas
            // pode passar por baixo do drop cap. Pra manter simples, deixamos
            // todas as linhas indentadas; um pouco de desperdicio espacial mas
            // visualmente estavel.)
          }
          y += Math.max(linesUsed * LH.body, 16) + 3;
        } else {
          checkPage(LH.body * 2 + 4);
          doc.setFontSize(F.bodySerif);
          doc.setTextColor(...C.text);
          const linesUsed = renderJustified(doc, txt, ML, y, CW, LH.body, 'times');
          y += linesUsed * LH.body + 3;
        }
        firstContentBlockSeen = true;
        break;
      }

      case 'bullet': {
        const text = block.text!;
        const isDef = isDefinitionalBullet(text);
        doc.setFontSize(F.bullet);
        doc.setTextColor(...C.text);
        const estLines = Math.ceil(cleanMdNoStyle(text).length / 75);
        checkPage(estLines * LH.bullet + 3);
        if (isDef) {
          // Sem marker — bold do termo carrega visualmente
          const linesUsed = renderRichText(doc, text, ML + 3, y, CW - 6, LH.bullet, 'times');
          y += linesUsed * LH.bullet + 2.5;
        } else {
          drawSquareBullet(doc, ML + 1, y, C.gold);
          const linesUsed = renderRichText(doc, text, ML + 6, y, CW - 10, LH.bullet, 'times');
          y += linesUsed * LH.bullet + 2;
        }
        firstContentBlockSeen = true;
        break;
      }

      case 'subbullet': {
        const text = block.text!;
        doc.setFontSize(F.bodySmall);
        doc.setTextColor(...C.textSoft);
        const estLines = Math.ceil(cleanMdNoStyle(text).length / 80);
        checkPage(estLines * 4.5 + 2);
        drawDot(doc, ML + 9, y - 1.4, C.greenMid, 0.55);
        const linesUsed = renderRichText(doc, text, ML + 12, y, CW - 16, 4.5, 'times');
        y += linesUsed * 4.5 + 1.5;
        firstContentBlockSeen = true;
        break;
      }

      case 'numbered': {
        doc.setFontSize(F.bullet);
        const estLines = Math.ceil(cleanMdNoStyle(block.text!).length / 75);
        checkPage(estLines * LH.bullet + 4);
        // Outline circle (instead of solid)
        doc.setFillColor(...C.white);
        doc.setDrawColor(...C.gold);
        doc.setLineWidth(0.5);
        doc.circle(ML + 3, y - 1.5, 2.6, 'FD');
        doc.setTextColor(...C.goldDeep);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(block.number!, ML + 3, y, { align: 'center' });
        doc.setFontSize(F.bullet);
        doc.setTextColor(...C.text);
        const linesUsed = renderRichText(doc, block.text!, ML + 9, y, CW - 14, LH.bullet, 'times');
        y += linesUsed * LH.bullet + 2.5;
        firstContentBlockSeen = true;
        break;
      }

      case 'blockquote': {
        const text = cleanMd(block.text!);
        doc.setFontSize(F.quote);
        doc.setFont('times', 'italic');
        const wrapped = doc.splitTextToSize(text, CW - 16);
        const qH = wrapped.length * LH.quote + 6;
        checkPage(qH + 6);
        // Big quote mark
        doc.setFontSize(38);
        doc.setFont('times', 'bold');
        doc.setTextColor(...C.goldSoft);
        doc.text('"', ML + 1, y + 7);
        // Italic body
        doc.setFontSize(F.quote);
        doc.setFont('times', 'italic');
        doc.setTextColor(...C.textSoft);
        doc.text(wrapped, ML + 12, y + 4);
        y += qH + 4;
        firstContentBlockSeen = true;
        break;
      }

      case 'callout': {
        const text = cleanMd(block.text!);
        const labelMap: Record<string, string> = {
          pearl: 'PÉROLA CLÍNICA',
          attention: 'ATENÇÃO',
          tip: 'DICA',
        };
        const palette: Record<string, [number[], number[], number[]]> = {
          pearl: [C.goldSoft, C.gold, C.goldDeep],
          attention: [C.redSoft, C.redDeep, C.redDeep],
          tip: [C.blueSoft, C.blueDeep, C.blueDeep],
        };
        const [bg, accent, label] = palette[block.callout!];
        doc.setFontSize(F.callout);
        doc.setFont('times', 'normal');
        const wrapped = doc.splitTextToSize(text, CW - 14);
        const calloutH = wrapped.length * LH.callout + 12;
        checkPage(calloutH + 4);
        // Bg
        doc.setFillColor(...(bg as [number, number, number]));
        doc.roundedRect(ML, y, CW, calloutH, 1.6, 1.6, 'F');
        // Left accent
        doc.setFillColor(...(accent as [number, number, number]));
        doc.rect(ML, y, 2.2, calloutH, 'F');
        // Label
        doc.setFontSize(F.calloutLabel);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(label as [number, number, number]));
        doc.text(labelMap[block.callout!], ML + 7, y + 5.5);
        // Body
        doc.setFontSize(F.callout);
        doc.setFont('times', 'normal');
        doc.setTextColor(...C.ink);
        doc.text(wrapped, ML + 7, y + 11);
        y += calloutH + 4;
        firstContentBlockSeen = true;
        break;
      }

      case 'hr': {
        checkPage(10);
        y += 4;
        // Ornament: linha tracejada com losango central
        const cx = ML + CW / 2;
        drawDottedLine(doc, ML + 30, y, cx - 5, C.hairlineDeep);
        drawDottedLine(doc, cx + 5, y, ML + CW - 30, C.hairlineDeep);
        // Diamond
        doc.setFillColor(...C.gold);
        doc.triangle(cx - 2, y, cx, y - 2, cx + 2, y, 'F');
        doc.triangle(cx - 2, y, cx, y + 2, cx + 2, y, 'F');
        y += 7;
        break;
      }

      case 'table': {
        renderTable(doc, block.rows!, () => {
          checkPage(40);
          return y;
        }, (newY: number) => {
          y = newY;
        });
        y += 6;
        firstContentBlockSeen = true;
        break;
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PASS 4 — Render TOC na página 2 com numeros reais
  // ══════════════════════════════════════════════════════════════
  doc.setPage(tocPageNumber);
  drawTOC(doc, tema, tocEntries);

  // ══════════════════════════════════════════════════════════════
  // PASS 5 — Footer + header em todas as paginas (exceto cover)
  // ══════════════════════════════════════════════════════════════
  const total = doc.getNumberOfPages();
  for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    drawRunningHeader(doc, tema, p === 2 ? 'Sumário' : 'Conteúdo');
    drawPageFooter(doc, p - 1, total - 1, tema);
  }

  // ══════════════════════════════════════════════════════════════
  // Save
  // ══════════════════════════════════════════════════════════════
  const filename = `preceptormed-${tema
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-àáâãéêíóôõúç]/g, '')
    .substring(0, 50)}.pdf`;
  doc.save(filename);
};

// ─── COVER ──────────────────────────────────────────────────────
function drawCover(
  doc: JsPDF,
  tema: string,
  dateStr: string,
  readingMin: number,
  wordCount: number,
): void {
  // Marfim background
  doc.setFillColor(...C.paper);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Fine top hairline
  drawHairline(doc, ML, 22, CW, C.greenInk);
  drawHairline(doc, ML, 23, CW, C.gold);

  // Brand monogram (top-left)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.greenInk);
  doc.text('PRECEPTORMED', ML, 32);
  // Tagline
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  doc.text('CIÊNCIA · PRECEPTORIA · EVIDÊNCIA', ML, 36.5);

  // Right meta (date)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.greenInk);
  doc.text(dateStr.toUpperCase(), PAGE_W - MR, 32, { align: 'right' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  doc.text('FECHAMENTO ACADÊMICO', PAGE_W - MR, 36.5, { align: 'right' });

  // ── Centro: composição editorial ──
  // Eyebrow / categoria
  const blockY = 95;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gold);
  doc.text('VOL. 01  ·  EDIÇÃO ÚNICA', ML, blockY);
  // Linha decorativa
  doc.setFillColor(...C.gold);
  doc.rect(ML + 80, blockY - 2.5, 35, 0.3, 'F');

  // Título principal — gigante
  const themeUpper = tema.trim();
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.greenInk);
  const titleLines = doc.splitTextToSize(themeUpper, CW);
  const lineHeight = 16;
  let curY = blockY + 18;
  for (const line of titleLines) {
    doc.text(line, ML, curY);
    curY += lineHeight;
  }

  // Subtitulo
  curY += 6;
  doc.setFontSize(11);
  doc.setFont('times', 'italic');
  doc.setTextColor(...C.textSoft);
  const subtitle =
    'Síntese acadêmica integrando ciências básicas e aplicação clínica, ' +
    'estruturada para discussão em grupo de aprendizagem ativa.';
  const subLines = doc.splitTextToSize(subtitle, CW - 30);
  for (const l of subLines) {
    doc.text(l, ML, curY);
    curY += 5.4;
  }

  // ── Bloco inferior: metadata ──
  const blockH = 60;
  const blockTop = PAGE_H - 70;
  doc.setFillColor(...C.greenInk);
  doc.rect(ML, blockTop, CW, blockH, 'F');
  // Gold strip top
  doc.setFillColor(...C.gold);
  doc.rect(ML, blockTop, CW, 0.8, 'F');
  // Inner content
  const padX = 11;
  const colW = (CW - padX * 2) / 3;

  // Coluna 1: data
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gold);
  doc.text('PUBLICADO', ML + padX, blockTop + 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text(dateStr, ML + padX, blockTop + 19);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(216, 230, 224);
  doc.text('Geração em tempo real', ML + padX, blockTop + 25);

  // Coluna 2: leitura estimada
  const col2X = ML + padX + colW;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gold);
  doc.text('LEITURA', col2X, blockTop + 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text(`${readingMin} min`, col2X, blockTop + 19);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(216, 230, 224);
  doc.text(`${wordCount.toLocaleString('pt-BR')} palavras`, col2X, blockTop + 25);

  // Coluna 3: source
  const col3X = ML + padX + colW * 2;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gold);
  doc.text('AUTORIA', col3X, blockTop + 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('Inteligência Artificial', col3X, blockTop + 19);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(216, 230, 224);
  doc.text('Curadoria · PreceptorMED', col3X, blockTop + 25);

  // Linha divisoria
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.15);
  doc.line(ML + padX, blockTop + 32, ML + CW - padX, blockTop + 32);

  // Disclaimer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...C.gold);
  doc.text(
    'Conteúdo gerado por IA com finalidade educacional. Não substitui orientação médica. CFM 2.338/2023.',
    ML + padX,
    blockTop + 39,
  );

  // Bottom hairlines
  drawHairline(doc, ML, PAGE_H - 8, CW, C.gold);
  drawHairline(doc, ML, PAGE_H - 7, CW, C.greenInk);
}

// ─── TOC ────────────────────────────────────────────────────────
function drawTOC(
  doc: JsPDF,
  tema: string,
  entries: Array<{ level: 1 | 2 | 3; number?: string; title: string; page: number }>,
) {
  // Header eyebrow
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gold);
  doc.text('NESTE FECHAMENTO', ML, MT + 4);
  // Hairline
  doc.setFillColor(...C.gold);
  doc.rect(ML, MT + 7, 25, 0.4, 'F');

  // Big "Sumário"
  doc.setFontSize(34);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.greenInk);
  doc.text('Sumário', ML, MT + 24);

  // Subhead com tema
  doc.setFontSize(10.5);
  doc.setFont('times', 'italic');
  doc.setTextColor(...C.textSoft);
  const subHead = doc.splitTextToSize(`Mapa de leitura — ${tema}`, CW);
  let y = MT + 31;
  for (const l of subHead) {
    doc.text(l, ML, y);
    y += 5.2;
  }

  // Decorative rule
  y += 4;
  drawHairline(doc, ML, y, CW, C.hairlineDeep);
  y += 8;

  // Filtra entries — TOC mostra so H1 e H2 (H3 deixa o doc carregado)
  const toc = entries.filter((e) => e.level <= 2);
  doc.setTextColor(...C.text);

  for (const entry of toc) {
    if (y > PAGE_H - MB - 20) break; // Nao quebrar TOC em duas paginas

    if (entry.level === 1) {
      // H1: spacing maior + tipografia bold
      y += 4;
      doc.setFontSize(F.toc + 1.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.greenInk);
      doc.text(entry.title.toUpperCase(), ML, y);
      // Page
      doc.setFontSize(F.tocPage);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.greenInk);
      doc.text(String(entry.page - 1).padStart(2, '0'), PAGE_W - MR, y, { align: 'right' });
      y += LH.toc + 2;
      drawHairline(doc, ML, y - 4, CW, C.hairline);
    } else {
      // H2: numbered
      const numStr = entry.number ? `${entry.number}.` : '';
      doc.setFontSize(F.toc - 0.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.gold);
      doc.text(numStr, ML, y);
      const numW = doc.getTextWidth(numStr);
      // Title
      doc.setFontSize(F.toc);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.ink);
      const maxTitleW = CW - numW - 18;
      const title = entry.title.length > 70 ? entry.title.slice(0, 70) + '…' : entry.title;
      doc.text(title, ML + numW + 3, y);
      const titleW = doc.getTextWidth(title);
      // Dotted leader
      const dotStart = ML + numW + 3 + titleW + 3;
      const dotEnd = PAGE_W - MR - 12;
      if (dotStart < dotEnd) drawDottedLine(doc, dotStart, y - 1.2, dotEnd, C.hairlineDeep);
      // Page number
      doc.setFontSize(F.tocPage);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.greenInk);
      doc.text(String(entry.page - 1).padStart(2, '0'), PAGE_W - MR, y, { align: 'right' });
      y += LH.toc;
    }
  }
}

// ─── TABLE ──────────────────────────────────────────────────────
function renderTable(
  doc: JsPDF,
  rows: string[][],
  getY: () => number,
  setY: (y: number) => void,
) {
  let y = getY();
  if (rows.length === 0) return;
  const cols = rows[0].length || 1;
  const colW = CW / cols;
  const cellPadX = 3;
  const cellPadY = 3;

  const measureRow = (row: string[], fontSize: number): number => {
    doc.setFontSize(fontSize);
    let maxLines = 1;
    row.forEach((cell) => {
      const wrapped = doc.splitTextToSize(cleanMd(cell), colW - cellPadX * 2);
      maxLines = Math.max(maxLines, wrapped.length);
    });
    return Math.max(maxLines * 4.4, 5) + cellPadY * 2;
  };

  // Header
  const headerH = measureRow(rows[0], F.table);
  doc.setFillColor(...C.tableHeader);
  doc.rect(ML, y, CW, headerH, 'F');
  // Gold accent left
  doc.setFillColor(...C.gold);
  doc.rect(ML, y, 1.5, headerH, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(F.table);
  doc.setFont('helvetica', 'bold');
  rows[0].forEach((cell, ci) => {
    const wrapped = doc.splitTextToSize(cleanMd(cell), colW - cellPadX * 2);
    doc.text(wrapped, ML + ci * colW + cellPadX + 1, y + cellPadY + 3);
  });
  y += headerH;

  // Data rows
  doc.setFont('times', 'normal');
  for (let ri = 1; ri < rows.length; ri++) {
    const row = rows[ri];
    const rowH = measureRow(row, F.table);
    if (y + rowH > PAGE_H - MB) {
      doc.addPage();
      y = MT;
      // Re-render header
      doc.setFillColor(...C.tableHeader);
      doc.rect(ML, y, CW, headerH, 'F');
      doc.setFillColor(...C.gold);
      doc.rect(ML, y, 1.5, headerH, 'F');
      doc.setTextColor(...C.white);
      doc.setFontSize(F.table);
      doc.setFont('helvetica', 'bold');
      rows[0].forEach((cell, ci) => {
        const wrapped = doc.splitTextToSize(cleanMd(cell), colW - cellPadX * 2);
        doc.text(wrapped, ML + ci * colW + cellPadX + 1, y + cellPadY + 3);
      });
      y += headerH;
      doc.setFont('times', 'normal');
    }
    if (ri % 2 === 0) {
      doc.setFillColor(...C.tableStripe);
      doc.rect(ML, y, CW, rowH, 'F');
    }
    // Bottom border
    doc.setDrawColor(...C.tableBorder);
    doc.setLineWidth(0.15);
    doc.line(ML, y + rowH, ML + CW, y + rowH);
    // Column separators
    for (let ci = 1; ci < cols; ci++) {
      doc.setDrawColor(...C.tableBorder);
      doc.line(ML + ci * colW, y, ML + ci * colW, y + rowH);
    }
    // Cell text
    doc.setTextColor(...C.text);
    doc.setFontSize(F.table);
    row.forEach((cell, ci) => {
      const wrapped = doc.splitTextToSize(cleanMd(cell), colW - cellPadX * 2);
      doc.text(wrapped, ML + ci * colW + cellPadX + 1, y + cellPadY + 3);
    });
    y += rowH;
  }
  setY(y);
}

// ─── CLEANUP DE TEXTO ───────────────────────────────────────────
function cleanMdNoStyle(t: string): string {
  return replaceSpecials(
    t
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/~~(.*?)~~/g, '$1'),
  );
}

function cleanMd(t: string): string {
  return replaceSpecials(
    t
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/~~(.*?)~~/g, '$1'),
  );
}

function replaceSpecials(s: string): string {
  return s
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
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/[^\x00-\x7F\xC0-\xFFĀ-ſ]/g, '');
}

// ─── HTML → Markdown extractor ──────────────────────────────────
function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const inner = Array.from(el.childNodes).map(serializeInline).join('');
  if (tag === 'strong' || tag === 'b') return `**${inner}**`;
  if (tag === 'em' || tag === 'i') return `*${inner}*`;
  if (tag === 'code') return `\`${inner}\``;
  if (tag === 'br') return '\n';
  return inner;
}

function extractMarkdownFromHTML(el: HTMLElement): string {
  const out: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.trim();
      if (t) out.push(t);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = (node as HTMLElement).tagName.toLowerCase();
    const richText = serializeInline(node).trim();
    if (tag === 'h1') {
      out.push(`# ${richText}`);
      return;
    }
    if (tag === 'h2') {
      out.push(`## ${richText}`);
      return;
    }
    if (tag === 'h3') {
      out.push(`### ${richText}`);
      return;
    }
    if (tag === 'h4') {
      out.push(`#### ${richText}`);
      return;
    }
    if (tag === 'li') {
      out.push(`- ${richText}`);
      return;
    }
    if (tag === 'blockquote') {
      out.push(`> ${richText}`);
      return;
    }
    if (tag === 'hr') {
      out.push('---');
      return;
    }
    if (tag === 'br') {
      out.push('');
      return;
    }
    if (tag === 'th' || tag === 'td') return;
    if (tag === 'tr') {
      const cells = Array.from((node as HTMLElement).querySelectorAll('th, td')).map((c) =>
        serializeInline(c).trim(),
      );
      out.push('| ' + cells.join(' | ') + ' |');
      if ((node as HTMLElement).querySelector('th'))
        out.push('| ' + cells.map(() => '---').join(' | ') + ' |');
      return;
    }
    if (tag === 'p') {
      if (richText) out.push(richText);
      out.push('');
      return;
    }
    node.childNodes.forEach(walk);
    if (['div', 'section', 'article', 'table'].includes(tag)) out.push('');
  };
  el.childNodes.forEach(walk);
  return out.join('\n');
}

// ─── Export de Consulta (Scribe) ─────────────────────────────────
// Gera PDF do prontuario com cabecalho do medico + SOAP completo +
// assinatura ou marca d'agua "RASCUNHO" se nao aprovada.

interface ConsultaPdfInput {
  consulta: {
    id: string;
    paciente_alias: string;
    data_consulta: string;
    transcript?: string | null;
    soap_jsonb?: {
      S?: {
        queixa_principal?: string;
        hda?: string;
        antecedentes_pessoais?: string;
        antecedentes_familiares?: string;
        medicacoes_em_uso?: string[];
        alergias?: string[];
        habitos?: string;
      };
      O?: {
        sinais_vitais?: Record<string, string | undefined>;
        exame_fisico_geral?: string;
        exame_fisico_segmentar?: Array<{ segmento?: string; achados?: string }>;
      };
      A?: {
        hipoteses_diagnosticas?: Array<{ cid?: string; descricao?: string; probabilidade?: string }>;
        comentario?: string;
      };
      P?: {
        conduta?: string;
        exames_solicitados?: string[];
        prescricao_rascunho?: Array<{ medicamento?: string; posologia?: string; duracao?: string; observacoes?: string }>;
        orientacoes?: string;
        retorno?: string;
      };
    };
    validated_at?: string | null;
    validation_signature?: string | null;
    audio_duration_s?: number | null;
  };
  medicoNome: string;
  medicoCrm: string;
}

export const exportConsultaPDF = async (input: ConsultaPdfInput): Promise<void> => {
  const { jsPDF } = await import('jspdf');
  const { consulta, medicoNome, medicoCrm } = input;
  const doc: JsPDF = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const isApproved = !!consulta.validated_at;
  const dataConsulta = new Date(consulta.data_consulta);
  const dataStr = dataConsulta.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const horaStr = dataConsulta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let y = MT;

  // Cabecalho verde
  doc.setFillColor(...C.greenInk);
  doc.rect(0, 0, PAGE_W, 28, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(0, 27.6, PAGE_W, 0.4, 'F');

  doc.setTextColor(...C.gold);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PRECEPTORMED · SCRIBE CLINICO', ML, 12);
  doc.setTextColor(...C.white);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('PRONTUARIO MEDICO', ML, 21);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.gold);
  doc.text(dataStr.toUpperCase(), PAGE_W - MR, 12, { align: 'right' });
  doc.setTextColor(...C.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(horaStr, PAGE_W - MR, 18, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  if (isApproved) {
    doc.setTextColor(180, 230, 200);
    doc.text('ASSINADO ELETRONICAMENTE', PAGE_W - MR, 23, { align: 'right' });
  } else {
    doc.setTextColor(255, 200, 100);
    doc.text('RASCUNHO - NAO ASSINADO', PAGE_W - MR, 23, { align: 'right' });
  }

  y = 36;

  // Identificacao
  doc.setFillColor(...C.paper);
  doc.rect(ML, y, CW, 22, 'F');
  drawHairline(doc, ML, y, CW, C.hairline);
  drawHairline(doc, ML, y + 22, CW, C.hairline);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.muted);
  doc.text('PACIENTE', ML + 4, y + 5.5);
  doc.text('MEDICO RESPONSAVEL', ML + CW / 2 + 2, y + 5.5);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.ink);
  const aliasLines = doc.splitTextToSize(replaceSpecials(consulta.paciente_alias), CW / 2 - 8);
  doc.text(aliasLines.slice(0, 1), ML + 4, y + 11);
  doc.text(replaceSpecials(medicoNome), ML + CW / 2 + 2, y + 11);
  if (medicoCrm) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.muted);
    doc.text(`CRM: ${medicoCrm}`, ML + CW / 2 + 2, y + 16);
  }
  if (consulta.audio_duration_s) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.muted);
    const durMin = Math.floor(consulta.audio_duration_s / 60);
    const durSec = consulta.audio_duration_s % 60;
    doc.text(
      `Duracao: ${durMin}min ${durSec}s | ID: ${consulta.id.slice(0, 8)}`,
      ML + 4,
      y + 18,
    );
  }

  y += 30;

  const checkPage = (needed: number) => {
    if (y + needed > PAGE_H - MB - 18) { doc.addPage(); y = MT; }
  };

  const sectionHeader = (title: string) => {
    checkPage(16);
    y += 2;
    doc.setFillColor(...C.greenInk);
    doc.rect(ML, y, 2.5, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.greenInk);
    doc.text(title, ML + 6, y + 5.8);
    y += 11;
    drawHairline(doc, ML, y - 1.5, CW, C.hairline);
  };

  const labeledText = (label: string, value: string | undefined | null) => {
    if (!value || !value.trim()) return;
    checkPage(LH.body * 3);
    doc.setFontSize(F.caption);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.muted);
    doc.text(label.toUpperCase(), ML, y);
    y += 4.5;
    doc.setFontSize(F.bodySerif);
    doc.setFont('times', 'normal');
    doc.setTextColor(...C.text);
    const lines = doc.splitTextToSize(replaceSpecials(value), CW);
    for (const line of lines) {
      checkPage(LH.body);
      doc.text(line, ML, y);
      y += LH.body;
    }
    y += 2.5;
  };

  const bulletList = (label: string, items: string[] | undefined) => {
    if (!items || items.length === 0) return;
    checkPage(8 + items.length * LH.bullet);
    doc.setFontSize(F.caption);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.muted);
    doc.text(label.toUpperCase(), ML, y);
    y += 4.5;
    doc.setFontSize(F.bullet);
    doc.setFont('times', 'normal');
    doc.setTextColor(...C.text);
    for (const it of items) {
      if (!it || !it.trim()) continue;
      checkPage(LH.bullet);
      drawSquareBullet(doc, ML + 1, y, C.gold);
      const lines = doc.splitTextToSize(replaceSpecials(it), CW - 8);
      doc.text(lines, ML + 6, y);
      y += lines.length * LH.bullet;
    }
    y += 2.5;
  };

  const soap = consulta.soap_jsonb ?? {};

  // S
  sectionHeader('S - SUBJETIVO');
  labeledText('Queixa principal', soap.S?.queixa_principal);
  labeledText('Historia da doenca atual', soap.S?.hda);
  labeledText('Antecedentes pessoais', soap.S?.antecedentes_pessoais);
  labeledText('Antecedentes familiares', soap.S?.antecedentes_familiares);
  bulletList('Medicacoes em uso', soap.S?.medicacoes_em_uso);
  bulletList('Alergias', soap.S?.alergias);
  labeledText('Habitos', soap.S?.habitos);

  // O
  sectionHeader('O - OBJETIVO');
  const sv = soap.O?.sinais_vitais ?? {};
  const svPairs = [
    ['PA', sv.pa], ['FC', sv.fc], ['FR', sv.fr],
    ['T', sv.temperatura], ['SatO2', sv.sato2], ['Peso', sv.peso], ['Altura', sv.altura],
  ].filter(([, v]) => v && String(v).trim().length > 0) as [string, string][];
  if (svPairs.length > 0) {
    checkPage(14);
    doc.setFontSize(F.caption);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.muted);
    doc.text('SINAIS VITAIS', ML, y);
    y += 4.5;
    doc.setFontSize(F.bodySerif);
    doc.setFont('times', 'normal');
    doc.setTextColor(...C.text);
    const svText = svPairs.map(([k, v]) => `${k}: ${v}`).join('  |  ');
    const lines = doc.splitTextToSize(replaceSpecials(svText), CW);
    for (const line of lines) { doc.text(line, ML, y); y += LH.body; }
    y += 2.5;
  }
  labeledText('Exame fisico geral', soap.O?.exame_fisico_geral);
  const segs = (soap.O?.exame_fisico_segmentar ?? []).filter(s => s.segmento || s.achados);
  if (segs.length > 0) {
    checkPage(8);
    doc.setFontSize(F.caption);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.muted);
    doc.text('EXAME FISICO SEGMENTAR', ML, y);
    y += 4.5;
    for (const s of segs) {
      checkPage(LH.body * 2);
      doc.setFontSize(F.bodySerif);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.greenInk);
      doc.text(replaceSpecials(s.segmento ?? ''), ML, y);
      y += LH.body;
      doc.setFont('times', 'normal');
      doc.setTextColor(...C.text);
      const lines = doc.splitTextToSize(replaceSpecials(s.achados ?? ''), CW - 4);
      for (const l of lines) { checkPage(LH.body); doc.text(l, ML + 4, y); y += LH.body; }
      y += 1.5;
    }
    y += 1;
  }

  // A
  sectionHeader('A - AVALIACAO');
  const ddxs = (soap.A?.hipoteses_diagnosticas ?? []).filter(d => d.descricao || d.cid);
  if (ddxs.length > 0) {
    doc.setFontSize(F.caption);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.muted);
    doc.text('HIPOTESES DIAGNOSTICAS', ML, y);
    y += 4.5;
    for (const d of ddxs) {
      checkPage(LH.body + 2);
      doc.setFontSize(F.bullet);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.greenInk);
      const cid = d.cid ? `[${d.cid}] ` : '';
      const txt = `${cid}${replaceSpecials(d.descricao ?? '')}`;
      const prob = d.probabilidade ? ` (${d.probabilidade})` : '';
      const lines = doc.splitTextToSize(`${txt}${prob}`, CW);
      doc.text(lines, ML, y);
      y += lines.length * LH.bullet;
    }
    y += 2.5;
  }
  labeledText('Comentario clinico', soap.A?.comentario);

  // P
  sectionHeader('P - PLANO');
  labeledText('Conduta', soap.P?.conduta);
  bulletList('Exames solicitados', soap.P?.exames_solicitados);
  const rxs = (soap.P?.prescricao_rascunho ?? []).filter(r => r.medicamento);
  if (rxs.length > 0) {
    checkPage(12);
    doc.setFontSize(F.caption);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.muted);
    doc.text(isApproved ? 'PRESCRICAO' : 'PRESCRICAO (RASCUNHO)', ML, y);
    y += 4.5;
    for (const r of rxs) {
      checkPage(LH.body * 3 + 4);
      const boxStart = y - 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(F.bullet);
      doc.setTextColor(...C.ink);
      const med = `${replaceSpecials(r.medicamento ?? '')}${r.duracao ? ` | ${replaceSpecials(r.duracao)}` : ''}`;
      doc.text(med, ML + 4, y + 2);
      y += LH.body;
      if (r.posologia) {
        doc.setFont('times', 'normal');
        doc.setTextColor(...C.text);
        doc.setFontSize(F.bodySerif);
        const lines = doc.splitTextToSize(replaceSpecials(r.posologia), CW - 6);
        for (const l of lines) { doc.text(l, ML + 4, y + 1); y += LH.body; }
      }
      if (r.observacoes) {
        doc.setFont('times', 'italic');
        doc.setTextColor(...C.textSoft);
        doc.setFontSize(F.bodySmall);
        const lines = doc.splitTextToSize(`Obs: ${replaceSpecials(r.observacoes)}`, CW - 6);
        for (const l of lines) { doc.text(l, ML + 4, y + 1); y += LH.body; }
      }
      doc.setDrawColor(...C.greenInk);
      doc.setLineWidth(0.6);
      doc.line(ML, boxStart, ML, y - 1);
      y += 2;
    }
    y += 1;
  }
  labeledText('Orientacoes ao paciente', soap.P?.orientacoes);
  labeledText('Retorno', soap.P?.retorno);

  // Assinatura/footer
  const sigBlockH = 28;
  if (y + sigBlockH > PAGE_H - MB) { doc.addPage(); y = MT; }
  y = Math.max(y + 6, PAGE_H - MB - sigBlockH);
  drawHairline(doc, ML, y, CW, C.greenInk);
  y += 6;
  doc.setFontSize(F.caption);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.muted);
  doc.text('ASSINATURA ELETRONICA', ML, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.ink);
  doc.text(replaceSpecials(medicoNome), ML, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  if (medicoCrm) doc.text(`CRM: ${medicoCrm}`, ML, y);
  if (isApproved && consulta.validation_signature) {
    const validatedAt = new Date(consulta.validated_at!).toLocaleString('pt-BR');
    const sigShort = `${consulta.validation_signature.slice(0, 8)}...${consulta.validation_signature.slice(-8)}`;
    doc.setFontSize(8);
    doc.setTextColor(...C.greenDeep);
    doc.text(`Assinado em ${validatedAt}`, PAGE_W - MR, y - 5, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(`Hash: ${sigShort}`, PAGE_W - MR, y, { align: 'right' });
  }

  // Marca d'agua RASCUNHO em todas paginas se nao aprovada
  if (!isApproved) {
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const G = (doc as { GState?: (o: { opacity: number }) => unknown }).GState;
      if (G) (doc as { setGState?: (g: unknown) => void }).setGState?.(G({ opacity: 0.07 }));
      doc.setTextColor(220, 60, 60);
      doc.setFontSize(96);
      doc.setFont('helvetica', 'bold');
      doc.text('RASCUNHO', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: -30 });
      if (G) (doc as { setGState?: (g: unknown) => void }).setGState?.(G({ opacity: 1 }));
    }
  }

  // Footer com paginacao
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.muted);
    doc.text(
      'Conteudo gerado com auxilio de IA. Medico responsavel pelo conteudo final. CFM 1.821/2007 e 2.299/2021.',
      ML,
      PAGE_H - 8,
    );
    doc.setFontSize(7);
    doc.text(`${p} / ${total}`, PAGE_W - MR, PAGE_H - 8, { align: 'right' });
  }

  const dateForFile = dataConsulta.toISOString().slice(0, 10);
  const aliasForFile = consulta.paciente_alias
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 40);
  const filename = `prontuario-${dateForFile}-${aliasForFile || 'consulta'}${isApproved ? '-assinado' : '-rascunho'}.pdf`;
  doc.save(filename);
};
