import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TermsOfUseModalProps {
  open: boolean;
  onClose?: () => void;
}

export function TermsOfUseModal({ open, onClose }: TermsOfUseModalProps) {
  const [termsContent, setTermsContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadTermsContent();
      setHasScrolledToBottom(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !scrollAreaRef.current) return;

    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const element = scrollContainer as HTMLElement;
      const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
      
      if (isAtBottom && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    
    // Check initial position
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [open, termsContent, hasScrolledToBottom]);

  const loadTermsContent = async () => {
    try {
      const response = await fetch('/docs/legal/terms-of-use.md');
      const text = await response.text();
      setTermsContent(text);
    } catch (error) {
      console.error('Failed to load Terms of Use:', error);
      setTermsContent('Failed to load Terms of Use. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            <DialogTitle className="text-2xl">Terms of Use & Privacy Policy</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 pt-4">
          <ScrollArea className="h-full border rounded-lg p-6 bg-gray-50" ref={scrollAreaRef}>
            <div className="prose prose-sm max-w-none">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-800">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-700">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>,
                    li: ({ children }) => <li className="text-gray-600">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                    hr: () => <hr className="my-6 border-gray-300" />
                  }}
                >
                  {termsContent}
                </ReactMarkdown>
              )}
            </div>
            <div ref={bottomRef} className="h-1" />
          </ScrollArea>

          {!hasScrolledToBottom && !loading && (
            <div className="mt-4 text-center text-sm text-gray-500">
              ↓ Please scroll to the bottom to continue ↓
            </div>
          )}
        </div>

        <div className="border-t p-6 bg-gray-50">
          <Button
            onClick={handleClose}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!hasScrolledToBottom && !loading}
          >
            I Have Read the Terms of Use & Privacy Policy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}