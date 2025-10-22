import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { contactTrackingService } from '@/services/contact-tracking.service';
import { supabase } from '@/lib/supabase';

export function DataDebugger() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testDataLoading();
  }, []);

  const testDataLoading = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Direct Supabase query for markets
      console.log('Testing markets...');
      const { data: markets, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('is_active', true)
        .limit(5);
      
      testResults.markets = {
        success: !marketsError,
        count: markets?.length || 0,
        error: marketsError?.message || null,
        sample: markets?.[0] || null
      };
      console.log('Markets result:', testResults.markets);

      // Test 2: Direct Supabase query for stations
      console.log('Testing stations...');
      const { data: stations, error: stationsError } = await supabase
        .from('stations')
        .select('*')
        .eq('is_active', true)
        .limit(5);
      
      testResults.stations = {
        success: !stationsError,
        count: stations?.length || 0,
        error: stationsError?.message || null,
        sample: stations?.[0] || null
      };
      console.log('Stations result:', testResults.stations);

      // Test 3: Direct Supabase query for DSPs
      console.log('Testing DSPs...');
      const { data: dsps, error: dspsError } = await supabase
        .from('dsps')
        .select('*')
        .eq('is_active', true)
        .limit(5);
      
      testResults.dsps = {
        success: !dspsError,
        count: dsps?.length || 0,
        error: dspsError?.message || null,
        sample: dsps?.[0] || null
      };
      console.log('DSPs result:', testResults.dsps);

      // Test 4: Service method for markets
      console.log('Testing service getMarkets...');
      try {
        const serviceMarkets = await contactTrackingService.getMarkets();
        testResults.serviceMarkets = {
          success: true,
          count: serviceMarkets.length,
          sample: serviceMarkets[0] || null
        };
      } catch (err: any) {
        testResults.serviceMarkets = {
          success: false,
          error: err.message
        };
      }
      console.log('Service markets result:', testResults.serviceMarkets);

      // Test 5: Service method for stations
      console.log('Testing service getStations...');
      try {
        const serviceStations = await contactTrackingService.getStations();
        testResults.serviceStations = {
          success: true,
          count: serviceStations.length,
          sample: serviceStations[0] || null
        };
      } catch (err: any) {
        testResults.serviceStations = {
          success: false,
          error: err.message
        };
      }
      console.log('Service stations result:', testResults.serviceStations);

      // Test 6: Service method for DSPs
      console.log('Testing service getDSPs...');
      try {
        const serviceDSPs = await contactTrackingService.getDSPs();
        testResults.serviceDSPs = {
          success: true,
          count: serviceDSPs.length,
          sample: serviceDSPs[0] || null
        };
      } catch (err: any) {
        testResults.serviceDSPs = {
          success: false,
          error: err.message
        };
      }
      console.log('Service DSPs result:', testResults.serviceDSPs);

      // Test 7: Check auth status
      const { data: { user } } = await supabase.auth.getUser();
      testResults.auth = {
        isAuthenticated: !!user,
        userId: user?.id,
        email: user?.email
      };
      console.log('Auth result:', testResults.auth);

    } catch (error: any) {
      console.error('Debug test error:', error);
      testResults.generalError = error.message;
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Data Loading Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Running tests...</p>
        ) : (
          <pre className="text-xs overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}