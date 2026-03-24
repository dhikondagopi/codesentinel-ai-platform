import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "core" | "module" | "external" | "util";
  complexity: "low" | "medium" | "high";
  files: number;
  description: string;
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

const nodes: GraphNode[] = [
  { id: "app", label: "App", x: 400, y: 60, type: "core", complexity: "medium", files: 2, description: "Root application entry point" },
  { id: "auth", label: "Auth", x: 160, y: 180, type: "module", complexity: "low", files: 8, description: "Authentication & session management" },
  { id: "api", label: "API Layer", x: 400, y: 200, type: "module", complexity: "medium", files: 15, description: "HTTP client & request handlers" },
  { id: "ui", label: "UI Components", x: 640, y: 180, type: "module", complexity: "low", files: 24, description: "Shared UI component library" },
  { id: "state", label: "State Mgmt", x: 240, y: 340, type: "module", complexity: "medium", files: 4, description: "Global state & store management" },
  { id: "data", label: "Data Processing", x: 560, y: 340, type: "module", complexity: "high", files: 6, description: "Data transforms & validation" },
  { id: "utils", label: "Utils", x: 400, y: 440, type: "util", complexity: "low", files: 12, description: "Shared utility functions" },
  { id: "react", label: "React", x: 80, y: 440, type: "external", complexity: "low", files: 0, description: "External: react@18.3.1" },
  { id: "express", label: "Express", x: 720, y: 440, type: "external", complexity: "low", files: 0, description: "External: express@4.19.2" },
];

const edges: GraphEdge[] = [
  { from: "app", to: "auth", weight: 2 },
  { from: "app", to: "api", weight: 3 },
  { from: "app", to: "ui", weight: 3 },
  { from: "auth", to: "state", weight: 2 },
  { from: "auth", to: "api", weight: 1 },
  { from: "api", to: "data", weight: 3 },
  { from: "api", to: "utils", weight: 2 },
  { from: "ui", to: "utils", weight: 1 },
  { from: "state", to: "utils", weight: 1 },
  { from: "data", to: "utils", weight: 2 },
  { from: "auth", to: "react", weight: 1 },
  { from: "ui", to: "react", weight: 2 },
  { from: "api", to: "express", weight: 2 },
];

const typeColors: Record<string, { fill: string; stroke: string; label: string }> = {
  core: { fill: "hsl(173, 80%, 50%)", stroke: "hsl(173, 80%, 60%)", label: "Core" },
  module: { fill: "hsl(210, 80%, 55%)", stroke: "hsl(210, 80%, 65%)", label: "Module" },
  external: { fill: "hsl(38, 92%, 55%)", stroke: "hsl(38, 92%, 65%)", label: "External" },
  util: { fill: "hsl(150, 60%, 45%)", stroke: "hsl(150, 60%, 55%)", label: "Utility" },
};

const complexityColors: Record<string, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

export default function DependencyGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const activeNode = hoveredNode || selectedNode;

  const isEdgeActive = useCallback((edge: GraphEdge) => {
    if (!activeNode) return false;
    return edge.from === activeNode || edge.to === activeNode;
  }, [activeNode]);

  const isNodeActive = useCallback((nodeId: string) => {
    if (!activeNode) return true;
    if (nodeId === activeNode) return true;
    return edges.some(e => (e.from === activeNode && e.to === nodeId) || (e.to === activeNode && e.from === nodeId));
  }, [activeNode]);

  const getNodePos = (id: string) => {
    const n = nodes.find(n => n.id === id);
    return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
  };

  const selected = nodes.find(n => n.id === selectedNode);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(typeColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: val.fill }} />
            {val.label}
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto">Click a node to inspect</span>
      </div>

      {/* SVG Graph */}
      <div className="relative rounded-lg border border-border bg-card overflow-hidden">
        <svg viewBox="0 0 800 520" className="w-full h-auto" style={{ minHeight: 320 }}>
          <defs>
            {Object.entries(typeColors).map(([key, val]) => (
              <radialGradient key={key} id={`glow-${key}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={val.fill} stopOpacity="0.3" />
                <stop offset="100%" stopColor={val.fill} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const from = getNodePos(edge.from);
            const to = getNodePos(edge.to);
            const active = isEdgeActive(edge);
            const fromNode = nodes.find(n => n.id === edge.from)!;
            return (
              <motion.line
                key={i}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={active ? typeColors[fromNode.type].fill : "hsl(220, 14%, 20%)"}
                strokeWidth={active ? edge.weight * 1.2 : 1}
                strokeOpacity={activeNode ? (active ? 0.8 : 0.1) : 0.3}
                strokeDasharray={edge.weight === 1 ? "4 4" : undefined}
                initial={false}
                animate={{
                  strokeOpacity: activeNode ? (active ? 0.8 : 0.1) : 0.3,
                  strokeWidth: active ? edge.weight * 1.2 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const colors = typeColors[node.type];
            const active = isNodeActive(node.id);
            const isSelected = node.id === activeNode;
            const radius = node.type === "core" ? 32 : node.type === "external" ? 22 : 28;

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => setSelectedNode(prev => prev === node.id ? null : node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Glow */}
                {isSelected && (
                  <motion.circle
                    cx={node.x} cy={node.y} r={radius + 16}
                    fill={`url(#glow-${node.type})`}
                    initial={{ opacity: 0, r: radius }}
                    animate={{ opacity: 1, r: radius + 16 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                <motion.circle
                  cx={node.x} cy={node.y} r={radius}
                  fill={isSelected ? colors.fill : "hsl(220, 18%, 10%)"}
                  stroke={colors.fill}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  initial={false}
                  animate={{
                    opacity: active ? 1 : 0.25,
                    scale: isSelected ? 1.08 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                />
                <motion.text
                  x={node.x} y={node.y + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={isSelected ? "hsl(220, 20%, 4%)" : colors.fill}
                  fontSize={node.type === "external" ? 9 : 10}
                  fontWeight={600}
                  fontFamily="var(--font-display)"
                  initial={false}
                  animate={{ opacity: active ? 1 : 0.25 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-none select-none"
                >
                  {node.label}
                </motion.text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info Panel */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-border bg-card p-4 flex items-start gap-4"
          >
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: typeColors[selected.type].fill + "22", border: `1px solid ${typeColors[selected.type].fill}44` }}>
              <div className="h-3 w-3 rounded-full" style={{ background: typeColors[selected.type].fill }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground">{selected.label}</h4>
                <span className={`text-[10px] font-medium uppercase ${complexityColors[selected.complexity]}`}>{selected.complexity} complexity</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{selected.description}</p>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                {selected.files > 0 && <span>{selected.files} files</span>}
                <span>{edges.filter(e => e.from === selected.id).length} outgoing deps</span>
                <span>{edges.filter(e => e.to === selected.id).length} incoming deps</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
