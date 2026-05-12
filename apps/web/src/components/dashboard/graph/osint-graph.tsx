'use client';

import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface OsintGraphProps {
  elements: cytoscape.ElementDefinition[];
  onNodeClick?: (id: string) => void;
}

export function OsintGraph({ elements, onNodeClick }: OsintGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#0ea5e9',
            'label': 'data(label)',
            'color': '#fff',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': '40px',
            'height': '40px',
            'border-width': 2,
            'border-color': '#38bdf8',
            'text-outline-color': '#0ea5e9',
            'text-outline-width': 1,
          }
        },
        {
          selector: 'node[kind="IP"]',
          style: { 'background-color': '#ef4444', 'border-color': '#f87171' }
        },
        {
          selector: 'node[kind="DOMAIN"]',
          style: { 'background-color': '#10b981', 'border-color': '#34d399' }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#334155',
            'target-arrow-color': '#334155',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(relation)',
            'font-size': '8px',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#fff',
            'border-width': 4,
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        padding: 50,
      }
    });

    cyRef.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      onNodeClick?.(node.id());
    });

    return () => {
      cyRef.current?.destroy();
    };
  }, [elements, onNodeClick]);

  return (
    <div className="w-full h-full relative glass-panel overflow-hidden border-primary/20">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-black/50 border border-primary/30 text-primary rounded">
          Entity Relations Graph
        </div>
      </div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
