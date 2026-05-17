/**
 * Parser de resumo PBL → estrutura de painel de estudo.
 *
 * Em vez de um grafo radial (que ficava ilegivel), o mapa mental agora e
 * um conjunto de "cards de secao" tipograficamente densos. Para cada H2
 * do resumo, extraimos:
 *  - Titulo + categoria semantica (bases/clinica/tratamento/prognostico/outros)
 *  - Lista de "key points" (frases curtas) tirados dos primeiros bullets,
 *    listas numeradas e subheadings em negrito da secao
 *  - Termos em destaque (negrito) — viram chips no topo do card
 *  - Subsecoes (H3 dentro do H2) com seus proprios pontos-chave
 *  - Texto completo (pra expandir o card e ler tudo)
 */

export type SectionCategory =
  | 'bases'
  | 'clinica'
  | 'tratamento'
  | 'prognostico'
  | 'epidemio'
  | 'outros';

export interface KeyPoint {
  /** Titulo curto (heading do bullet/numerado/**negrito:**) */
  title: string;
  /** Texto completo (titulo + restante da frase) */
  text: string;
}

export interface Subsection {
  title: string;
  fullText: string;
  keyPoints: KeyPoint[];
}

export interface StudyCard {
  id: string;
  title: string;
  category: SectionCategory;
  /** Numero pra ordenar/numerar visual no card */
  index: number;
  /** Termos-chave em destaque (negrito) do corpo */
  terms: string[];
  /** Pontos-chave extraidos (max 6) */
  keyPoints: KeyPoint[];
  /** Subsecoes H3 dentro da secao */
  subsections: Subsection[];
  /** Markdown completo da secao pra "expandir" */
  fullText: string;
}

/* ─── Categorizacao ──────────────────────────────────────────── */

// Padrões de prefixo (sem \b final) — em português os stems quase sempre
// têm sufixo (-ia, -mento, -ção, -ões, ...) e um \b final cortaria o match.
const CATEGORY_PATTERNS: Array<{ cat: SectionCategory; re: RegExp }> = [
  { cat: 'bases', re: /\b(anatomi|histologi|fisiologi(?!a do diagn)|embriolog|biolog|bioqu[ií]mic|molecul|morfofuncion|histopatolog)/i },
  { cat: 'epidemio', re: /\b(epidemiolog|incid[eê]nci|preval[eê]nci|mortalidad|estat[ií]stic)/i },
  { cat: 'clinica', re: /\b(manifesta|sintoma|sinais|quadro|cl[ií]nic|s[ií]ndrome|fisiopatolog|cascata|mecanism|patog[eê]n|etiolog|diagn[oó]stic|exame|imagem|laborator|crit[eé]rio|classifica|nosologi|achado|patologi)/i },
  { cat: 'tratamento', re: /\b(tratament|terap[eê]utic|manejo|conduta|f[aá]rmaco|farmacol[oó]gic|medicament|cir[uú]rgic|intervenc|interven[çc][aã]o|posolog|dose|indica[çc]|contraindic|monitora)/i },
  { cat: 'prognostico', re: /\b(progn[oó]stic|complica[çc]|evolu[çc]|sobrevid|recidiv|preven[çc]|profilax|sequela|rastrea)/i },
];

function classifySection(title: string): SectionCategory {
  for (const { cat, re } of CATEGORY_PATTERNS) {
    if (re.test(title)) return cat;
  }
  return 'outros';
}

/* ─── Extracao de termos e key points ────────────────────────── */

const MAX_KEYPOINTS = 6;
const MAX_TERMS = 5;

