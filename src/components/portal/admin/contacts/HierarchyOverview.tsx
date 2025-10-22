import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  MapPin, 
  Building2, 
  Package,
  LayoutGrid,
  X,
  Calendar,
  Hash,
  CheckCircle
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMarkets, useStations, useDSPs } from '@/hooks/useContactTracking';
import HierarchyCard from './HierarchyCard';
import { buildHierarchyTree, type HierarchyNode } from './hierarchy-utils';

// US Census Regions
const US_REGIONS = {
  NE: { name: 'Northeast', states: ['ME','NH','VT','MA','RI','CT','NY','NJ','PA'] },
  MW: { name: 'Midwest', states: ['OH','IN','IL','MI','WI','MN','IA','MO','ND','SD','NE','KS'] },
  S: { name: 'South', states: ['DE','MD','DC','VA','WV','NC','SC','GA','FL','KY','TN','AL','MS','AR','LA','OK','TX'] },
  W: { name: 'West', states: ['MT','ID','WY','CO','NM','AZ','UT','NV','WA','OR','CA','AK','HI'] }
};

export function HierarchyOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  // Fetch data
  const { markets, loading: marketsLoading } = useMarkets();
  const { stations, loading: stationsLoading } = useStations();
  const { dsps, loading: dspsLoading } = useDSPs();

  // Build hierarchy tree
  const hierarchyTree = useMemo(() => {
    if (!markets || !stations || !dsps) return [];
    return buildHierarchyTree(markets, stations, dsps, US_REGIONS);
  }, [markets, stations, dsps]);

  // Filter hierarchy based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery) return hierarchyTree;
    
    const query = searchQuery.toLowerCase();
    const filterNodes = (nodes: HierarchyNode[]): HierarchyNode[] => {
      return nodes.reduce((acc: HierarchyNode[], node) => {
        const nameMatch = node.name.toLowerCase().includes(query);
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        
        if (nameMatch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
            expanded: true // Auto-expand to show search results
          });
        }
        
        return acc;
      }, []);
    };
    
    return filterNodes(hierarchyTree);
  }, [hierarchyTree, searchQuery]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      regions: Object.keys(US_REGIONS).length,
      markets: markets?.length || 0,
      stations: stations?.length || 0,
      dsps: dsps?.length || 0
    };
  }, [markets, stations, dsps]);

  // Toggle node expansion
  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Find node by ID
  const findNodeById = useCallback((nodeId: string, nodes: HierarchyNode[]): HierarchyNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      if (node.children) {
        const found = findNodeById(nodeId, node.children);
        if (found) return found;
      }
    }
    return null;
  }, []);
  
  // Select node for details
  const handleSelect = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
  }, []);
  
  // Get selected node details
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;
    return findNodeById(selectedNode, hierarchyTree);
  }, [selectedNode, hierarchyTree, findNodeById]);

  // Expand/Collapse all
  const handleExpandAll = useCallback(() => {
    if (expandAll) {
      setExpandedNodes(new Set());
      setExpandAll(false);
    } else {
      // Collect all node IDs
      const allNodeIds = new Set<string>();
      const collectIds = (nodes: HierarchyNode[]) => {
        nodes.forEach(node => {
          allNodeIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(hierarchyTree);
      setExpandedNodes(allNodeIds);
      setExpandAll(true);
    }
  }, [expandAll, hierarchyTree]);

  const isLoading = marketsLoading || stationsLoading || dspsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search regions, markets, stations, or DSPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleExpandAll}
          className="gap-2"
        >
          {expandAll ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Globe className="h-4 w-4 inline mr-2" />
              Regions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.regions}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4 inline mr-2" />
              Markets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.markets}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4 inline mr-2" />
              Stations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.stations}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4 inline mr-2" />
              DSPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.dsps}</p>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Organization Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {filteredTree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No results found' : 'No data available'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTree.map(node => (
                  <HierarchyCard
                    key={node.id}
                    node={{
                      ...node,
                      expanded: expandedNodes.has(node.id) || node.expanded
                    }}
                    level={0}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                    expandedNodes={expandedNodes}
                    selectedNode={selectedNode}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Details Sidebar */}
      <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedNodeDetails && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedNodeDetails.type === 'region' && <Globe className="h-5 w-5" />}
                  {selectedNodeDetails.type === 'market' && <MapPin className="h-5 w-5" />}
                  {selectedNodeDetails.type === 'station' && <Building2 className="h-5 w-5" />}
                  {selectedNodeDetails.type === 'dsp' && <Package className="h-5 w-5" />}
                  {selectedNodeDetails.name}
                </SheetTitle>
                <SheetDescription>
                  {selectedNodeDetails.type.charAt(0).toUpperCase() + selectedNodeDetails.type.slice(1)} Details
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Metrics Overview */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(selectedNodeDetails.type === 'region' || selectedNodeDetails.type === 'market') && selectedNodeDetails.metrics.stationCount !== undefined && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">Stations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{selectedNodeDetails.metrics.stationCount}</p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedNodeDetails.type !== 'dsp' && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-muted-foreground">DSPs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{selectedNodeDetails.metrics.dspCount}</p>
                        </CardContent>
                      </Card>
                    )}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Contacts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{selectedNodeDetails.metrics.contactCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{selectedNodeDetails.metrics.activeCount}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* Additional Details */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Details</h3>
                  <div className="space-y-2">
                    {selectedNodeDetails.parentName && (
                      <div className="flex items-center gap-2 text-sm">
                        {selectedNodeDetails.type === 'market' && <Globe className="h-4 w-4 text-muted-foreground" />}
                        {selectedNodeDetails.type === 'station' && <MapPin className="h-4 w-4 text-muted-foreground" />}
                        {selectedNodeDetails.type === 'dsp' && <Building2 className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-muted-foreground">
                          {selectedNodeDetails.type === 'market' && 'Region:'}
                          {selectedNodeDetails.type === 'station' && 'Market:'}
                          {selectedNodeDetails.type === 'dsp' && 'Station:'}
                        </span>
                        <span className="font-medium">{selectedNodeDetails.parentName}</span>
                      </div>
                    )}
                    {selectedNodeDetails.code && (
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Code:</span>
                        <span className="font-medium">{selectedNodeDetails.code}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedNodeDetails.metrics.activeCount > 0 ? "default" : "secondary"}>
                        {selectedNodeDetails.metrics.activeCount > 0 ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {selectedNodeDetails.rawData && (selectedNodeDetails.rawData as any).created_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">
                          {new Date((selectedNodeDetails.rawData as any).created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Children Summary */}
                {selectedNodeDetails.children && selectedNodeDetails.children.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      {selectedNodeDetails.type === 'region' && 'Markets'}
                      {selectedNodeDetails.type === 'market' && 'Stations'}
                      {selectedNodeDetails.type === 'station' && 'DSPs'}
                    </h3>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {selectedNodeDetails.children.map(child => (
                          <Card key={child.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{child.name}</p>
                                {child.code && (
                                  <p className="text-xs text-muted-foreground">{child.code}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {child.metrics.contactCount} contacts
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}