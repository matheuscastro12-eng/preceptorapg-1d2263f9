// PDF Export utility with cover page and optimized page breaks

interface PDFExportOptions {
  tema: string;
  contentElement: HTMLElement;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Strip AI preamble text that appears before the actual content.
 * Removes conversational intros like "Com certeza...", "Claro...", etc.
 */
const stripAIPreamble = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  const children = Array.from(temp.childNodes);
  let foundContentStart = false;

  for (const child of children) {
    if (foundContentStart) break;

    const el = child as HTMLElement;
    const tagName = el.tagName?.toLowerCase();

    // Keep headings, lists, tables, hrs, details — they are real content
    if (tagName && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'table', 'hr', 'details', 'blockquote'].includes(tagName)) {
      foundContentStart = true;
      break;
    }

    // Check if it's a paragraph that looks like AI preamble
    if (tagName === 'p' || child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent || '').trim();
      if (!text) {
        child.remove();
        continue;
      }

      // If the paragraph starts with a question marker or bold "Questão", keep it
      if (/^\*?\*?Quest[ãa]o/i.test(text) || /^\*?\*?\d+[\.\)]/i.test(text)) {
        foundContentStart = true;
        break;
      }

      // Remove conversational preamble paragraphs (AI prompt responses)
      const preamblePatterns = [
        /^(com certeza|claro|certo|ok|perfeito|vamos|aqui est[áa]|segue|pronto|elabor)/i,
        /^(como (preceptor|coordenador|professor|solicitado))/i,
        /^(este (caso|material|conte[úu]do|fechamento|semin[áa]rio) foi)/i,
        /^(a seguir|abaixo|conforme solicitado|conforme pedido)/i,
        /^(apresento|segue abaixo|seguem|vou (apresentar|elaborar|gerar))/i,
        /^(entendido|com base|baseado|de acordo)/i,
        /^(ol[áa]|boa noite|bom dia|boa tarde)/i,
        /^(preparei|elaborei|criei|gerei|montei|organizei|estruturei)/i,
        /^(segue o|segue a|aqui vai|veja o|veja a)/i,
        /^(com prazer|sem problemas|sem d[úu]vida)/i,
        /^(esse [ée]|este [ée]|essa [ée]|esta [ée]) (um|uma|o|a) (fechamento|semin[áa]rio|material|conte[úu]do|resumo)/i,
        /^(espero que|qualquer d[úu]vida|fico [àa] disposi[çc][ãa]o)/i,
      ];

      if (preamblePatterns.some(p => p.test(text))) {
        child.remove();
        continue;
      }

      // If it's a short introductory paragraph before any heading, remove it
      if (text.length < 400 && !foundContentStart) {
        child.remove();
        continue;
      }

      foundContentStart = true;
    }
  }

  // Second pass: remove trailing AI closing remarks
  const remainingChildren = Array.from(temp.childNodes);
  for (let i = remainingChildren.length - 1; i >= 0; i--) {
    const child = remainingChildren[i] as HTMLElement;
    const text = (child.textContent || '').trim();
    if (!text) {
      child.remove();
      continue;
    }
    const closingPatterns = [
      /^(espero que|qualquer d[úu]vida|fico [àa] disposi[çc][ãa]o|bons estudos|at[ée] a pr[óo]xima)/i,
      /^(caso (tenha|precise|queira)|se (precisar|quiser|tiver))/i,
      /^(estou [àa] disposi[çc][ãa]o|conte comigo)/i,
    ];
    if (closingPatterns.some(p => p.test(text)) && text.length < 300) {
      child.remove();
      continue;
    }
    break; // Stop at first non-closing paragraph from the end
  }

  return temp.innerHTML;
};

