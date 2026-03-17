import { useMemo, useCallback } from 'react';
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
  return (
    <div className="px-4 py-2.5 rounded-xl bg-card border-2 border-primary/40 text-foreground font-semibold text-xs text-center shadow-md max-w-[200px]">
      <Handle type="target" position={Position.Top} className="!bg-primary/60 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary/60 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-primary/60 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary/60 !w-2 !h-2" />
      {(data as { label: string }).label}
    </div>
  );
}

function LeafNode({ data }: NodeProps) {
  return (
    <div className="px-3 py-1.5 rounded-lg bg-muted/80 border border-border text-muted-foreground text-[11px] text-center max-w-[180px] leading-tight">
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground/40 !w-1.5 !h-1.5" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground/40 !w-1.5 !h-1.5" />
      <Handle type="target" position={Position.Right} className="!bg-muted-foreground/40 !w-1.5 !h-1.5" />
      {(data as { label: string }).label}
    </div>
  );
}

const nodeTypes = {
  central: CentralNode,
  topic: TopicNode,
  leaf: LeafNode,
};

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

  const onInit = useCallback((instance: any) => {
    setTimeout(() => instance.fitView({ padding: 0.3 }), 100);
  }, []);

  return (
    <div className="w-full h-full bg-background rounded-xl border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
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
    </div>
  );
}
