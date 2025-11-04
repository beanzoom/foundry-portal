import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gauge, CheckCircle } from 'lucide-react';

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
      }, 2000);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {!isComplete ? (
          <>
            <DialogHeader>
              <DialogTitle>Finalize Route {routeId}</DialogTitle>
              <DialogDescription>
                Enter the current odometer reading to complete today's route.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Starting Mileage</Label>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="h-4 w-4" />
                  <span>{currentMileage.toLocaleString()} miles</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newMileage">Ending Mileage</Label>
                <Input
                  id="newMileage"
                  type="number"
                  placeholder="Enter current odometer reading"
                  value={newMileage}
                  onChange={(e) => setNewMileage(e.target.value)}
                  min={currentMileage + 1}
                />
                {newMileage && parseInt(newMileage) <= currentMileage && (
                  <p className="text-sm text-red-500">
                    Ending mileage must be greater than starting mileage
                  </p>
                )}
              </div>
              
              {newMileage && parseInt(newMileage) > currentMileage && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Miles driven today: <span className="font-semibold text-foreground">
                      {(parseInt(newMileage) - currentMileage).toLocaleString()}
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!newMileage || parseInt(newMileage) <= currentMileage || isSubmitting}
              >
                {isSubmitting ? 'Finalizing...' : 'Finalize Route'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Route Finalized!</h3>
            <p className="text-muted-foreground">
              Route {routeId} has been completed successfully.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}