const createCoverPage = (tema: string): string => {
  return `
    <div style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      padding: 40px;
      box-sizing: border-box;
      page-break-after: always;
    ">
      <div style="
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #0d5c4d 0%, #10b981 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 40px;
        box-shadow: 0 10px 40px rgba(13, 92, 77, 0.3);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
          <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
          <circle cx="20" cy="10" r="2"/>
        </svg>
      </div>
      
      <div style="
        font-size: 14pt;
        color: #0d5c4d;
        font-weight: 600;
        letter-spacing: 4px;
        text-transform: uppercase;
        margin-bottom: 20px;
      ">
        PreceptorAPG
      </div>
      
      <div style="
        width: 60px;
        height: 3px;
        background: linear-gradient(90deg, #0d5c4d, #10b981);
        margin-bottom: 40px;
        border-radius: 2px;
      "></div>
      
      <h1 style="
        font-size: 28pt;
        color: #1a1a1a;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 3px;
        line-height: 1.3;
        margin: 0 0 20px 0;
        max-width: 80%;
      ">
        ${tema}
      </h1>
      
      <div style="
        font-size: 12pt;
        color: #666;
        margin-top: 20px;
      ">
        Fechamento de Objetivos
      </div>
      
      <div style="
        position: absolute;
        bottom: 60px;
        left: 0;
        right: 0;
        text-align: center;
      ">
        <div style="
          font-size: 11pt;
          color: #888;
        ">
          ${formatDate(new Date())}
        </div>
      </div>
    </div>
  `;
};

const styleContentElements = (container: HTMLElement): void => {
  // Reset all elements
  const allElements = container.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.color = '#1a1a1a';
    htmlEl.style.background = 'transparent';
    htmlEl.style.maxHeight = 'none';
    htmlEl.style.overflow = 'visible';
  });

  // H1 - Main section title (inline, no full-page cover)
  const h1s = container.querySelectorAll('h1');
  h1s.forEach((h1, index) => {
    (h1 as HTMLElement).style.cssText = `
      color: #0d5c4d !important;
      font-size: 20pt !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      letter-spacing: 2px !important;
      border-bottom: 3px solid #0d5c4d !important;
      padding-bottom: 10px !important;
      margin-top: ${index === 0 ? '0' : '24px'} !important;
      margin-bottom: 16px !important;
      page-break-after: avoid !important;
      ${index > 0 ? 'page-break-before: always !important;' : ''}
    `;
  });

  // H2 - Section headings (inline, page-break only if not first)
  const h2s = container.querySelectorAll('h2');
  h2s.forEach((h2, index) => {
    (h2 as HTMLElement).style.cssText = `
      color: #0d5c4d !important;
      font-size: 16pt !important;
      font-weight: bold !important;
      text-transform: uppercase !important;
      letter-spacing: 1px !important;
      border-bottom: 2px solid #0d5c4d !important;
      padding-bottom: 8px !important;
      margin-top: ${index === 0 ? '0' : '20px'} !important;
      margin-bottom: 12px !important;
      page-break-after: avoid !important;
    `;
  });

  // H3 - Subsections
  const h3s = container.querySelectorAll('h3');
  h3s.forEach((h3) => {
    (h3 as HTMLElement).style.cssText = `
      color: #0d5c4d !important;
      font-size: 13pt !important;
      margin-top: 16px !important;
      margin-bottom: 8px !important;
      font-weight: bold !important;
      border-left: 4px solid #0d5c4d !important;
      padding-left: 10px !important;
      page-break-after: avoid !important;
    `;
  });

  // H4 - Sub-subsections
  const h4s = container.querySelectorAll('h4');
  h4s.forEach((h4) => {
    (h4 as HTMLElement).style.cssText = `
      color: #0d5c4d !important;
      font-size: 12pt !important;
      margin-top: 12px !important;
      margin-bottom: 6px !important;
      font-weight: bold !important;
      page-break-after: avoid !important;
    `;
  });

  // Strong elements
  const strongs = container.querySelectorAll('strong');
  strongs.forEach((strong) => {
    (strong as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-weight: bold !important;';
  });

  // Paragraphs
  const paragraphs = container.querySelectorAll('p');
  paragraphs.forEach((p) => {
    (p as HTMLElement).style.cssText = `
      color: #1a1a1a !important;
      margin-bottom: 6px !important;
      text-align: justify !important;
      orphans: 3 !important;
      widows: 3 !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
    `;
  });

  // Lists
  const lists = container.querySelectorAll('ul, ol');
  lists.forEach((list) => {
    (list as HTMLElement).style.cssText = `
      color: #1a1a1a !important;
      margin-left: 20px !important;
      margin-bottom: 8px !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
    `;
  });

  // List items
  const listItems = container.querySelectorAll('li');
  listItems.forEach((li) => {
    (li as HTMLElement).style.cssText = `
      color: #1a1a1a !important;
      margin-bottom: 3px !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    `;
  });

  // Inline elements
  const spans = container.querySelectorAll('span, em, code, a');
  spans.forEach((span) => {
    (span as HTMLElement).style.cssText = 'color: #1a1a1a !important;';
  });

  // Tables - allow table split between pages, but never split rows
  const tables = container.querySelectorAll('table');
  tables.forEach((table) => {
    (table as HTMLElement).style.cssText = `
      width: 100% !important;
      border-collapse: collapse !important;
      margin-bottom: 12px !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
      font-size: 9pt !important;
    `;
  });

  const rows = container.querySelectorAll('tr');
  rows.forEach((row) => {
    (row as HTMLElement).style.cssText = `
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    `;
  });

  const ths = container.querySelectorAll('th');
  ths.forEach((th) => {
    (th as HTMLElement).style.cssText = `
      background: #0d5c4d !important;
      color: white !important;
      padding: 6px 8px !important;
      text-align: left !important;
      font-size: 9pt !important;
      border: 1px solid #0d5c4d !important;
    `;
  });

  const tds = container.querySelectorAll('td');
  tds.forEach((td) => {
    (td as HTMLElement).style.cssText = `
      padding: 5px 8px !important;
      border: 1px solid #ccc !important;
      color: #1a1a1a !important;
      font-size: 9pt !important;
    `;
  });

  // Details/summary (gabarito sections)
  const details = container.querySelectorAll('details');
  details.forEach((detail) => {
    (detail as HTMLElement).setAttribute('open', '');
    (detail as HTMLElement).style.cssText = `
      page-break-inside: auto !important;
      break-inside: auto !important;
      margin-bottom: 8px !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 4px !important;
      padding: 8px !important;
      background: #fafafa !important;
    `;
  });

  const summaries = container.querySelectorAll('summary');
  summaries.forEach((summary) => {
    (summary as HTMLElement).style.cssText = `
      font-weight: bold !important;
      color: #0d5c4d !important;
      cursor: default !important;
      margin-bottom: 4px !important;
      page-break-after: avoid !important;
    `;
  });

  // Horizontal rules - thin separator, avoid page break near them
  const hrs = container.querySelectorAll('hr');
  hrs.forEach((hr) => {
    (hr as HTMLElement).style.cssText = `
      border: none !important;
      border-top: 1px solid #ddd !important;
      margin: 12px 0 !important;
      page-break-after: avoid !important;
    `;
  });
};

