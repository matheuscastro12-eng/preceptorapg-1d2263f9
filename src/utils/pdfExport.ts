// PDF Export utility with cover page and section formatting

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

  // H1 - Título principal (capa de seção)
  const h1s = container.querySelectorAll('h1');
  h1s.forEach((h1) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 200px; text-align: center; margin-bottom: 30px; page-break-before: always;';
    (h1 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 24pt !important; font-weight: bold !important; text-transform: uppercase !important; letter-spacing: 2px !important; border-bottom: 3px solid #0d5c4d !important; padding-bottom: 15px !important; margin: 0 !important;';
    h1.parentNode?.insertBefore(wrapper, h1);
    wrapper.appendChild(h1);
  });

  // H2 - Seções principais (capa de seção)
  const h2s = container.querySelectorAll('h2');
  h2s.forEach((h2) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 180px; text-align: center; margin-bottom: 25px; page-break-before: always;';
    (h2 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 20pt !important; font-weight: bold !important; text-transform: uppercase !important; letter-spacing: 1.5px !important; border-bottom: 2px solid #0d5c4d !important; padding-bottom: 12px !important; margin: 0 !important;';
    h2.parentNode?.insertBefore(wrapper, h2);
    wrapper.appendChild(h2);
  });

  // H3 - Subseções
  const h3s = container.querySelectorAll('h3');
  h3s.forEach((h3) => {
    (h3 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 14pt !important; margin-top: 20px !important; margin-bottom: 10px !important; font-weight: bold !important; border-left: 4px solid #0d5c4d !important; padding-left: 12px !important; page-break-after: avoid !important;';
  });

  // Strong elements
  const strongs = container.querySelectorAll('strong');
  strongs.forEach((strong) => {
    (strong as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-weight: bold !important;';
  });

  // Paragraphs
  const paragraphs = container.querySelectorAll('p');
  paragraphs.forEach((p) => {
    (p as HTMLElement).style.cssText = 'color: #1a1a1a !important; margin-bottom: 8px !important; text-align: justify !important;';
  });

  // Lists
  const lists = container.querySelectorAll('ul, ol');
  lists.forEach((list) => {
    (list as HTMLElement).style.cssText = 'color: #1a1a1a !important; margin-left: 20px !important; margin-bottom: 10px !important;';
  });

  // List items
  const listItems = container.querySelectorAll('li');
  listItems.forEach((li) => {
    (li as HTMLElement).style.cssText = 'color: #1a1a1a !important; margin-bottom: 4px !important;';
  });

  // Inline elements
  const spans = container.querySelectorAll('span, em, code, a');
  spans.forEach((span) => {
    (span as HTMLElement).style.cssText = 'color: #1a1a1a !important;';
  });
};

export const exportToPDF = async ({ tema, contentElement }: PDFExportOptions): Promise<void> => {
  const html2pdf = (await import('html2pdf.js')).default;

  // Create main container
  const pdfContainer = document.createElement('div');
  
  // Add cover page
  pdfContainer.innerHTML = createCoverPage(tema);
  
  // Create content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.innerHTML = contentElement.innerHTML;
  contentWrapper.style.cssText = `
    background: white !important;
    color: #1a1a1a !important;
    padding: 20px 30px !important;
    font-family: 'Georgia', 'Times New Roman', serif !important;
    font-size: 11pt !important;
    line-height: 1.5 !important;
    width: 100% !important;
    max-width: none !important;
    overflow: visible !important;
  `;
  
  // Style content elements
  styleContentElements(contentWrapper);
  
  // Append content after cover
  pdfContainer.appendChild(contentWrapper);

  const opt = {
    margin: [10, 12, 10, 12] as [number, number, number, number],
    filename: `fechamento-${tema.trim().toLowerCase().replace(/\s+/g, '-')}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 800,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'] as ('avoid-all' | 'css' | 'legacy')[],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['h1', 'h2', 'h3', 'h4', 'tr']
    }
  };

  await html2pdf().set(opt).from(pdfContainer).save();
};
