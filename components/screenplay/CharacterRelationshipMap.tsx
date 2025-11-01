'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { Character, Scene } from '@/types/screenplay';
import { X } from 'lucide-react';

interface CharacterNode {
  id: string;
  name: string;
  type: 'lead' | 'supporting' | 'minor';
  x: number;
  y: number;
  connections: string[];
}

interface CharacterRelationshipMapProps {
  onClose?: () => void;
}

export default function CharacterRelationshipMap({ onClose }: CharacterRelationshipMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<CharacterNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const screenplay = useScreenplay();

  useEffect(() => {
    // Get all scenes from all beats
    const allScenes: Scene[] = [];
    screenplay.beats.forEach(beat => {
      allScenes.push(...beat.scenes);
    });
    
    const characters = screenplay.characters;
    const scenes = allScenes;

    // Build connection graph
    const characterNodes: CharacterNode[] = characters.map((char: Character, index: number) => {
      // Find which other characters this character shares scenes with
      const sharedScenes = scenes.filter((scene: Scene) =>
        scene.fountain.tags.characters.includes(char.id)
      );

      const connections = new Set<string>();
      sharedScenes.forEach((scene: Scene) => {
        scene.fountain.tags.characters.forEach((charId: string) => {
          if (charId !== char.id) {
            connections.add(charId);
          }
        });
      });

      // Position nodes in a circle
      const angle = (index / characters.length) * 2 * Math.PI;
      const radius = Math.min(250, 100 + characters.length * 20);
      const centerX = 400;
      const centerY = 300;

      return {
        id: char.id,
        name: char.name,
        type: char.type,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        connections: Array.from(connections),
      };
    });

    setNodes(characterNodes);
  }, [screenplay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections first (behind nodes)
    ctx.strokeStyle = '#3C3C3E';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

    nodes.forEach(node => {
      node.connections.forEach(connectedId => {
        const connectedNode = nodes.find(n => n.id === connectedId);
        if (connectedNode) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connectedNode.x, connectedNode.y);
          ctx.stroke();
        }
      });
    });

    ctx.globalAlpha = 1;

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const nodeRadius = isHovered ? 45 : 40;

      // Node color based on type
      const colors = {
        lead: '#14B8A6',
        supporting: '#F59E0B',
        minor: '#6B7280',
      };

      // Draw node circle
      ctx.fillStyle = colors[node.type];
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw node border
      if (isHovered) {
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw node label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isHovered ? 'bold 13px -apple-system' : '12px -apple-system';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Split name if too long
      const maxWidth = nodeRadius * 1.8;
      const words = node.name.split(' ');
      if (words.length > 1 && ctx.measureText(node.name).width > maxWidth) {
        ctx.fillText(words[0], node.x, node.y - 6);
        ctx.fillText(words[1], node.x, node.y + 6);
      } else {
        ctx.fillText(node.name, node.x, node.y);
      }
    });
  }, [nodes, hoveredNode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if hovering over a node
    const hoveredNode = nodes.find(node => {
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance < 40;
    });

    setHoveredNode(hoveredNode ? hoveredNode.id : null);
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

  const getConnectionCount = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.connections.length : 0;
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#1C1C1E' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#2C2C2E' }}>
        <h2 className="text-lg font-semibold" style={{ color: '#E5E7EB' }}>
          Character Relationship Map
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-zinc-800"
            style={{ color: '#9CA3AF' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 p-4 border-b" style={{ borderColor: '#2C2C2E' }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#14B8A6' }} />
          <span className="text-sm" style={{ color: '#D1D5DB' }}>Lead</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
          <span className="text-sm" style={{ color: '#D1D5DB' }}>Supporting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6B7280' }} />
          <span className="text-sm" style={{ color: '#D1D5DB' }}>Minor</span>
        </div>
        <div className="ml-auto text-sm" style={{ color: '#9CA3AF' }}>
          Hover over characters to highlight connections
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-8">
        {nodes.length === 0 ? (
          <div className="text-center" style={{ color: '#6B7280' }}>
            <p className="text-sm">No characters to display</p>
            <p className="text-xs mt-2">Add characters to see their relationships</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="rounded-lg"
            style={{ backgroundColor: '#141415' }}
          />
        )}
      </div>

      {/* Character List */}
      <div className="p-4 border-t" style={{ borderColor: '#2C2C2E' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#E5E7EB' }}>
          Characters & Connections
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {nodes.map(node => (
            <div
              key={node.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{
                backgroundColor: hoveredNode === node.id ? '#252527' : '#1C1C1E',
                borderLeft: `3px solid ${
                  node.type === 'lead' ? '#14B8A6' : node.type === 'supporting' ? '#F59E0B' : '#6B7280'
                }`,
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <span className="text-sm font-medium" style={{ color: '#E5E7EB' }}>
                {node.name}
              </span>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>
                {getConnectionCount(node.id)} connections
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

