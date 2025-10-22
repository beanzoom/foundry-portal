import type { Market, Station, DSP } from '@/types/contact-tracking';

export interface HierarchyNode {
  id: string;
  type: 'region' | 'market' | 'station' | 'dsp';
  name: string;
  code?: string;
  parentName?: string;
  metrics: {
    dspCount: number;
    stationCount?: number; // For regions and markets
    contactCount: number;
    activeCount: number;
  };
  children?: HierarchyNode[];
  expanded?: boolean;
  selected?: boolean;
  rawData?: Market | Station | DSP;
}

interface RegionData {
  name: string;
  states: string[];
}

// Helper function to get region from state code
const getRegionFromState = (stateCode: string, regions: Record<string, RegionData>): string | null => {
  const upperState = stateCode.toUpperCase();
  for (const [code, region] of Object.entries(regions)) {
    if (region.states.includes(upperState)) {
      return code;
    }
  }
  return null;
};


// Build the complete hierarchy tree
export function buildHierarchyTree(
  markets: Market[],
  stations: Station[],
  dsps: DSP[],
  regions: Record<string, RegionData>
): HierarchyNode[] {
  // Group markets by region using region_id or region data
  const marketsByRegion = new Map<string, Market[]>();
  const unassignedMarkets: Market[] = [];
  
  markets.forEach(market => {
    let regionCode: string | null = null;
    
    // First check if market has explicit region data
    if (market.region?.code) {
      regionCode = market.region.code;
    } else if (market.region_id) {
      // TEMPORARY: Force all markets with region_id to Midwest
      // TODO: Properly map region_id UUID to region code
      regionCode = 'MW';
    } else if (market.primary_state || market.states?.length) {
      // Fallback to state-based assignment
      const state = market.primary_state || market.states?.[0] || '';
      regionCode = getRegionFromState(state, regions);
    }
    
    if (regionCode && regions[regionCode]) {
      if (!marketsByRegion.has(regionCode)) {
        marketsByRegion.set(regionCode, []);
      }
      marketsByRegion.get(regionCode)!.push(market);
    } else {
      // If no region found, add to unassigned
      unassignedMarkets.push(market);
    }
  });
  
  // Group stations by market
  const stationsByMarket = new Map<string, Station[]>();
  stations.forEach(station => {
    if (station.market_id) {
      if (!stationsByMarket.has(station.market_id)) {
        stationsByMarket.set(station.market_id, []);
      }
      stationsByMarket.get(station.market_id)!.push(station);
    }
  });
  
  // Group DSPs by station
  const dspsByStation = new Map<string, DSP[]>();
  dsps.forEach(dsp => {
    if (dsp.station_id) {
      if (!dspsByStation.has(dsp.station_id)) {
        dspsByStation.set(dsp.station_id, []);
      }
      dspsByStation.get(dsp.station_id)!.push(dsp);
    }
  });
  
  // Build the tree
  const tree: HierarchyNode[] = [];
  
  // Process each region (including empty ones)
  Object.entries(regions).forEach(([regionCode, regionData]) => {
    const regionMarkets = marketsByRegion.get(regionCode) || [];
    
    // Calculate region metrics
    let regionDspCount = 0;
    let regionContactCount = 0;
    let regionActiveCount = 0;
    let regionStationCount = 0;
    
    // Build market nodes
    const marketNodes: HierarchyNode[] = regionMarkets.map(market => {
      const marketStations = stationsByMarket.get(market.id) || [];
      
      // Calculate market metrics
      let marketDspCount = 0;
      let marketContactCount = 0;
      let marketActiveCount = 0;
      const marketStationCount = marketStations.length;
      
      // Build station nodes
      const stationNodes: HierarchyNode[] = marketStations.map(station => {
        const stationDsps = dspsByStation.get(station.id) || [];
        
        // Calculate station metrics
        const stationContactCount = stationDsps.reduce((sum, dsp) => sum + (dsp.contact_count || 0), 0);
        const stationActiveCount = stationDsps.filter(dsp => dsp.is_active).length;
        
        // Build DSP nodes
        const dspNodes: HierarchyNode[] = stationDsps.map(dsp => ({
          id: `dsp-${dsp.id}`,
          type: 'dsp' as const,
          name: dsp.dsp_name || 'Unnamed DSP',
          code: dsp.dsp_code,
          parentName: station.name || `${station.station_code} - ${station.city}`,
          metrics: {
            dspCount: 0, // DSPs don't have sub-DSPs
            contactCount: dsp.contact_count || 0,
            activeCount: dsp.is_active ? 1 : 0,
          },
          rawData: dsp
        }));
        
        marketDspCount += stationDsps.length;
        marketContactCount += stationContactCount;
        marketActiveCount += stationActiveCount;
        
        return {
          id: `station-${station.id}`,
          type: 'station' as const,
          name: station.name || `${station.station_code} - ${station.city}`,
          code: station.station_code,
          parentName: market.name,
          metrics: {
            dspCount: stationDsps.length,
            contactCount: stationContactCount,
            activeCount: stationActiveCount,
          },
          children: dspNodes,
          rawData: station
        };
      });
      
      regionDspCount += marketDspCount;
      regionContactCount += marketContactCount;
      regionActiveCount += marketActiveCount;
      regionStationCount += marketStationCount;
      
      return {
        id: `market-${market.id}`,
        type: 'market' as const,
        name: market.name,
        code: market.code,
        parentName: regionData.name,
        metrics: {
          dspCount: marketDspCount,
          stationCount: marketStationCount,
          contactCount: marketContactCount,
          activeCount: marketActiveCount,
        },
        children: stationNodes,
        rawData: market
      };
    });
    
    // Add all regions (even if empty)
    tree.push({
      id: `region-${regionCode}`,
      type: 'region' as const,
      name: regionData.name,
      code: regionCode,
      metrics: {
        dspCount: regionDspCount,
        stationCount: regionStationCount,
        contactCount: regionContactCount,
        activeCount: regionActiveCount
      },
      children: marketNodes
    });
  });
  
  
  // Sort regions by most data first, then alphabetically
  tree.sort((a, b) => {
    // First sort by total DSP count (descending)
    const countDiff = b.metrics.dspCount - a.metrics.dspCount;
    if (countDiff !== 0) return countDiff;
    
    // If equal, sort alphabetically
    return a.name.localeCompare(b.name);
  });
  
  return tree;
}

