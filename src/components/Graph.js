import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CosmographProvider, Cosmograph, CosmographSearch } from '@cosmograph/react';
import { loadGraphData } from '../loadGraphData';
import './Graph.css';

const formatUsdMillions = (value) => {
  if (!value) return '—';
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}B`;
  return `$${value.toFixed(2)}M`;
};

const Graph = () => {
  const cosmographRef = useRef(null);
  const searchRef = useRef(null);
  const fittedRef = useRef(false);
  const companyMetaRef = useRef(new Map());
  const [graphData, setGraphData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadGraphData()
      .then((payload) => {
        const companyMeta = new Map();
        const nodes = payload.nodes.map((node) => {
          if (node.type === 'company') {
            companyMeta.set(node.id, {
              funding: node.vc || 0,
              lastFunding: node.date || '',
            });
          }
          return {
            id: node.id,
            label: node.label,
            type: node.type,
            color: node.color,
            size: node.size,
            count: node.count || 0,
          };
        });
        companyMetaRef.current = companyMeta;
        setGraphData({
          stats: payload.stats,
          nodes,
          links: payload.links,
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  const { nodeById, neighbors } = useMemo(() => {
    const nextNodeById = new Map();
    const nextNeighbors = new Map();
    if (!graphData) {
      return { nodeById: nextNodeById, neighbors: nextNeighbors };
    }
    graphData.nodes.forEach((node) => nextNodeById.set(node.id, node));
    graphData.links.forEach((link) => {
      if (!nextNeighbors.has(link.source)) nextNeighbors.set(link.source, []);
      if (!nextNeighbors.has(link.target)) nextNeighbors.set(link.target, []);
      nextNeighbors.get(link.source).push(link.target);
      nextNeighbors.get(link.target).push(link.source);
    });
    return { nodeById: nextNodeById, neighbors: nextNeighbors };
  }, [graphData]);

  const labelNodes = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes
      .filter((node) => node.type === 'industry')
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 60);
  }, [graphData]);

  const accessors = [{ label: 'Name', accessor: (node) => node.label }];

  const companyFunding = (node) => companyMetaRef.current.get(node.id)?.funding || 0;
  const companyLastFunding = (node) => companyMetaRef.current.get(node.id)?.lastFunding || '';

  const connectedDetails = (node) => {
    const ids = neighbors.get(node.id) || [];
    const connected = ids.map((id) => nodeById.get(id)).filter(Boolean);
    if (node.type === 'industry') {
      return [...connected].sort((a, b) => companyFunding(b) - companyFunding(a));
    }
    return connected;
  };

  const highlightNode = (node) => {
    if (!cosmographRef.current || !node) return;
    const connected = connectedDetails(node);
    const highlight = [node, ...connected.slice(0, 40)];
    cosmographRef.current.selectNodes(highlight, true);
    cosmographRef.current.zoomToNode(node);
  };

  const handleNodeClick = (clickedNode) => {
    if (!clickedNode) {
      clearSelection();
      return;
    }
    setSelectedNode(clickedNode);
    setSidebarOpen(true);
    highlightNode(clickedNode);
  };

  const clearSelection = () => {
    setSelectedNode(null);
    cosmographRef.current?.unselectNodes();
    cosmographRef.current?.fitView();
  };

  if (error) {
    return (
      <div className="status-screen">
        <h1>Could not load the industry graph</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="status-screen">
        <h1>Companies by industry</h1>
        <p>Loading graph…</p>
      </div>
    );
  }

  return (
    <div className="graph-shell">
      <CosmographProvider nodes={graphData.nodes} links={graphData.links}>
        <div className="graph-canvas">
          <div className="graph-hud">
            <h1>Companies by industry</h1>
            <p>
              {graphData.stats.companies.toLocaleString()} companies ·{' '}
              {graphData.stats.industries.toLocaleString()} industries · click a
              node, scroll to zoom
            </p>
          </div>
          <Cosmograph
            ref={cosmographRef}
            nodes={graphData.nodes}
            links={graphData.links}
            backgroundColor="#0b0d10"
            nodeColor={(node) => (node.type === 'industry' ? '#ffcc33' : node.color)}
            nodeSize={(node) =>
              node.type === 'industry' ? Math.max(14, node.size * 1.45) : Math.max(2.2, node.size * 0.9)
            }
            nodeGreyoutOpacity={0.04}
            linkColor="#3a4555"
            linkWidth={0.15}
            linkWidthScale={0.7}
            linkGreyoutOpacity={0.03}
            linkArrows={false}
            curvedLinks={false}
            hoveredNodeRingColor="#ffffff"
            focusedNodeRingColor="#ffe08a"
            nodeLabelAccessor={(node) => node.label}
            nodeLabelColor={() => '#f2f4f7'}
            showHoveredNodeLabel
            showLabelsFor={labelNodes}
            showDynamicLabels={false}
            showTopLabels
            showTopLabelsLimit={25}
            showTopLabelsValueKey="size"
            simulationRepulsion={3.2}
            simulationRepulsionTheta={1.05}
            simulationLinkSpring={0.12}
            simulationLinkDistance={36}
            simulationGravity={0.06}
            simulationCenter={0.01}
            simulationFriction={0.84}
            simulationDecay={700}
            useQuadtree
            spaceSize={8192}
            pixelRatio={2}
            initialZoomLevel={0.55}
            onClick={handleNodeClick}
            onSimulationEnd={() => {
              if (!fittedRef.current && cosmographRef.current) {
                fittedRef.current = true;
                cosmographRef.current.fitView();
              }
            }}
          />
          {!sidebarOpen && (
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              Search
            </button>
          )}
        </div>
        <aside className={`graph-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <span>Search</span>
            <button
              type="button"
              className="sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              Close
            </button>
          </div>
          <div className="search-wrap">
            <CosmographSearch
              ref={searchRef}
              accessors={accessors}
              activeAccessorIndex={activeIndex}
              onAccessorSelect={(accessor) => setActiveIndex(accessors.indexOf(accessor))}
              maxVisibleItems={40}
              truncateValues={48}
              placeholder="Search companies or industries"
              onSelectResult={(node) => handleNodeClick(node)}
            />
          </div>
          <button type="button" onClick={() => searchRef.current?.clearInput()}>
            Clear search
          </button>
          <button type="button" onClick={clearSelection}>
            Reset view
          </button>
          {selectedNode && (
            <div className="side-panel">
              <h2>{selectedNode.label}</h2>
              <p>{selectedNode.type === 'industry' ? 'Industry' : 'Company'}</p>
              {selectedNode.type === 'company' && (
                <>
                  <p>Funding: {formatUsdMillions(companyFunding(selectedNode))}</p>
                  <p>Last funding: {companyLastFunding(selectedNode) || '—'}</p>
                </>
              )}
              {selectedNode.type === 'industry' && (
                <p>Companies: {(selectedNode.count || 0).toLocaleString()}</p>
              )}
              <h3>
                {selectedNode.type === 'industry' ? 'Companies' : 'Industries'}
              </h3>
              <ul>
                {connectedDetails(selectedNode)
                  .slice(0, 25)
                  .map((node) => (
                    <li key={node.id}>
                      {node.label}
                      {node.type === 'company' && companyFunding(node)
                        ? ` · ${formatUsdMillions(companyFunding(node))}`
                        : ''}
                    </li>
                  ))}
              </ul>
              <button type="button" onClick={clearSelection}>
                Clear selection
              </button>
            </div>
          )}
        </aside>
      </CosmographProvider>
    </div>
  );
};

export default Graph;
