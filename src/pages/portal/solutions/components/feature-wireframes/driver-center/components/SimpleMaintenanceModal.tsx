import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';

interface SimpleMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleMaintenanceModal({ isOpen, onClose }: SimpleMaintenanceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setShowSuccess(false);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start pt-12">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold">Report Maintenance Issue</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {showSuccess ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-semibold text-green-900">Issue Reported!</p>
                  <p className="text-sm text-green-700">Maintenance team has been notified</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Report vehicle issues quickly. The maintenance team will review and address them promptly.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Issue Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., Windshield crack, Strange noise, Warning light"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {title.length}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Describe the issue in detail. Include when it started, any sounds or symptoms, and how it affects vehicle operation."
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {description.length}/500 characters
                  </p>
                </div>

                {/* Quick Templates */}
                <div>
                  <p className="text-sm font-medium mb-2">Quick Templates:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Check Engine Light',
                      'Tire Issue',
                      'Brake Problem',
                      'Fluid Leak'
                    ].map((template) => (
                      <Button
                        key={template}
                        variant="outline"
                        size="sm"
                        onClick={() => setTitle(template)}
                        className="text-xs"
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!title.trim() || !description.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Issue'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}