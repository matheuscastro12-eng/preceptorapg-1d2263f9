import { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { parseMindMap, type Section } from './parseMindMap';
import { X, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';

/* ── Custom node types ── */

function CentralNode({ data }: NodeProps) {
  return (
    <div className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm text-center shadow-lg shadow-primary/30 max-w-[220px] border-2 border-primary">
      <Handle type="source" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
      {(data as { label: string }).label}
    </div>
  );
}

function TopicNode({ data }: NodeProps) {
  const d = data as { label: string; hasChildren: boolean };
  return (
    <div className="px-4 py-2.5 rounded-xl bg-card border-2 border-primary/40 text-foreground font-semibold text-xs text-center shadow-md max-w-[200px] cursor-pointer hover:border-primary hover:shadow-lg transition-all group">
      <Handle type="target" position={Position.Top} className="!bg-primary/60 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary/60 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-primary/60 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary/60 !w-2 !h-2" />
      <div className="flex items-center gap-1 justify-center">
        {d.label}
        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
      </div>
    </div>
  );
}

function LeafNode({ data }: NodeProps) {
  const d = data as { label: string; fullText?: string };
  const isTruncated = d.fullText && d.fullText !== d.label;
  return (
    <div className={`px-3 py-1.5 rounded-lg bg-muted/80 border border-border text-muted-foreground text-[11px] text-center max-w-[180px] leading-tight ${isTruncated ? 'cursor-pointer hover:border-primary/40 hover:bg-muted transition-all' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground/40 !w-1.5 !h-1.5" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground/40 !w-1.5 !h-1.5" />
      <Handle type="target" position={Position.Right} className="!bg-muted-foreground/40 !w-1.5 !h-1.5" />
      {d.label}
    </div>
  );
}

const nodeTypes = {
  central: CentralNode,
  topic: TopicNode,
  leaf: LeafNode,
};

/* ── Detail Panel ── */

function DetailPanel({ section, onClose }: { section: Section; onClose: () => void }) {
  return (
    <div className="absolute top-4 right-4 z-50 w-[360px] max-h-[calc(100%-2rem)] bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-bold text-sm text-foreground truncate">{section.title}</h3>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <ScrollArea className="flex-1 max-h-[400px]">
        <div className="px-4 py-3 prose prose-sm max-w-none text-xs">
          {section.fullText ? (
            <MarkdownRenderer content={section.fullText} />
          ) : (
            <ul className="space-y-1.5">
              {section.children.map((c, i) => (
                <li key={i} className="text-muted-foreground">{c}</li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── Main component ── */

interface MindMapViewProps {
  content: string;
  topic: string;
}

export default function MindMapView({ content, topic }: MindMapViewProps) {
  const { nodes: initialNodes, edges: initialEdges, sections } = useMemo(
    () => parseMindMap(content, topic),
    [content, topic]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const onInit = useCallback((instance: any) => {
    setTimeout(() => instance.fitView({ padding: 0.3 }), 100);
  }, []);

  const [leafPopup, setLeafPopup] = useState<{ text: string; x: number; y: number } | null>(null);

  const onNodeClick = useCallback(
    (_: any, node: any) => {
      setLeafPopup(null);
      if (node.type === 'topic' && node.data.sectionIndex !== undefined) {
        const section = sections[node.data.sectionIndex as number];
        setSelectedSection((prev) => (prev?.title === section.title ? null : section));
      } else if (node.type === 'leaf' && node.data.fullText) {
        setSelectedSection(null);
        setLeafPopup({
          text: node.data.fullText as string,
          x: node.position.x,
          y: node.position.y,
        });
      }
    },
    [sections]
  );

  return (
    <div className="relative w-full h-full bg-background rounded-xl border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={() => { setLeafPopup(null); setSelectedSection(null); }}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { stroke: 'hsl(var(--primary) / 0.4)', strokeWidth: 2 },
        }}
      >
        <Background gap={24} size={1} className="!bg-background" />
        <Controls className="!bg-card !border-border !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor="hsl(var(--primary) / 0.5)"
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
      {selectedSection && (
        <DetailPanel section={selectedSection} onClose={() => setSelectedSection(null)} />
      )}
      {leafPopup && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md bg-card border border-border rounded-xl shadow-2xl px-5 py-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start gap-3">
            <p className="text-sm text-foreground leading-relaxed">{leafPopup.text}</p>
            <button
              onClick={() => setLeafPopup(null)}
              className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
