import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  MapPin, 
  Building2, 
  Package, 
  Globe,
  Users,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RegionMiniMap from './RegionMiniMap';
import type { HierarchyNode } from './hierarchy-utils';

interface HierarchyCardProps {
  node: HierarchyNode;
  level?: number;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  expandedNodes: Set<string>;
  selectedNode: string | null;
}

export default function HierarchyCard({ 
  node, 
  level = 0, 
  onToggle, 
  onSelect,
  expandedNodes,
  selectedNode
}: HierarchyCardProps) {
  const indent = level * 32;
  const isExpanded = expandedNodes.has(node.id) || node.expanded;
  const isSelected = selectedNode === node.id;
  const hasChildren = node.children && node.children.length > 0;
  
  // Get icon based on type
  const getIcon = () => {
    switch(node.type) {
      case 'region':
        return <Globe className="h-4 w-4 text-blue-500" />;
      case 'market':
        return <MapPin className="h-4 w-4 text-green-500" />;
      case 'station':
        return <Building2 className="h-4 w-4 text-orange-500" />;
      case 'dsp':
        return <Package className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };
  
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.id);
    }
  };
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };
  
  return (
    <div style={{ marginLeft: `${indent}px` }}>
      <Card 
        className={cn(
          "mb-2 cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:border-l-4 hover:border-l-blue-500",
          isSelected && "border-2 border-blue-500 shadow-md",
          level > 0 && "border-l-2 border-l-gray-200"
        )}
        onClick={handleClick}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Expand/Collapse Chevron */}
            {hasChildren && (
              <ChevronRight 
                className={cn(
                  "h-4 w-4 transition-transform flex-shrink-0",
                  isExpanded && "rotate-90"
                )}
              />
            )}
            {!hasChildren && level > 0 && (
              <div className="w-4" /> // Spacer for alignment
            )}
            
            {/* Type Icon */}
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            
            {/* Name and Metrics */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium truncate">{node.name}</h4>
                {node.code && (
                  <Badge variant="outline" className="text-xs">
                    {node.code}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                {(node.type === 'region' || node.type === 'market') && node.metrics.stationCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {node.metrics.stationCount} stations
                  </span>
                )}
                {node.type !== 'dsp' && (
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {node.metrics.dspCount} DSPs
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {node.metrics.contactCount} contacts
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mini Map for Regions */}
            {node.type === 'region' && node.children && (
              <div className="hidden md:block">
                <RegionMiniMap 
                  region={node.name}
                  markets={node.children}
                />
              </div>
            )}
            
            {/* Active Count */}
            <div className="text-right">
              <div className="text-sm font-medium">
                {node.metrics.activeCount} active
              </div>
            </div>
            
            {/* View Details Button */}
            <button
              onClick={handleViewDetails}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        </div>
      </Card>
      
      {/* Render Children if Expanded */}
      {isExpanded && hasChildren && (
        <div className={cn(
          "mt-1 transition-all duration-200",
          level > 0 && "border-l-2 border-gray-200 ml-4"
        )}>
          {node.children!.map(child => (
            <HierarchyCard 
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              selectedNode={selectedNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}