import type { Node, Edge } from '@xyflow/react';

export interface MindNode {
  id: string;
  title: string;
  level: 1 | 2 | 3; // 1=H2 main branch, 2=H3 subtopic, 3=leaf/bullet
  fullText: string;
  children: MindNode[];
}

export interface Section {
  title: string;
  children: string[];
  fullText: string;
}

/* ─── Markdown parser ─────────────────────────────────────────
 * Constroi uma arvore hierarquica do fechamento:
 *   - H2 (##) → ramo principal (level 1)
 *   - H3 (###) → subtopico (level 2)
 *   - "**Negrito:**" linha-inicial OU "- item" OU "1. item" → folha (level 3)
 *
 * Folhas dentro de um H3 viram filhos do H3.
 * Folhas dentro de um H2 sem H3 viram filhos diretos do H2.
 * Limita-se a folhas/H3 por ramo pra nao poluir o canvas.
 */
const MAX_CHILDREN_PER_TOPIC = 6;
const MAX_LEAVES_PER_SUBTOPIC = 4;

function cleanText(s: string): string {
  return s.replace(/^\*+|\*+$/g, '').replace(/[*_`]/g, '').replace(/^[-•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
}

function extractLeaves(text: string, max: number): MindNode[] {
  const leaves: MindNode[] = [];
  const lines = text.split('\n');
  let i = 0;
  for (const raw of lines) {
    if (leaves.length >= max) break;
    const line = raw.trim();
    if (!line) continue;

    // Padrao 1: bullet (- ou *) com possivel **negrito** no inicio
    const bullet = line.match(/^[-*]\s+(?:\*\*([^*]+?)\*\*\s*[:\-—]?\s*)?(.+)/);
    if (bullet) {
      const bold = bullet[1] ? bullet[1].trim() : '';
      const rest = bullet[2].trim();
      const title = bold || rest;
      const full = bold && rest ? `**${bold}:** ${rest}` : rest;
      leaves.push({ id: `leaf-${i++}`, title: cleanText(title).slice(0, 60), level: 3, fullText: full, children: [] });
      continue;
    }

    // Padrao 2: lista numerada (1. X)
    const numbered = line.match(/^\d+\.\s+(?:\*\*([^*]+?)\*\*\s*[:\-—]?\s*)?(.+)/);
    if (numbered) {
      const bold = numbered[1] ? numbered[1].trim() : '';
      const rest = numbered[2].trim();
      const title = bold || rest;
      const full = bold && rest ? `**${bold}:** ${rest}` : rest;
      leaves.push({ id: `leaf-${i++}`, title: cleanText(title).slice(0, 60), level: 3, fullText: full, children: [] });
      continue;
    }

    // Padrao 3: linha que comeca com **Negrito:** (subheading inline)
    const boldHead = line.match(/^\*\*([^*]+?)\*\*\s*[:\-—]\s*(.+)/);
    if (boldHead) {
      leaves.push({
        id: `leaf-${i++}`,
        title: cleanText(boldHead[1]).slice(0, 60),
        level: 3,
        fullText: `**${boldHead[1]}:** ${boldHead[2]}`,
        children: [],
      });
      continue;
    }
  }
  return leaves;
}

export function parseMindMap(
  markdown: string,
  centralTopic: string
): { nodes: Node[]; edges: Edge[]; tree: MindNode; sections: Section[] } {
  const root: MindNode = {
    id: 'center',
    title: centralTopic.length > 50 ? centralTopic.slice(0, 47) + '...' : centralTopic,
    level: 1,
    fullText: '',
    children: [],
  };

  const lines = markdown.split('\n');

  // Particiona em blocos por header
  type Block = { level: 2 | 3; title: string; body: string[] };
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2) {
      current = { level: 2, title: cleanText(h2[1]), body: [] };
      blocks.push(current);
    } else if (h3) {
      current = { level: 3, title: cleanText(h3[1]), body: [] };
      blocks.push(current);
    } else if (current) {
      current.body.push(line);
    }
  }

  // Monta arvore: blocks H2 viram filhos do root; blocks H3 viram filhos do H2 mais recente
  let lastH2: MindNode | null = null;
  for (const block of blocks) {
    const node: MindNode = {
      id: `n-${block.level}-${blocks.indexOf(block)}`,
      title: block.title.slice(0, 70),
      level: block.level === 2 ? 1 : 2,
      fullText: block.body.join('\n').trim(),
      children: [],
    };

    if (block.level === 2) {
      // Folhas direto desta secao (so se nao houver H3 abaixo)
      const idx = blocks.indexOf(block);
      const hasH3After = blocks.slice(idx + 1).some((b, bi) => {
        // procura ate o proximo H2
        const subsequent = blocks.slice(idx + 1).slice(0, bi + 1);
        return b.level === 3 && !subsequent.some(x => x.level === 2);
      });
      const firstH2After = blocks.slice(idx + 1).findIndex(b => b.level === 2);
      const slice = firstH2After === -1 ? blocks.slice(idx + 1) : blocks.slice(idx + 1, idx + 1 + firstH2After);
      const hasNestedH3 = slice.some(b => b.level === 3);

      if (!hasNestedH3) {
        node.children = extractLeaves(node.fullText, MAX_LEAVES_PER_SUBTOPIC);
      }
      root.children.push(node);
      lastH2 = node;
    } else {
      // H3 vira filho do ultimo H2
      node.children = extractLeaves(node.fullText, MAX_LEAVES_PER_SUBTOPIC);
      if (lastH2 && lastH2.children.length < MAX_CHILDREN_PER_TOPIC) {
        lastH2.children.push(node);
      } else if (!lastH2) {
        // H3 antes de qualquer H2 — coloca como filho direto do root
        root.children.push(node);
      }
    }
  }

  // Fallback: se nada foi parseado, usa qualquer heading
  if (root.children.length === 0) {
    const headings = lines
      .filter(l => l.startsWith('#'))
      .map(l => cleanText(l.replace(/^#+\s*/, '')))
      .filter(Boolean)
      .slice(0, 6);
    for (let i = 0; i < headings.length; i++) {
      root.children.push({ id: `fallback-${i}`, title: headings[i], level: 1, fullText: '', children: [] });
    }
  }

  // ─── Layout radial hierarquico ───
  // Cada ramo principal recebe um "wedge" angular proporcional ao tamanho da subarvore.
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: 'center',
    type: 'central',
    position: { x: 0, y: 0 },
    data: { label: root.title, fullText: '' },
  });

  const mainBranches = root.children;
  const totalWeight = mainBranches.reduce((s, b) => s + Math.max(1, b.children.length), 0);

  const RADIUS_L1 = 420;
  const RADIUS_L2 = 240;
  const RADIUS_L3 = 170;

  let angleCursor = -Math.PI / 2; // comeca em cima
  mainBranches.forEach((branch, bi) => {
    const weight = Math.max(1, branch.children.length);
    const wedge = (2 * Math.PI * weight) / totalWeight;
    const branchAngle = angleCursor + wedge / 2;
    const x = Math.cos(branchAngle) * RADIUS_L1;
    const y = Math.sin(branchAngle) * RADIUS_L1;
    const branchId = `b-${bi}`;

    nodes.push({
      id: branchId,
      type: 'topic',
      position: { x, y },
      data: { label: branch.title, fullText: branch.fullText, depth: 1 },
    });
    edges.push({
      id: `e-center-${branchId}`,
      source: 'center',
      target: branchId,
      type: 'smoothstep',
      animated: false,
      style: { strokeWidth: 2.5, stroke: '#005344' },
    });

    // Sub-nos (H3 ou leaves diretos)
    const subs = branch.children;
    if (subs.length > 0) {
      const subWedge = Math.min(wedge * 0.85, Math.PI / 1.2);
      const start = branchAngle - subWedge / 2;
      const step = subs.length > 1 ? subWedge / (subs.length - 1) : 0;
      subs.forEach((sub, si) => {
        const subAngle = subs.length === 1 ? branchAngle : start + step * si;
        const sx = x + Math.cos(subAngle) * RADIUS_L2;
        const sy = y + Math.sin(subAngle) * RADIUS_L2;
        const subId = `${branchId}-s-${si}`;
        const isLeaf = sub.level === 3;

        nodes.push({
          id: subId,
          type: isLeaf ? 'leaf' : 'subtopic',
          position: { x: sx, y: sy },
          data: { label: sub.title, fullText: sub.fullText, depth: 2 },
        });
        edges.push({
          id: `e-${branchId}-${subId}`,
          source: branchId,
          target: subId,
          type: 'smoothstep',
          style: { strokeWidth: 1.8, stroke: '#006D5B', opacity: 0.7 },
        });

        // Leaves do subtopic
        if (!isLeaf && sub.children.length > 0) {
          const leafSubWedge = Math.min(subWedge / Math.max(subs.length, 2), Math.PI / 2);
          const leafStart = subAngle - leafSubWedge / 2;
          const leafStep = sub.children.length > 1 ? leafSubWedge / (sub.children.length - 1) : 0;
          sub.children.forEach((leaf, li) => {
            const leafAngle = sub.children.length === 1 ? subAngle : leafStart + leafStep * li;
            const lx = sx + Math.cos(leafAngle) * RADIUS_L3;
            const ly = sy + Math.sin(leafAngle) * RADIUS_L3;
            const leafId = `${subId}-l-${li}`;
            nodes.push({
              id: leafId,
              type: 'leaf',
              position: { x: lx, y: ly },
              data: { label: leaf.title, fullText: leaf.fullText, depth: 3 },
            });
            edges.push({
              id: `e-${subId}-${leafId}`,
              source: subId,
              target: leafId,
              type: 'smoothstep',
              style: { strokeWidth: 1.2, stroke: '#94a3b8', opacity: 0.6 },
            });
          });
        }
      });
    }

    angleCursor += wedge;
  });

  // Mantem compat com chamadas antigas
  const sections: Section[] = mainBranches.map(b => ({
    title: b.title,
    children: b.children.map(c => c.title),
    fullText: b.fullText,
  }));

  return { nodes, edges, tree: root, sections };
}
