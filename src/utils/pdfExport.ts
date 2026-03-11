// PDF Export utility with cover page and optimized rendering via iframe
import { marked } from 'marked';

interface PDFExportOptions {
  tema: string;
  markdown: string;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Strip AI preamble/closing text that appears before/after actual content.
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

    if (tagName && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'table', 'hr', 'details', 'blockquote'].includes(tagName)) {
      foundContentStart = true;
      break;
    }

    if (tagName === 'p' || child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent || '').trim();
      if (!text) {
        child.remove();
        continue;
      }

      if (/^\*?\*?Quest[ãa]o/i.test(text) || /^\*?\*?\d+[\.\)]/i.test(text)) {
        foundContentStart = true;
        break;
      }

      const preamblePatterns = [
        /^(com certeza|claro|certo|ok|perfeito|vamos|aqui est[áa]|segue|pronto|elabor)/i,
        /^(como (monitor|preceptor|coordenador|professor|solicitado|seu))/i,
        /^(este (caso|material|conte[úu]do|fechamento|semin[áa]rio|documento) (foi|[ée]))/i,
        /^(a seguir|abaixo|conforme solicitado|conforme pedido)/i,
        /^(apresento|segue abaixo|seguem|vou (apresentar|elaborar|gerar))/i,
        /^(entendido|com base|baseado|de acordo)/i,
        /^(ol[áa]|boa noite|bom dia|boa tarde)/i,
        /^(preparei|elaborei|criei|gerei|montei|organizei|estruturei)/i,
        /^(segue o|segue a|aqui vai|veja o|veja a)/i,
        /^(com prazer|sem problemas|sem d[úu]vida|[ée] um prazer|[ée] uma honra)/i,
        /^(esse [ée]|este [ée]|essa [ée]|esta [ée]) (um|uma|o|a) (fechamento|semin[áa]rio|material|conte[úu]do|resumo)/i,
        /^(espero que|qualquer d[úu]vida|fico [àa] disposi[çc][ãa]o)/i,
        /^(prezad[oa]s?\s+(estudantes?|alunos?|colegas?))/i,
        /^(vamos [àa] explora[çc][ãa]o|vamos explorar|vamos come[çc]ar|vamos dissecar|vamos ao)/i,
      ];

      if (preamblePatterns.some(p => p.test(text))) {
        child.remove();
        continue;
      }

      if (text.length < 400 && !foundContentStart) {
        child.remove();
        continue;
      }

      foundContentStart = true;
    }
  }

  // Remove trailing AI closing remarks
  const remainingChildren = Array.from(temp.childNodes);
  for (let i = remainingChildren.length - 1; i >= 0; i--) {
    const child = remainingChildren[i] as HTMLElement;
    const text = (child.textContent || '').trim();
    if (!text) { child.remove(); continue; }
    const closingPatterns = [
      /^(espero que|qualquer d[úu]vida|fico [àa] disposi[çc][ãa]o|bons estudos|at[ée] a pr[óo]xima)/i,
      /^(caso (tenha|precise|queira)|se (precisar|quiser|tiver))/i,
      /^(estou [àa] disposi[çc][ãa]o|conte comigo)/i,
    ];
    if (closingPatterns.some(p => p.test(text)) && text.length < 300) {
      child.remove();
      continue;
    }
    break;
  }

  return temp.innerHTML;
};

const pdfStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: white; color: #1a1a1a; font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; width: 794px; }
  .cover { display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:100vh; text-align:center; padding:40px; page-break-after:always; }
  .cover .logo { width:80px;height:80px;background:linear-gradient(135deg,#0d5c4d,#10b981);border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:40px;box-shadow:0 10px 40px rgba(13,92,77,0.3); }
  .cover .brand { font-size:14pt;color:#0d5c4d;font-weight:600;letter-spacing:4px;text-transform:uppercase;margin-bottom:20px; }
  .cover .line { width:60px;height:3px;background:linear-gradient(90deg,#0d5c4d,#10b981);margin-bottom:40px;border-radius:2px; }
  .cover h1 { font-size:28pt;color:#1a1a1a;font-weight:bold;text-transform:uppercase;letter-spacing:3px;line-height:1.3;max-width:80%;margin-bottom:20px; }
  .cover .subtitle { font-size:12pt;color:#666;margin-top:20px; }
  .cover .date { font-size:11pt;color:#888;margin-top:60px; }
  .content { padding: 15px 25px 30px 25px; }
  .content h1 { color:#0d5c4d;font-size:20pt;font-weight:bold;text-transform:uppercase;letter-spacing:2px;border-bottom:3px solid #0d5c4d;padding-bottom:10px;margin-top:24px;margin-bottom:16px;page-break-after:avoid; }
  .content h1:first-child { margin-top:0; }
  .content h2 { color:#0d5c4d;font-size:16pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #0d5c4d;padding-bottom:8px;margin-top:20px;margin-bottom:12px;page-break-after:avoid; }
  .content h3 { color:#0d5c4d;font-size:13pt;font-weight:bold;margin-top:16px;margin-bottom:8px;border-left:4px solid #0d5c4d;padding-left:10px;page-break-after:avoid; }
  .content h4 { color:#0d5c4d;font-size:12pt;font-weight:bold;margin-top:12px;margin-bottom:6px;page-break-after:avoid; }
  .content p { margin-bottom:6px;text-align:justify;orphans:4;widows:4; }
  .content strong { color:#0d5c4d;font-weight:bold; }
  .content ul, .content ol { margin-left:20px;margin-bottom:8px; }
  .content li { margin-bottom:3px;list-style-position:outside; }
  .content ul li { list-style-type:disc; }
  .content blockquote { border-left:4px solid #0d5c4d;padding:8px 12px;margin:8px 0;background:#f8faf9;page-break-inside:avoid; }
  .content pre { background:#f5f5f5;padding:10px;border-radius:4px;margin:8px 0;font-size:9pt;page-break-inside:avoid;overflow-x:auto; }
  .content table { width:100%;border-collapse:collapse;margin-bottom:12px;font-size:9pt; }
  .content th { background:#0d5c4d;color:white;padding:6px 8px;text-align:left;border:1px solid #0d5c4d; }
  .content td { padding:5px 8px;border:1px solid #ccc;color:#1a1a1a; }
  .content tr { page-break-inside:avoid; }
  .content hr { border:none;border-top:1px solid #ddd;margin:12px 0; }
  .content details { page-break-inside:avoid;margin-bottom:8px;border:1px solid #e0e0e0;border-radius:4px;padding:8px;background:#fafafa; }
  .content summary { font-weight:bold;color:#0d5c4d; }
`;

export const exportToPDF = async ({ tema, markdown }: PDFExportOptions): Promise<void> => {
  const html2pdf = (await import('html2pdf.js')).default;

  if (!markdown || markdown.trim().length < 10) {
    throw new Error('Conteúdo não encontrado para exportar.');
  }

  // Convert markdown to HTML
  const rawHTML = await marked.parse(markdown);
  const cleanedHTML = stripAIPreamble(rawHTML);

  // Build full HTML document inside an iframe for isolated, reliable rendering
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1200px;border:none;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Não foi possível criar o documento para exportação.');
  }

  const coverSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>`;

  const fullHTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${pdfStyles}</style></head><body>
  <div class="cover">
    <div class="logo">${coverSVG}</div>
    <div class="brand">PreceptorMED</div>
    <div class="line"></div>
    <h1>${tema}</h1>
    <div class="subtitle">Fechamento de Objetivos</div>
    <div class="date">${formatDate(new Date())}</div>
  </div>
  <div class="content">${cleanedHTML}</div>
</body></html>`;

  iframeDoc.open();
  iframeDoc.write(fullHTML);
  iframeDoc.close();

  // Wait for iframe to fully render
  await new Promise(resolve => setTimeout(resolve, 500));

  const opt = {
    margin: [12, 15, 18, 15] as [number, number, number, number],
    filename: `fechamento-${tema.trim().toLowerCase().replace(/\s+/g, '-').substring(0, 50)}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 794,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const,
      compress: true,
    },
    pagebreak: {
      mode: ['css', 'legacy'] as string[],
      avoid: ['tr', 'blockquote', 'pre', 'details', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    }
  };

  try {
    await html2pdf().set(opt).from(iframeDoc.body).save();
  } finally {
    document.body.removeChild(iframe);
  }
};
