import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Mail, ArrowLeft } from 'lucide-react';

export default function TestEdgeFunction() {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [normalResult, setNormalResult] = useState<any>(null);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [pendingBatches, setPendingBatches] = useState<any[]>([]);
  const [triggerFixResult, setTriggerFixResult] = useState<any>(null);

  useEffect(() => {
    loadPendingBatches();
  }, []);

  const loadPendingBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notification_batches')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending batches:', error);
      } else {
        setPendingBatches(data || []);
      }
    } catch (err) {
      console.error('Error loading pending batches:', err);
    }
  };

  const runDebug = async () => {
    setLoading(true);
    setDebugResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { debug: true }
      });

      if (error) {
        setDebugResult({ error: error.message });
      } else {
        setDebugResult(data);
      }
    } catch (err: any) {
      setDebugResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { 
          test: true,
          testEmail: testEmail
        }
      });

      if (error) {
        setTestResult({ error: error.message });
      } else {
        setTestResult(data);
      }
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const runNormalSend = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setNormalResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: 'Test Email via Normal Flow',
          html: '<p>This is a test email sent through the normal email flow.</p>'
        }
      });

      if (error) {
        setNormalResult({ error: error.message });
      } else {
        setNormalResult(data);
      }
    } catch (err: any) {
      setNormalResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const processPendingBatches = async () => {
    setLoading(true);
    setBatchResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-update-notifications', {
        body: {
          trigger_source: 'manual',
          test_mode: false
        }
      });

      if (error) {
        setBatchResult({ error: error.message });
      } else {
        setBatchResult(data);
        // Reload pending batches after processing
        await loadPendingBatches();
      }
    } catch (err: any) {
      setBatchResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fixUpdateTrigger = async () => {
    setLoading(true);
    setTriggerFixResult(null);

    try {
      // Try calling the RPC function directly first (if it exists)
      const { data: rpcData, error: rpcError } = await supabase.rpc('fix_update_published_trigger');

      if (rpcError) {
        // If RPC fails, try the edge function as fallback
        console.log('RPC failed, trying edge function:', rpcError);
        const { data, error } = await supabase.functions.invoke('fix-update-trigger', {
          body: {}
        });

        if (error) {
          setTriggerFixResult({
            error: error.message,
            fallback_attempted: true,
            rpc_error: rpcError.message
          });
        } else {
          setTriggerFixResult({
            ...data,
            method_used: 'edge_function',
            rpc_error: rpcError.message
          });
        }
      } else {
        setTriggerFixResult({
          ...rpcData,
          method_used: 'rpc_function'
        });
      }
    } catch (err: any) {
      setTriggerFixResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/portal/admin/settings/developer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Developer Settings
        </Link>
      </div>

      <h1 className="text-3xl font-bold">Edge Function Debugging</h1>

      {/* Pending Batches Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Email Batches
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPendingBatches}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Unsent email batches waiting to be processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingBatches.length > 0 ? (
            <div className="space-y-2">
              {pendingBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{batch.notification_type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {batch.total_recipients || 0} recipients
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(batch.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <Alert>
                <AlertDescription>
                  {pendingBatches.length} batch{pendingBatches.length !== 1 ? 'es' : ''} pending.
                  Click "Process Email Batches" below to send them.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No pending email batches. All emails have been processed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Email Address</CardTitle>
          <CardDescription>Enter an email address to use for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>1. Debug Configuration</CardTitle>
            <CardDescription>Check environment variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runDebug} 
              disabled={loading}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Debug Check
            </Button>
            
            {debugResult && (
              <Alert className={debugResult.error ? 'border-red-500' : ''}>
                <AlertDescription>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(debugResult, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Test Resend API</CardTitle>
            <CardDescription>Direct API test with minimal payload</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runTest} 
              disabled={loading || !testEmail}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Test Resend API
            </Button>
            
            {testResult && (
              <Alert className={testResult.error || !testResult.success ? 'border-red-500' : 'border-green-500'}>
                <AlertDescription>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Normal Email Send</CardTitle>
            <CardDescription>Send through normal flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runNormalSend} 
              disabled={loading || !testEmail}
              className="w-full"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Normal Email
            </Button>
            
            {normalResult && (
              <Alert className={normalResult.error || !normalResult.success ? 'border-red-500' : 'border-green-500'}>
                <AlertDescription>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(normalResult, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>1. First run Debug Check to verify environment variables are set</p>
          <p>2. Enter a test email address (can be any valid email format)</p>
          <p>3. Run Test Resend API to test direct API call with minimal payload</p>
          <p>4. Run Normal Email Send to test the full email flow</p>
          <p className="text-sm text-muted-foreground mt-4">
            Check the Supabase dashboard logs for detailed error messages.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Fix Update Published Trigger</CardTitle>
          <CardDescription>
            Fix the database trigger function for portal updates publishing
            <br />
            <span className="text-sm text-amber-600">
              ⚠️ Use this if you're getting "record has no field 'description'" errors when publishing updates
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={fixUpdateTrigger}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Fix Update Trigger Function
          </Button>

          {triggerFixResult && (
            <Alert className={triggerFixResult.error ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(triggerFixResult, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Process Pending Batches</CardTitle>
          <CardDescription>Manually trigger email batch processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={processPendingBatches}
            disabled={loading}
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Process Email Batches
          </Button>

          {batchResult && (
            <Alert className={batchResult.error ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(batchResult, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}