function clean(s: string): string {
  return s
    .replace(/^\*+|\*+$/g, '')
    .replace(/[*_`]/g, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/^[-•]\s+/, '')
    .trim();
}

// Limites generosos pra que o card expandido caiba a frase inteira na maioria
// dos casos. Acima disso ainda corta, mas e raro.
const MAX_TITLE_LEN = 160;
const MAX_TEXT_LEN = 600;

/** Divide um bullet "plano" em titulo + descricao se houver ":" ou "—". */
function splitPlainBullet(s: string): { title: string; text: string } {
  // Aceita "Termo: descricao" / "Termo - descricao" / "Termo — descricao"
  // Titulo precisa ser curto (<= 60 chars) pra evitar virar uma frase inteira.
  const m = s.match(/^([^:—–\-]{2,60})\s*[:—–-]\s+(.+)/);
  if (m) {
    const title = m[1].trim();
    const text = m[2].trim();
    // Se o "titulo" terminar com palavra solta tipo verbo+preposicao, prefere
    // manter a frase inteira. Heuristica: titulo nao pode acabar em " de", " da", etc.
    if (!/\s(de|da|do|das|dos|em|no|na|por|para|com|sem|a|o)$/i.test(title)) {
      return { title, text };
    }
  }
  return { title: s, text: s };
}

function extractKeyPoints(text: string, max = MAX_KEYPOINTS): KeyPoint[] {
  const points: KeyPoint[] = [];
  const seen = new Set<string>();
  const lines = text.split('\n');

  const push = (title: string, text: string) => {
    const t = title.trim();
    if (!t) return;
    const key = t.toLowerCase().slice(0, 60);
    if (seen.has(key)) return;
    seen.add(key);
    points.push({
      title: t.slice(0, MAX_TITLE_LEN),
      text: text.trim().slice(0, MAX_TEXT_LEN),
    });
  };

  for (const raw of lines) {
    if (points.length >= max) break;
    const line = raw.trim();
    if (!line) continue;

    // bullet com **negrito:**
    const bulletBold = line.match(/^[-*]\s+\*\*([^*]+?)\*\*\s*[:\-—]\s*(.+)/);
    if (bulletBold) {
      push(clean(bulletBold[1]), clean(bulletBold[2]));
      continue;
    }
    // bullet simples — tenta detectar "Termo: descricao"
    const bullet = line.match(/^[-*]\s+(.+)/);
    if (bullet) {
      const t = clean(bullet[1]);
      const { title, text } = splitPlainBullet(t);
      push(title, text);
      continue;
    }
    // numerada com **negrito:**
    const numBold = line.match(/^\d+\.\s+\*\*([^*]+?)\*\*\s*[:\-—]\s*(.+)/);
    if (numBold) {
      push(clean(numBold[1]), clean(numBold[2]));
      continue;
    }
    // numerada simples — tenta dividir tambem
    const num = line.match(/^\d+\.\s+(.+)/);
    if (num) {
      const t = clean(num[1]);
      const { title, text } = splitPlainBullet(t);
      push(title, text);
      continue;
    }
    // **Negrito:** texto no inicio da linha
    const inlineBold = line.match(/^\*\*([^*]+?)\*\*\s*[:\-—]\s*(.+)/);
    if (inlineBold) {
      push(clean(inlineBold[1]), clean(inlineBold[2]));
      continue;
    }
  }
  return points;
}

function extractTerms(text: string, max = MAX_TERMS): string[] {
  const matches = Array.from(text.matchAll(/\*\*([^*\n]{3,40})\*\*/g));
  const set = new Set<string>();
  const terms: string[] = [];
  for (const m of matches) {
    const t = m[1].trim().replace(/[:\-—]$/, '').trim();
    if (!t || /^\d/.test(t)) continue;
    const key = t.toLowerCase();
    if (set.has(key)) continue;
    set.add(key);
    terms.push(t.length > 35 ? t.slice(0, 32) + '…' : t);
    if (terms.length >= max) break;
  }
  return terms;
}

/* ─── Parser principal ───────────────────────────────────────── */

export function parseMindMap(markdown: string, _topic: string): { cards: StudyCard[] } {
  const lines = markdown.split('\n');

  type Block = { level: 2 | 3; title: string; body: string[] };
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2) {
      current = { level: 2, title: clean(h2[1]), body: [] };
      blocks.push(current);
    } else if (h3) {
      current = { level: 3, title: clean(h3[1]), body: [] };
      blocks.push(current);
    } else if (current) {
      current.body.push(line);
    }
  }

  // Agrupa H3 sob o H2 anterior
  const cards: StudyCard[] = [];
  let cardIdx = 0;
  let currentCard: StudyCard | null = null;

  for (const block of blocks) {
    if (block.level === 2) {
      const bodyText = block.body.join('\n').trim();
      currentCard = {
        id: `card-${cardIdx}`,
        title: block.title.replace(/^\d+\.\s*/, ''),
        category: classifySection(block.title),
        index: cardIdx + 1,
        terms: extractTerms(bodyText),
        keyPoints: extractKeyPoints(bodyText),
        subsections: [],
        fullText: bodyText,
      };
      cards.push(currentCard);
      cardIdx++;
    } else if (currentCard) {
      const subText = block.body.join('\n').trim();
      currentCard.subsections.push({
        title: block.title,
        fullText: subText,
        keyPoints: extractKeyPoints(subText, 4),
      });
      // Mescla pontos da subsecao no card se o card nao tem pontos suficientes
      if (currentCard.keyPoints.length < MAX_KEYPOINTS) {
        for (const kp of extractKeyPoints(subText, MAX_KEYPOINTS - currentCard.keyPoints.length)) {
          if (!currentCard.keyPoints.find(p => p.title.toLowerCase() === kp.title.toLowerCase())) {
            currentCard.keyPoints.push(kp);
          }
        }
      }
      // Mescla termos
      if (currentCard.terms.length < MAX_TERMS) {
        for (const t of extractTerms(subText, MAX_TERMS - currentCard.terms.length)) {
          if (!currentCard.terms.find(x => x.toLowerCase() === t.toLowerCase())) {
            currentCard.terms.push(t);
          }
        }
      }
    }
  }

  return { cards };
}
