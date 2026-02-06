import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Tile } from '../layout/Tile';

interface TopologyMapProps {
  isActive: boolean;
}

const nodeStyle = (color: string, active: boolean) => ({
  background: `${color}20`,
  border: `2px solid ${color}`,
  borderRadius: '12px',
  padding: '10px 16px',
  fontSize: '11px',
  color: '#e5e7eb',
  fontWeight: 600,
  boxShadow: active ? `0 0 20px ${color}40` : 'none',
});

export function TopologyMap({ isActive }: TopologyMapProps) {
  const nodes: Node[] = useMemo(() => [
    {
      id: 'nessie',
      data: { label: '🏦 Nessie API' },
      position: { x: 0, y: 100 },
      style: nodeStyle('#22c55e', isActive),
      sourcePosition: Position.Right,
    },
    {
      id: 'redpanda',
      data: { label: '🐼 Redpanda' },
      position: { x: 180, y: 100 },
      style: nodeStyle('#ef4444', isActive),
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'anomaly',
      data: { label: '🔍 Anomaly Engine' },
      position: { x: 360, y: 50 },
      style: nodeStyle('#f59e0b', isActive),
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'agent',
      data: { label: '🤖 AI Agent' },
      position: { x: 360, y: 160 },
      style: nodeStyle('#06b6d4', isActive),
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'dashboard',
      data: { label: '📊 Dashboard' },
      position: { x: 540, y: 100 },
      style: nodeStyle('#a855f7', isActive),
      targetPosition: Position.Left,
    },
  ], [isActive]);

  const edges: Edge[] = useMemo(() => [
    { id: 'e1', source: 'nessie', target: 'redpanda', animated: isActive, style: { stroke: '#22c55e' } },
    { id: 'e2', source: 'redpanda', target: 'anomaly', animated: isActive, style: { stroke: '#ef4444' } },
    { id: 'e3', source: 'anomaly', target: 'agent', animated: isActive, style: { stroke: '#f59e0b' }, label: 'alerts' },
    { id: 'e4', source: 'anomaly', target: 'dashboard', animated: isActive, style: { stroke: '#f59e0b' } },
    { id: 'e5', source: 'agent', target: 'dashboard', animated: isActive, style: { stroke: '#06b6d4' }, label: 'traces' },
  ], [isActive]);

  return (
    <Tile title="System Topology" icon="🗺️" accentColor="#a855f7">
      <div className="h-full w-full" style={{ minHeight: '200px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
        >
          <Background color="#374151" gap={20} size={1} />
        </ReactFlow>
      </div>
    </Tile>
  );
}
