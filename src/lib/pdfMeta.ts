// Dynamic import de pdfjs SO quando o user vai mexer com PDF.
// Evita carregar a lib (~250KB) na rota /provas mesmo quando o user
// so esta navegando.

export interface PdfMeta {
  numPages: number;
  fileSizeBytes: number;
  /** Concatenado primeiros 200 chars do texto pra detectar prova vazia/scanned */
  firstPageTextSnippet: string;
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then(async (mod) => {
      // Worker via CDN — evita bundle do worker no nosso build
      const workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`;
      mod.GlobalWorkerOptions.workerSrc = workerSrc;
      return mod;
    });
  }
  return pdfjsPromise;
}

export async function readPdfMeta(file: File): Promise<PdfMeta> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const numPages = doc.numPages;
  let firstPageTextSnippet = "";
  try {
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    firstPageTextSnippet = content.items
      .map((it: unknown) =>
        typeof (it as { str?: unknown }).str === "string"
          ? (it as { str: string }).str
          : ""
      )
      .join(" ")
      .slice(0, 200);
  } catch {
    /* ignore — pode ser PDF protegido ou scan */
  }
  return {
    numPages,
    fileSizeBytes: file.size,
    firstPageTextSnippet,
  };
}

export interface PageText {
  page_num: number;
  text: string;
}

/**
 * Extrai texto pagina-a-pagina do PDF. Funciona pra PDFs digitais.
 * Pra scans, retorna paginas vazias (caller deve detectar).
 */
export async function extractTextByPage(file: File): Promise<PageText[]> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: PageText[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    let text = "";
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // Reconstroi texto preservando ordem; quebra de linha quando o item
      // tem `hasEOL` ou estamos fim de bloco.
      const items = content.items as Array<{
        str: string;
        hasEOL?: boolean;
      }>;
      let buf = "";
      for (const it of items) {
        if (typeof it.str === "string") buf += it.str;
        if (it.hasEOL) buf += "\n";
        else buf += " ";
      }
      // Compacta espacos multiplos mas mantem linhas
      text = buf.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    } catch {
      /* pagina ilegivel */
    }
    pages.push({ page_num: i, text });
  }
  return pages;
}

