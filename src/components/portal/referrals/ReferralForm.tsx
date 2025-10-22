import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePortal } from '@/contexts/PortalContext';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const referralFormSchema = z.object({
  referee_first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  referee_last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  referee_email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  referee_phone: z.string()
    .optional()
    .refine((val) => !val || /^[\d\s\-\(\)\+]+$/.test(val), {
      message: 'Please enter a valid phone number'
    }),
  dsp_name: z.string()
    .max(100, 'DSP name must be less than 100 characters')
    .optional(),
  dsp_code: z.string()
    .max(20, 'DSP code must be less than 20 characters')
    .optional()
});

type ReferralFormValues = z.infer<typeof referralFormSchema>;

interface ReferralFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReferralForm({ open, onOpenChange, onSuccess }: ReferralFormProps) {
  const { portalUser } = usePortal();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ReferralFormValues>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      referee_first_name: '',
      referee_last_name: '',
      referee_email: '',
      referee_phone: '',
      dsp_name: '',
      dsp_code: ''
    }
  });

  const handleSubmit = async (values: ReferralFormValues) => {
    if (!portalUser) {
      setError('You must be logged in to send referrals');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Call the API to create the referral
      const { data, error: apiError } = await supabase
        .rpc('create_referral', {
          p_referrer_id: portalUser.id,
          p_referee_first_name: values.referee_first_name,
          p_referee_last_name: values.referee_last_name,
          p_referee_email: values.referee_email.toLowerCase(),
          p_referee_phone: values.referee_phone || null,
          p_dsp_name: values.dsp_name || null,
          p_dsp_code: values.dsp_code || null
        });

      if (apiError) {
        if (apiError.message.includes('unique_referrer_referee')) {
          setError('You have already sent a referral to this email address');
        } else if (apiError.message.includes('rate limit')) {
          setError('You have reached the daily limit for sending referrals. Please try again tomorrow.');
        } else {
          setError(apiError.message || 'Failed to send referral');
        }
        return;
      }

      // Email is now handled automatically by database trigger
      // The trigger queues emails to email_queue for processing

      // Success!
      setSuccessMessage(`Referral invitation sent to ${values.referee_first_name} ${values.referee_last_name}!`);

      toast({
        title: 'Referral Sent!',
        description: `An invitation has been sent to ${values.referee_email}`,
        duration: 5000
      });

      // Reset form
      form.reset();

      // Close dialog after a delay
      setTimeout(() => {
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);

    } catch (err) {
      console.error('Error creating referral:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form and messages when closing
    form.reset();
    setError(null);
    setSuccessMessage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite a Colleague
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join the Fleet DRMS Portal. They'll receive an email
            with a personalized link to sign up.
          </DialogDescription>
        </DialogHeader>

        {successMessage && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!successMessage && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="referee_first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referee_last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="referee_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john.doe@example.com"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      They'll receive the invitation at this email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referee_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="(555) 123-4567"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional - helps us provide better support
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dsp_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DSP Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Company Name"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dsp_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DSP Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="DSP123"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}