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
import { parseMindMap } from './parseMindMap';
import { X, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MarkdownRenderer from '@/components/MarkdownRenderer';

/* ── Custom node types ── */

function CentralNode({ data }: NodeProps) {
  const d = data as { label: string };
  return (
    <div className="relative">
      <div
        className="relative px-6 py-3.5 rounded-2xl text-white font-['Manrope'] font-bold text-[15px] text-center max-w-[260px] shadow-[0_12px_32px_-12px_rgba(0,109,91,0.5)] border border-[#003D32]"
        style={{ background: 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)' }}
      >
        <div className="absolute -top-[1px] left-4 right-4 h-[2px] rounded-b-sm bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />
        <Handle type="source" position={Position.Top} className="!bg-[#005344] !w-2 !h-2 !border-0" />
        <Handle type="source" position={Position.Bottom} className="!bg-[#005344] !w-2 !h-2 !border-0" />
        <Handle type="source" position={Position.Left} className="!bg-[#005344] !w-2 !h-2 !border-0" />
        <Handle type="source" position={Position.Right} className="!bg-[#005344] !w-2 !h-2 !border-0" />
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#C9A84C] mb-1 leading-none">Tema central</p>
        <p className="leading-tight tracking-[-0.01em]">{d.label}</p>
      </div>
    </div>
  );
}

function TopicNode({ data }: NodeProps) {
  const d = data as { label: string; fullText?: string };
  return (
    <div className="relative px-4 py-2.5 rounded-xl bg-white border-2 border-[#005344] text-[#191C1D] font-['Manrope'] font-bold text-[12.5px] text-center max-w-[220px] shadow-[0_4px_12px_-4px_rgba(0,83,68,0.25)] cursor-pointer hover:shadow-[0_8px_20px_-6px_rgba(0,83,68,0.4)] hover:-translate-y-0.5 transition-all group">
      <div className="absolute top-0 left-3 right-3 h-[2px] rounded-b-sm bg-gradient-to-r from-[#005344] to-[#C9A84C]" />
      <Handle type="target" position={Position.Top} className="!bg-[#005344] !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#005344] !w-2 !h-2 !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-[#005344] !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Right} className="!bg-[#005344] !w-2 !h-2 !border-0" />
      <div className="flex items-center gap-1.5 justify-center mt-0.5">
        <span className="leading-tight tracking-[-0.005em]">{d.label}</span>
        {d.fullText && <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#005344] shrink-0" />}
      </div>
    </div>
  );
}

function SubtopicNode({ data }: NodeProps) {
  const d = data as { label: string; fullText?: string };
  return (
    <div className="relative px-3.5 py-2 rounded-lg bg-white border border-[#006D5B]/40 text-[#3E4945] font-semibold text-[11.5px] text-center max-w-[180px] shadow-sm cursor-pointer hover:border-[#006D5B] hover:shadow-md transition-all group">
      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#006D5B]" />
      <Handle type="target" position={Position.Top} className="!bg-[#006D5B] !w-1.5 !h-1.5 !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#006D5B] !w-1.5 !h-1.5 !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-[#006D5B] !w-1.5 !h-1.5 !border-0" />
      <Handle type="source" position={Position.Right} className="!bg-[#006D5B] !w-1.5 !h-1.5 !border-0" />
      <div className="flex items-center gap-1 justify-center pl-1">
        <span className="leading-tight">{d.label}</span>
        {d.fullText && <ChevronRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#006D5B] shrink-0" />}
      </div>
    </div>
  );
}

function LeafNode({ data }: NodeProps) {
  const d = data as { label: string; fullText?: string };
  const isTruncated = d.fullText && d.fullText.length > d.label.length + 5;
  return (
    <div
      className={`px-3 py-1.5 rounded-md bg-[#fafbfa] border border-slate-200 text-[#4a5568] text-[10.5px] font-medium text-center max-w-[170px] leading-tight ${
        isTruncated ? 'cursor-pointer hover:border-[#C9A84C]/60 hover:bg-white hover:text-[#191C1D] transition-all' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-1.5 !h-1.5 !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-slate-300 !w-1.5 !h-1.5 !border-0" />
      <Handle type="target" position={Position.Right} className="!bg-slate-300 !w-1.5 !h-1.5 !border-0" />
      {d.label}
    </div>
  );
}

const nodeTypes = {
  central: CentralNode,
  topic: TopicNode,
  subtopic: SubtopicNode,
  leaf: LeafNode,
};

/* ── Detail Panel ── */

function DetailPanel({ title, fullText, onClose }: { title: string; fullText: string; onClose: () => void }) {
  return (
    <div className="absolute top-4 right-4 z-50 w-[380px] max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)] bg-white border border-slate-200 rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,109,91,0.35)] flex flex-col animate-in slide-in-from-right-4 duration-200 overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="min-w-0 flex-1">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-1.5 leading-none">
            <span className="w-4 h-px bg-[#C9A84C]" />
            Detalhamento
          </p>
          <h3 className="font-['Manrope'] font-bold text-[14px] tracking-[-0.01em] text-[#191C1D] mt-1 truncate">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-[#94a3b8] hover:text-[#191C1D] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-5 py-4 prose prose-sm max-w-none text-[12.5px] leading-relaxed text-[#3E4945] prose-strong:text-[#191C1D] prose-headings:font-['Manrope'] prose-headings:text-[#191C1D] prose-a:text-[#005344]">
          <MarkdownRenderer content={fullText} />
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
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => parseMindMap(content, topic),
    [content, topic]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [detail, setDetail] = useState<{ title: string; fullText: string } | null>(null);

  const onInit = useCallback((instance: any) => {
    setTimeout(() => instance.fitView({ padding: 0.25 }), 100);
  }, []);

  const onNodeClick = useCallback(
    (_: any, node: any) => {
      const data = node.data as { label?: string; fullText?: string };
      if (node.type === 'central') return;
      if (data.fullText) {
        setDetail({ title: data.label || 'Detalhamento', fullText: data.fullText });
      }
    },
    []
  );

  return (
    <div className="relative w-full h-full rounded-xl border border-slate-200 overflow-hidden" style={{ background: '#fafbfa' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={() => setDetail(null)}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.15}
        maxZoom={2.2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { stroke: '#005344', strokeWidth: 2 },
        }}
      >
        <Background gap={28} size={1} color="#e2e6e5" />
        <Controls
          className="!bg-white !border !border-slate-200 !shadow-md !rounded-lg [&>button]:!bg-white [&>button]:!border-slate-200 [&>button]:!text-[#4a5568] [&>button:hover]:!bg-[#005344]/05 [&>button:hover]:!text-[#005344]"
        />
        <MiniMap
          className="!bg-white !border !border-slate-200 !rounded-lg !shadow-sm"
          nodeColor={(n) => {
            if (n.type === 'central') return '#005344';
            if (n.type === 'topic') return '#006D5B';
            if (n.type === 'subtopic') return '#6e9b94';
            return '#cbd5e1';
          }}
          maskColor="rgba(250,251,250,0.7)"
          pannable
          zoomable
        />
      </ReactFlow>
      {detail && (
        <DetailPanel title={detail.title} fullText={detail.fullText} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