export const exportToPDF = async ({ tema, contentElement }: PDFExportOptions): Promise<void> => {
  const html2pdf = (await import('html2pdf.js')).default;

  // Create main container
  const pdfContainer = document.createElement('div');
  
  // Add cover page
  pdfContainer.innerHTML = createCoverPage(tema);
  
  // Create content wrapper with cleaned HTML
  const contentWrapper = document.createElement('div');
  contentWrapper.innerHTML = stripAIPreamble(contentElement.innerHTML);
  contentWrapper.style.cssText = `
    background: white !important;
    color: #1a1a1a !important;
    padding: 15px 25px !important;
    font-family: 'Georgia', 'Times New Roman', serif !important;
    font-size: 11pt !important;
    line-height: 1.45 !important;
    width: 100% !important;
    max-width: none !important;
    overflow: visible !important;
  `;
  
  // Style content elements
  styleContentElements(contentWrapper);
  
  // Append content after cover
  pdfContainer.appendChild(contentWrapper);

  const opt = {
    margin: [12, 15, 15, 15] as [number, number, number, number],
    filename: `fechamento-${tema.trim().toLowerCase().replace(/\s+/g, '-').substring(0, 50)}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.96 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 794,
      letterRendering: true,
      backgroundColor: '#ffffff',
      scrollY: 0,
      scrollX: 0,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const,
      compress: true,
    },
    pagebreak: {
      mode: ['css', 'legacy'] as string[],
      before: '.pdf-page-break-before',
      after: '.pdf-page-break-after',
      avoid: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'table', 'details', 'img', 'figure', 'blockquote', 'pre'],
    }
  };

  await html2pdf().set(opt).from(pdfContainer).save();
};
