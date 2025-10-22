import React from 'react';
import type { HierarchyNode } from './hierarchy-utils';

interface RegionMiniMapProps {
  region: string;
  markets: HierarchyNode[];
}

// Simplified US region paths for mini visualization
const REGION_PATHS = {
  'Northeast': 'M 70 15 L 95 10 L 98 35 L 85 40 L 70 30 Z',
  'South': 'M 30 45 L 85 40 L 90 75 L 50 80 L 30 65 Z',
  'Midwest': 'M 35 15 L 70 15 L 70 45 L 30 45 Z',
  'West': 'M 5 10 L 35 15 L 30 65 L 5 70 Z'
};

// Approximate coordinates for major cities/markets within regions
const MARKET_POSITIONS: Record<string, { x: number; y: number }> = {
  // Northeast
  'Boston': { x: 85, y: 20 },
  'New York': { x: 80, y: 28 },
  'Philadelphia': { x: 78, y: 32 },
  'Pittsburgh': { x: 72, y: 30 },
  'Buffalo': { x: 75, y: 25 },
  
  // South
  'Atlanta': { x: 65, y: 58 },
  'Miami': { x: 75, y: 75 },
  'Dallas': { x: 45, y: 60 },
  'Houston': { x: 42, y: 65 },
  'Nashville': { x: 60, y: 52 },
  'Charlotte': { x: 70, y: 55 },
  'Orlando': { x: 73, y: 70 },
  'Tampa': { x: 71, y: 72 },
  'New Orleans': { x: 55, y: 68 },
  'Memphis': { x: 57, y: 55 },
  
  // Midwest
  'Chicago': { x: 55, y: 28 },
  'Detroit': { x: 62, y: 26 },
  'Minneapolis': { x: 48, y: 20 },
  'St. Louis': { x: 52, y: 35 },
  'Kansas City': { x: 45, y: 36 },
  'Milwaukee': { x: 54, y: 25 },
  'Indianapolis': { x: 58, y: 32 },
  'Columbus': { x: 60, y: 30 },
  'Cleveland': { x: 63, y: 28 },
  
  // West
  'Los Angeles': { x: 8, y: 55 },
  'San Francisco': { x: 5, y: 38 },
  'Seattle': { x: 7, y: 15 },
  'Phoenix': { x: 15, y: 58 },
  'Denver': { x: 25, y: 35 },
  'Las Vegas': { x: 12, y: 50 },
  'Portland': { x: 6, y: 20 },
  'San Diego': { x: 9, y: 60 },
  'Salt Lake City': { x: 18, y: 32 },
};

// Get position for a market (with fallback)
const getMarketPosition = (marketName: string): { x: number; y: number } => {
  // Try exact match first
  if (MARKET_POSITIONS[marketName]) {
    return MARKET_POSITIONS[marketName];
  }
  
  // Try to find by partial match
  const lowerName = marketName.toLowerCase();
  for (const [key, pos] of Object.entries(MARKET_POSITIONS)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return pos;
    }
  }
  
  // Fallback to random position within region bounds
  const regionBounds = {
    'Northeast': { minX: 70, maxX: 95, minY: 10, maxY: 40 },
    'South': { minX: 30, maxX: 85, minY: 45, maxY: 80 },
    'Midwest': { minX: 35, maxX: 70, minY: 15, maxY: 45 },
    'West': { minX: 5, maxX: 35, minY: 10, maxY: 70 }
  };
  
  // Default to center if no region match
  return { 
    x: 50 + (Math.random() - 0.5) * 20, 
    y: 40 + (Math.random() - 0.5) * 20 
  };
};

// Get circle radius based on DSP count
const getRadius = (dspCount: number): number => {
  if (dspCount >= 100) return 4;
  if (dspCount >= 50) return 3.5;
  if (dspCount >= 20) return 3;
  if (dspCount >= 10) return 2.5;
  return 2;
};

// Get color based on performance
const getColor = (performance: number): string => {
  if (performance >= 80) return '#10b981'; // green-500
  if (performance >= 60) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
};

export default function RegionMiniMap({ region, markets }: RegionMiniMapProps) {
  const regionPath = REGION_PATHS[region] || REGION_PATHS['Northeast'];
  
  return (
    <svg 
      viewBox="0 0 100 85" 
      className="w-24 h-16"
      style={{ minWidth: '96px' }}
    >
      {/* Background */}
      <rect width="100" height="85" fill="#f9fafb" rx="4" />
      
      {/* Region outline */}
      <path 
        d={regionPath} 
        fill="#e5e7eb" 
        stroke="#d1d5db"
        strokeWidth="0.5"
        opacity="0.5"
      />
      
      {/* Market dots */}
      {markets.slice(0, 10).map((market, index) => {
        const position = getMarketPosition(market.name);
        const radius = getRadius(market.metrics.dspCount);
        const color = getColor(market.metrics.performance);
        
        return (
          <g key={market.id}>
            {/* Outer glow */}
            <circle
              cx={position.x}
              cy={position.y}
              r={radius + 1}
              fill={color}
              opacity="0.2"
            />
            {/* Main dot */}
            <circle
              cx={position.x}
              cy={position.y}
              r={radius}
              fill={color}
              opacity="0.8"
              className="transition-all duration-200 hover:opacity-100"
            >
              <title>
                {market.name}: {market.metrics.dspCount} DSPs
              </title>
            </circle>
          </g>
        );
      })}
      
      {/* Show indicator if there are more markets */}
      {markets.length > 10 && (
        <text
          x="92"
          y="80"
          fontSize="8"
          fill="#6b7280"
          textAnchor="end"
        >
          +{markets.length - 10}
        </text>
      )}
    </svg>
  );
}