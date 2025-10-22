import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Search, Building, Plus, Check, Loader2 } from 'lucide-react';
import { debounce } from 'lodash';

interface Contact {
  id: string;
  company_name: string;
  station_name?: string;
  city?: string;
  state?: string;
  is_amazon_dsp: boolean;
}

interface BusinessSelectorProps {
  onSelect: (contactId: string | null, isNew: boolean) => void;
  userId?: string;
}

export function BusinessSelector({ onSelect, userId }: BusinessSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Contact | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);

  // Fuzzy search function with debounce
  const searchBusinesses = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Use PostgreSQL's similarity functions for fuzzy matching
        // This query looks for similar company names and ranks them
        const { data, error } = await supabase
          .rpc('search_contacts_fuzzy', {
            search_term: term,
            limit_count: 5
          });

        if (error) {
          console.error('Search error:', error);
          // Fallback to basic ILIKE search
          const { data: fallbackData } = await supabase
            .from('contacts')
            .select('id, company_name, station_name, city, state, is_amazon_dsp')
            .ilike('company_name', `%${term}%`)
            .limit(5);

          setSearchResults(fallbackData || []);
        } else {
          setSearchResults(data || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchBusinesses(searchTerm);
  }, [searchTerm, searchBusinesses]);

  const handleSelectBusiness = (business: Contact) => {
    setSelectedBusiness(business);
    setSearchTerm(business.company_name);
    setSearchResults([]);
    onSelect(business.id, false);
  };

  const handleCreateNew = () => {
    setShowCreateNew(true);
    setSelectedBusiness(null);
    onSelect(null, true);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="business-search">Find Your DSP Business</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="business-search"
            type="text"
            placeholder="Start typing your DSP business name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedBusiness && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y">
            {searchResults.map((business) => (
              <button
                key={business.id}
                onClick={() => handleSelectBusiness(business)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start space-x-3"
              >
                <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {business.company_name}
                  </p>
                  {business.station_name && (
                    <p className="text-sm text-gray-500">
                      Station: {business.station_name}
                    </p>
                  )}
                  {business.city && business.state && (
                    <p className="text-sm text-gray-500">
                      {business.city}, {business.state}
                    </p>
                  )}
                </div>
                {business.is_amazon_dsp && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Amazon DSP
                  </span>
                )}
              </button>
            ))}

            {/* Create New Option */}
            <button
              onClick={handleCreateNew}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3 text-blue-600"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Create New Business</span>
            </button>
          </div>
        </Card>
      )}

      {/* Selected Business Confirmation */}
      {selectedBusiness && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Selected:</strong> {selectedBusiness.company_name}
            {selectedBusiness.station_name && ` (${selectedBusiness.station_name})`}
          </AlertDescription>
        </Alert>
      )}

      {/* No Results Message */}
      {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && !selectedBusiness && (
        <Alert>
          <AlertDescription>
            No businesses found matching "{searchTerm}".
            <Button
              variant="link"
              className="px-1"
              onClick={handleCreateNew}
            >
              Create a new business
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}