const db = require('../store/db');
const { fuzzyWordMatch } = require('../utils/similarity');

// ─── Nexus Detector — Corruption Network Graph ────────────────────────────────
// Builds a directed graph: MP → Agency → Location
// Detects patterns:
//   1. Exclusive dealing: Agency wins > 80% of one MP's contracts
//   2. Shell clustering: Agencies sharing address or director names
//   3. Triangle patterns: Same MP → Agency → same Location repeatedly

function buildNexusGraph() {
  const projects = db.getAll('projects');
  const mps = db.getAll('mps');
  const agencies = db.getAll('agencies');

  const nodes = [];
  const edges = [];
  const suspiciousPatterns = [];

  // ── Build MP nodes ─────────────────────────────────────────────────────────
  mps.forEach(mp => {
    nodes.push({
      id: mp.id,
      type: 'MP',
      label: mp.name,
      subLabel: mp.constituency,
      state: mp.state,
      party: mp.party,
    });
  });

  // ── Build Agency nodes ─────────────────────────────────────────────────────
  agencies.forEach(agency => {
    nodes.push({
      id: agency.id,
      type: 'AGENCY',
      label: agency.name,
      subLabel: agency.category,
      trustScore: agency.trustScore,
      fraudFlags: agency.fraudFlags,
      shellAlert: agency.shellAlert || false,
    });
  });

  // ── Build Location nodes (district-level clusters) ─────────────────────────
  const locationMap = {};
  projects.forEach(p => {
    const locKey = `${p.district}_${p.state}`;
    if (!locationMap[locKey]) {
      locationMap[locKey] = {
        id: `loc_${locKey.replace(/\s+/g, '_')}`,
        type: 'LOCATION',
        label: p.district,
        subLabel: p.state,
        projectCount: 0,
        totalBudget: 0,
      };
      nodes.push(locationMap[locKey]);
    }
    locationMap[locKey].projectCount++;
    locationMap[locKey].totalBudget += p.budget;
  });

  // ── Build Edges: MP → Agency (project award relationships) ────────────────
  const mpAgencyCount = {};
  const mpTotalCount = {};
  const agencyLocationCount = {};

  projects.forEach(p => {
    const locKey = `${p.district}_${p.state}`;
    const locId = locationMap[locKey]?.id;

    // MP → Agency edge
    const mpAgKey = `${p.mpId}_${p.agencyId}`;
    mpAgencyCount[mpAgKey] = (mpAgencyCount[mpAgKey] || 0) + 1;
    mpTotalCount[p.mpId] = (mpTotalCount[p.mpId] || 0) + 1;

    // Agency → Location edge
    const agLocKey = `${p.agencyId}_${locId}`;
    agencyLocationCount[agLocKey] = (agencyLocationCount[agLocKey] || 0) + 1;

    // Add edge: Agency → Location
    if (locId) {
      const existingEdge = edges.find(e => e.source === p.agencyId && e.target === locId);
      if (existingEdge) {
        existingEdge.weight++;
        existingEdge.budget += p.budget;
      } else {
        edges.push({
          id: `e_${p.agencyId}_${locId}`,
          source: p.agencyId,
          target: locId,
          type: 'EXECUTES_IN',
          weight: 1,
          budget: p.budget,
          suspicious: false,
        });
      }
    }
  });

  // ── MP → Agency edges with exclusive dealing detection ────────────────────
  Object.entries(mpAgencyCount).forEach(([key, count]) => {
    const [mpId, agencyId] = key.split('_');
    const total = mpTotalCount[mpId] || 1;
    const exclusivityRatio = count / total;

    const isExclusive = exclusivityRatio > 0.7 && count >= 2;
    const isSuspicious = isExclusive;

    const existingEdge = edges.find(e => e.source === mpId && e.target === agencyId);
    if (existingEdge) {
      existingEdge.weight += count;
      existingEdge.suspicious = isSuspicious;
    } else {
      edges.push({
        id: `e_${mpId}_${agencyId}`,
        source: mpId,
        target: agencyId,
        type: 'AWARDS_TO',
        weight: count,
        exclusivityRatio: Math.round(exclusivityRatio * 100),
        suspicious: isSuspicious,
        budget: projects.filter(p => p.mpId === mpId && p.agencyId === agencyId).reduce((s, p) => s + p.budget, 0),
      });
    }

    if (isExclusive) {
      const mp = mps.find(m => m.id === mpId);
      const agency = agencies.find(a => a.id === agencyId);
      suspiciousPatterns.push({
        type: 'EXCLUSIVE_DEALING',
        severity: exclusivityRatio > 0.9 ? 'HIGH' : 'MEDIUM',
        description: `${mp?.name || mpId} awarded ${Math.round(exclusivityRatio * 100)}% of their contracts (${count}/${total}) to "${agency?.name || agencyId}" — no competitive variation.`,
        entities: [mpId, agencyId],
        totalAmount: projects.filter(p => p.mpId === mpId && p.agencyId === agencyId).reduce((s, p) => s + p.budget, 0),
      });
    }
  });

  // ── Shell Entity Clustering ───────────────────────────────────────────────
  for (let i = 0; i < agencies.length; i++) {
    for (let j = i + 1; j < agencies.length; j++) {
      const a = agencies[i];
      const b = agencies[j];

      const sameAddress = a.registeredAddress === b.registeredAddress;
      const directorSim = fuzzyWordMatch(a.director, b.director, 0.75);
      const isShellCluster = sameAddress || directorSim > 0.7;

      if (isShellCluster) {
        // Mark both nodes
        const nodeA = nodes.find(n => n.id === a.id);
        const nodeB = nodes.find(n => n.id === b.id);
        if (nodeA) nodeA.shellAlert = true;
        if (nodeB) nodeB.shellAlert = true;

        edges.push({
          id: `e_shell_${a.id}_${b.id}`,
          source: a.id,
          target: b.id,
          type: 'SHELL_CLUSTER',
          weight: 3,
          suspicious: true,
          budget: 0,
          reason: sameAddress ? 'Shared registered address' : `Director name similarity: ${Math.round(directorSim * 100)}%`,
        });

        suspiciousPatterns.push({
          type: 'SHELL_ENTITY_CLUSTER',
          severity: 'HIGH',
          description: `"${a.name}" and "${b.name}" share the same registered address or director — potential shell entity network for split-bidding.`,
          entities: [a.id, b.id],
          reason: sameAddress ? `Identical address: ${a.registeredAddress}` : `Director match: "${a.director}" ~ "${b.director}"`,
          totalAmount: 0,
        });
      }
    }
  }

  // ── Triangle detection (MP → Agency → Location → repeat) ─────────────────
  const mpLocationProjects = {};
  projects.forEach(p => {
    const locKey = `${p.district}_${p.state}`;
    const key = `${p.mpId}_${p.agencyId}_${locKey}`;
    mpLocationProjects[key] = (mpLocationProjects[key] || 0) + 1;
  });
  Object.entries(mpLocationProjects).forEach(([key, count]) => {
    if (count >= 2) {
      const [mpId, agencyId, ...locParts] = key.split('_');
      const mp = mps.find(m => m.id === mpId);
      const agency = agencies.find(a => a.id === agencyId);
      suspiciousPatterns.push({
        type: 'GEOGRAPHIC_TRIANGLE',
        severity: 'MEDIUM',
        description: `${count} projects from "${mp?.name}" to "${agency?.name}" all concentrated in the same district — geographic lock-in pattern.`,
        entities: [mpId, agencyId],
        totalAmount: projects.filter(p => p.mpId === mpId && p.agencyId === agencyId).reduce((s, p) => s + p.budget, 0),
      });
    }
  });

  return {
    nodes,
    edges,
    suspiciousPatterns,
    summary: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      suspiciousEdges: edges.filter(e => e.suspicious).length,
      highSeverityPatterns: suspiciousPatterns.filter(p => p.severity === 'HIGH').length,
    }
  };
}

module.exports = { buildNexusGraph };
