import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const NODE_COLORS = {
  MP: '#4f46e5',
  AGENCY: '#f59e0b',
  LOCATION: '#10b981',
  SUBCONTRACTOR: '#f43f5e',
};

const EDGE_COLORS = {
  AWARDS_TO: '#4f46e5',
  EXECUTES_IN: '#10b981',
  SHELL_CLUSTER: '#f43f5e',
};

export default function NexusGraph({ data, onNodeClick, height = 600 }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || !data.nodes || !data.edges || !svgRef.current) return;

    const width = containerRef.current?.offsetWidth || 900;
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('border-radius', '16px')
      .style('overflow', 'hidden');

    // Background
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'var(--text-primary)');

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges).id(d => d.id).distance(d => d.type === 'SHELL_CLUSTER' ? 80 : 150).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    // Defs: arrow markers
    const defs = svg.append('defs');
    ['normal', 'suspicious'].forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 28).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', type === 'suspicious' ? '#f43f5e' : '#4b5563');
    });

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Edges
    const link = g.append('g').selectAll('line')
      .data(data.edges)
      .join('line')
      .attr('stroke', d => d.suspicious ? '#f43f5e' : (EDGE_COLORS[d.type] || '#4b5563'))
      .attr('stroke-width', d => d.suspicious ? Math.max(2, Math.min(6, d.weight)) : Math.max(1, Math.min(4, d.weight)))
      .attr('stroke-opacity', d => d.suspicious ? 0.8 : 0.4)
      .attr('stroke-dasharray', d => d.type === 'SHELL_CLUSTER' ? '6,3' : null)
      .attr('marker-end', d => `url(#arrow-${d.suspicious ? 'suspicious' : 'normal'})`);

    // Edge labels
    const edgeLabels = g.append('g').selectAll('text')
      .data(data.edges.filter(e => e.suspicious))
      .join('text')
      .attr('font-size', 9)
      .attr('fill', '#f43f5e')
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .text(d => d.type === 'SHELL_CLUSTER' ? '🔴 Shell' : d.exclusivityRatio ? `${d.exclusivityRatio}% exclusive` : '');

    // Nodes group
    const node = g.append('g').selectAll('g')
      .data(data.nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (event, d) => { event.stopPropagation(); onNodeClick?.(d); });

    // Node circles
    node.append('circle')
      .attr('r', d => d.type === 'MP' ? 24 : d.type === 'AGENCY' ? 20 : 16)
      .attr('fill', d => `${NODE_COLORS[d.type] || 'var(--text-secondary)'}22`)
      .attr('stroke', d => {
        if (d.shellAlert) return '#f43f5e';
        return NODE_COLORS[d.type] || 'var(--text-secondary)';
      })
      .attr('stroke-width', d => d.shellAlert ? 3 : 2)
      .attr('filter', d => d.shellAlert ? 'url(#glow)' : null);

    // Node icons
    node.append('text')
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', d => d.type === 'MP' ? 16 : 14)
      .text(d => d.type === 'MP' ? '🏛️' : d.type === 'AGENCY' ? '🔧' : d.type === 'LOCATION' ? '📍' : '🏭');

    // Node labels
    node.append('text')
      .attr('text-anchor', 'middle').attr('y', d => (d.type === 'MP' ? 24 : d.type === 'AGENCY' ? 20 : 16) + 14)
      .attr('font-size', d => d.type === 'MP' ? 10 : 9)
      .attr('font-weight', '600')
      .attr('fill', d => NODE_COLORS[d.type] || 'var(--text-secondary)')
      .attr('font-family', 'Inter, sans-serif')
      .text(d => d.label.length > 18 ? d.label.slice(0, 16) + '…' : d.label);

    // Shell alert rings
    node.filter(d => d.shellAlert)
      .append('circle')
      .attr('r', d => (d.type === 'MP' ? 24 : 20) + 6)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.6);

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);

      edgeLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [data, height]);

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
      <svg ref={svgRef} style={{ display: 'block', width: '100%' }} />

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        background: 'rgba(255, 255, 255,0.9)', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 16, flexWrap: 'wrap',
      }}>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{type}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #f43f5e' }} />
          <span style={{ color: '#dc2626' }}>Shell Alert</span>
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        background: 'rgba(255, 255, 255,0.8)', border: '1px solid #e2e8f0',
        borderRadius: 8, padding: '6px 12px', fontSize: 11, color: '#64748b',
      }}>
        🖱️ Drag • Scroll to zoom • Click node for details
      </div>
    </div>
  );
}

