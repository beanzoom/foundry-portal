import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface NDAModalProps {
  open: boolean;
  userFirstName: string;
  userLastName: string;
  onAgree: (agreedText: string, typedName: string) => Promise<void>;
}

export function NDAModal({ open, userFirstName, userLastName, onAgree }: NDAModalProps) {
  const [ndaContent, setNdaContent] = useState<string>('');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedText, setAgreedText] = useState('');
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load NDA content
  useEffect(() => {
    if (open) {
      fetch('/nda.md')
        .then(res => res.text())
        .then(text => setNdaContent(text))
        .catch(err => {
          console.error('Failed to load NDA:', err);
          setError('Failed to load NDA document');
        });
    }
  }, [open]);

  // Track scroll position with both IntersectionObserver and scroll event
  useEffect(() => {
    if (!open || !scrollAreaRef.current) return;

    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer || !bottomRef.current) return;

    // IntersectionObserver for bottom detection
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          console.log('Bottom is visible via IntersectionObserver');
          setHasScrolledToBottom(true);
        }
      },
      { threshold: 0.1, root: scrollContainer }
    );

    observer.observe(bottomRef.current);

    // Manual scroll handler as backup
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom < 100) {
        console.log('Bottom detected via scroll handler');
        setHasScrolledToBottom(true);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    // Check immediately in case content is short enough
    handleScroll();

    return () => {
      observer.disconnect();
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [open, ndaContent]);

  const handleSubmit = async () => {
    setError('');

    // Validate "I agree" text
    if (agreedText.toLowerCase() !== 'i agree') {
      setError('Please type "I agree" exactly as shown');
      return;
    }

    // Validate name matches exactly
    const expectedName = `${userFirstName} ${userLastName}`;
    if (typedName !== expectedName) {
      setError(`Name must match exactly: ${expectedName}`);
      return;
    }

    // Ensure they've scrolled to bottom
    if (!hasScrolledToBottom) {
      setError('Please scroll to the bottom of the document before agreeing');
      return;
    }

    setLoading(true);
    try {
      await onAgree(agreedText, typedName);
    } catch (err: any) {
      setError(err.message || 'Failed to save agreement');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            <DialogTitle className="text-2xl">Non-Disclosure Agreement</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 pt-4">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must read and agree to this NDA before accessing the DSP Foundry Portal.
              Please scroll to the bottom of the document to continue.
            </AlertDescription>
          </Alert>

          <ScrollArea className="h-[calc(100%-8rem)] border rounded-lg p-6 bg-gray-50" ref={scrollAreaRef}>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  hr: () => <hr className="my-8 border-t-2 border-gray-400" />,
                  h2: ({children}) => <h2 className="mt-8 mb-4 text-lg font-bold">{children}</h2>,
                  h3: ({children}) => <h3 className="mt-4 mb-2 font-semibold">{children}</h3>,
                }}
              >
                {ndaContent}
              </ReactMarkdown>
            </div>
            <div ref={bottomRef} className="h-1" />
          </ScrollArea>

          {!hasScrolledToBottom && (
            <div className="mt-4 text-center text-sm text-gray-500">
              ↓ Please scroll to the bottom to continue ↓
            </div>
          )}
        </div>

        {hasScrolledToBottom && (
          <div className="border-t p-6 space-y-4 bg-gray-50">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agree-text" className="block mb-2">
                  Type "I agree" to confirm acceptance
                </Label>
                <Input
                  id="agree-text"
                  type="text"
                  placeholder='Type "I agree"'
                  value={agreedText}
                  onChange={(e) => setAgreedText(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="full-name" className="block mb-2">
                  Type your full name: <strong>{userFirstName} {userLastName}</strong>
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder={`${userFirstName} ${userLastName}`}
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={
                loading ||
                !hasScrolledToBottom ||
                agreedText.toLowerCase() !== 'i agree' ||
                typedName !== `${userFirstName} ${userLastName}`
              }
            >
              {loading ? 'Saving Agreement...' : 'I Agree to the NDA'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}