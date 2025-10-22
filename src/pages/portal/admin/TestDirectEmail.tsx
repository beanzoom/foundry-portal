import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function TestDirectEmail() {
  const [email, setEmail] = useState('joey@dspfoundry.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmail = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing email to:', email);

      // Test the send-email function directly
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'Test Email from Portal',
          template: 'test',
          templateData: {
            message: 'This is a test email sent directly from the portal admin.'
          }
        }
      });

      console.log('Response:', { data, error });
      setResult({ data, error });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else if (data?.success) {
        toast({
          title: 'Success',
          description: `Email sent successfully! ID: ${data.id}`
        });
      } else {
        toast({
          title: 'Failed',
          description: data?.error || 'Unknown error',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Error:', err);
      setResult({ error: err.message });
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Direct Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label>Email Address</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
          />
        </div>

        <Button
          onClick={testEmail}
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}