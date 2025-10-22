import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, DollarSign, Clock, Wrench } from 'lucide-react';

interface SimulatedResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceRecord: any;
  onResolved: () => void;
}

export function SimulatedResolutionDialog({
  isOpen,
  onClose,
  maintenanceRecord,
  onResolved
}: SimulatedResolutionDialogProps) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleResolve = () => {
    setShowConfirmation(true);
  };

  const handleConfirmResolution = () => {
    setShowConfirmation(false);
    onClose();
    onResolved();
  };

  const handleCancel = () => {
    setResolutionNotes('');
    setResolutionType('');
    setLaborHours('');
    setPartsCost('');
    onClose();
  };

  if (!maintenanceRecord) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resolve Maintenance Issue
            </DialogTitle>
            <DialogDescription>
              Complete the resolution details for: <strong>{maintenanceRecord.issue_title}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Resolution Type */}
            <div className="space-y-2">
              <Label htmlFor="resolution-type">Resolution Type *</Label>
              <Select value={resolutionType} onValueChange={setResolutionType} modal={false}>
                <SelectTrigger id="resolution-type">
                  <SelectValue placeholder="Select resolution type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="repaired">Repaired</SelectItem>
                  <SelectItem value="replaced">Replaced Part</SelectItem>
                  <SelectItem value="serviced">Serviced</SelectItem>
                  <SelectItem value="no-issue">No Issue Found</SelectItem>
                  <SelectItem value="deferred">Deferred</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resolution Notes */}
            <div className="space-y-2">
              <Label htmlFor="resolution-notes">Resolution Notes *</Label>
              <Textarea
                id="resolution-notes"
                placeholder="Describe the work performed and resolution details..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>

            {/* Cost Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="labor-hours" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Labor Hours
                </Label>
                <Input
                  id="labor-hours"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 2.5"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parts-cost" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Parts Cost
                </Label>
                <Input
                  id="parts-cost"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 150.00"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                />
              </div>
            </div>

            {/* Technician */}
            <div className="space-y-2">
              <Label htmlFor="technician">Technician</Label>
              <Select defaultValue="current-user" modal={false}>
                <SelectTrigger id="technician">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-user">John Smith (You)</SelectItem>
                  <SelectItem value="mike">Mike Johnson</SelectItem>
                  <SelectItem value="sarah">Sarah Davis</SelectItem>
                  <SelectItem value="tom">Tom Wilson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-green-900 mb-2">Resolution Summary</h4>
              <div className="space-y-1 text-sm text-green-800">
                <p><strong>Issue:</strong> {maintenanceRecord.issue_title}</p>
                <p><strong>Vehicle:</strong> {maintenanceRecord.fleet?.vehicle_name}</p>
                <p><strong>Original Due Date:</strong> {maintenanceRecord.date_due}</p>
                {resolutionType && <p><strong>Resolution:</strong> {resolutionType}</p>}
                {(laborHours || partsCost) && (
                  <p><strong>Total Cost:</strong> ${
                    (parseFloat(laborHours || '0') * 75 + parseFloat(partsCost || '0')).toFixed(2)
                  }</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolutionType || !resolutionNotes}
              className="gap-2"
            >
              <Wrench className="h-4 w-4" />
              Resolve Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirm Resolution
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>Are you sure you want to mark this maintenance issue as resolved? This action will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Mark the issue as completed</li>
                  <li>Update the vehicle's maintenance history</li>
                  <li>Notify relevant team members</li>
                  <li>Update the vehicle's operational status if needed</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmResolution} className="bg-green-600 hover:bg-green-700">
              Confirm Resolution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}