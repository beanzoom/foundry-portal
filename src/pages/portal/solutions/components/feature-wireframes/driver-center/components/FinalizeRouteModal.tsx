import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Gauge, CheckCircle, AlertCircle } from 'lucide-react';

interface FinalizeRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMileage: number;
  routeId: string;
}

export function FinalizeRouteModal({ isOpen, onClose, currentMileage, routeId }: FinalizeRouteModalProps) {
  const [newMileage, setNewMileage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!newMileage || parseInt(newMileage) <= currentMileage) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsComplete(true);
      setTimeout(() => {
        onClose();
        setIsComplete(false);
        setNewMileage('');
      }, 1500);
    }, 1000);
  };

  const milesDriven = newMileage && parseInt(newMileage) > currentMileage
    ? parseInt(newMileage) - currentMileage
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start pt-12">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold">Finalize Route {routeId}</h2>
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
          {isComplete ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-semibold text-green-900">Route Finalized!</p>
                <p className="text-sm text-green-700">
                  Route {routeId} has been completed successfully.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Enter the current odometer reading to complete today's route.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Starting Mileage
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Gauge className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold">{currentMileage.toLocaleString()} miles</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ending Mileage <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newMileage}
                    onChange={(e) => setNewMileage(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter current odometer reading"
                    min={currentMileage + 1}
                  />
                  {newMileage && parseInt(newMileage) <= currentMileage && (
                    <p className="text-sm text-red-500 mt-1">
                      Ending mileage must be greater than starting mileage
                    </p>
                  )}
                </div>

                {milesDriven > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      Miles driven today: <span className="font-semibold text-green-900">
                        {milesDriven.toLocaleString()} miles
                      </span>
                    </p>
                  </div>
                )}
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
                  disabled={!newMileage || parseInt(newMileage) <= currentMileage || isSubmitting}
                >
                  {isSubmitting ? 'Finalizing...' : 'Finalize Route'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