// Search function to find nodes matching a query
export function searchHierarchy(
  nodes: HierarchyNode[],
  query: string
): HierarchyNode[] {
  const lowerQuery = query.toLowerCase();
  const results: HierarchyNode[] = [];
  
  const searchNode = (node: HierarchyNode, ancestors: HierarchyNode[] = []): void => {
    const matches = 
      node.name.toLowerCase().includes(lowerQuery) ||
      (node.code && node.code.toLowerCase().includes(lowerQuery));
    
    if (matches) {
      // Include all ancestors to maintain hierarchy
      let current = results;
      for (const ancestor of ancestors) {
        let found = current.find(n => n.id === ancestor.id);
        if (!found) {
          found = { ...ancestor, children: [] };
          current.push(found);
        }
        current = found.children!;
      }
      
      current.push({ ...node, expanded: true });
    }
    
    // Continue searching children
    if (node.children) {
      node.children.forEach(child => searchNode(child, [...ancestors, node]));
    }
  };
  
  nodes.forEach(node => searchNode(node));
  return results;
}

// Get all node IDs for expand/collapse all
export function getAllNodeIds(nodes: HierarchyNode[]): Set<string> {
  const ids = new Set<string>();
  
  const collectIds = (node: HierarchyNode): void => {
    ids.add(node.id);
    if (node.children) {
      node.children.forEach(collectIds);
    }
  };
  
  nodes.forEach(collectIds);
  return ids;
}

// Calculate total metrics for a node and its children
export function calculateTotalMetrics(node: HierarchyNode): {
  totalDsps: number;
  totalContacts: number;
  totalActive: number;
} {
  let totalDsps = node.type === 'dsp' ? 1 : 0;
  let totalContacts = node.metrics.contactCount;
  let totalActive = node.metrics.activeCount;
  
  if (node.children) {
    node.children.forEach(child => {
      const childMetrics = calculateTotalMetrics(child);
      totalDsps += childMetrics.totalDsps;
      totalContacts += childMetrics.totalContacts;
      totalActive += childMetrics.totalActive;
    });
  }
  
  return { totalDsps, totalContacts, totalActive };
}