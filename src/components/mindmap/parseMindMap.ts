import type { Node, Edge } from '@xyflow/react';

export interface Section {
  title: string;
  children: string[];
  fullText: string;
}

/**
 * Parses markdown content from a fechamento into sections
 * based on H2/H3 headers. Returns ReactFlow nodes, edges, and section data.
 */
export function parseMindMap(
  markdown: string,
  centralTopic: string
): { nodes: Node[]; edges: Edge[]; sections: Section[] } {
  const sections: Section[] = [];
  const lines = markdown.split('\n');

  let currentSection: Section | null = null;
  const contentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    const h3Match = line.match(/^###\s+(.+)/);

    if (h2Match || h3Match) {
      // Save previous section's full text
      if (currentSection) {
        currentSection.fullText = contentLines.join('\n').trim();
        contentLines.length = 0;
      }
      const title = (h2Match?.[1] || h3Match?.[1] || '').replace(/[*_`]/g, '').trim();
      if (title) {
        currentSection = { title, children: [], fullText: '' };
        sections.push(currentSection);
      }
    } else if (currentSection) {
      contentLines.push(line);
      const bulletMatch = line.match(/^[-*]\s+\*?\*?(.+?)\*?\*?\s*$/);
      if (bulletMatch) {
        const text = bulletMatch[1].replace(/[*_`]/g, '').trim();
        if (text && currentSection.children.length < 5) {
          currentSection.children.push(text);
        }
      }
    }
  }
  // Save last section
  if (currentSection) {
    currentSection.fullText = contentLines.join('\n').trim();
  }

  if (sections.length === 0) {
    const headings = lines
      .filter((l) => l.startsWith('#'))
      .map((l) => l.replace(/^#+\s*/, '').replace(/[*_`]/g, '').trim())
      .filter(Boolean)
      .slice(0, 6);
    for (const h of headings) {
      sections.push({ title: h, children: [], fullText: '' });
    }
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const centralLabel = centralTopic.length > 40 ? centralTopic.slice(0, 37) + '...' : centralTopic;
  nodes.push({
    id: 'center',
    type: 'central',
    position: { x: 0, y: 0 },
    data: { label: centralLabel },
  });

  const count = sections.length;
  const radius = Math.max(320, count * 55);

  sections.forEach((section, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const sectionId = `section-${i}`;

    nodes.push({
      id: sectionId,
      type: 'topic',
      position: { x, y },
      data: { label: section.title, sectionIndex: i, hasChildren: section.children.length > 0 },
    });

    edges.push({
      id: `e-center-${sectionId}`,
      source: 'center',
      target: sectionId,
      type: 'smoothstep',
      style: { strokeWidth: 2 },
    });

    const childRadius = 140;
    const spreadAngle = Math.PI / 3;
    section.children.forEach((child, ci) => {
      const childAngle = angle - spreadAngle / 2 + (spreadAngle / Math.max(section.children.length - 1, 1)) * ci;
      const cx = x + Math.cos(childAngle) * childRadius;
      const cy = y + Math.sin(childAngle) * childRadius;
      const childId = `child-${i}-${ci}`;

      nodes.push({
        id: childId,
        type: 'leaf',
        position: { x: cx, y: cy },
        data: { label: child },
      });

      edges.push({
        id: `e-${sectionId}-${childId}`,
        source: sectionId,
        target: childId,
        type: 'smoothstep',
        style: { strokeWidth: 1.5, opacity: 0.6 },
      });
    });
  });

  return { nodes, edges, sections };
}
