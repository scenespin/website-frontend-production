/**
 * CreditConfirmDialog Component
 * 
 * Reusable confirmation dialog for credit charges
 * Shows clear cost breakdown and warns users before charging credits
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, DollarSign } from 'lucide-react';

interface CreditAction {
  name: string;
  credits: number;
}

interface CreditConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  currentAction?: CreditAction;
  newAction: CreditAction;
  message?: string;
  showCacheWarning?: boolean;
  cachedPreset?: string;
}

export function CreditConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '💰 Credit Charge Confirmation',
  currentAction,
  newAction,
  message,
  showCacheWarning = false,
  cachedPreset
}: CreditConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Please review the credit charge before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current vs New Comparison */}
          <div className="space-y-3">
            {currentAction && (
              <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Current</p>
                  <p className="text-xs text-muted-foreground">{currentAction.name}</p>
                </div>
                <Badge variant="secondary">{currentAction.credits} credits used</Badge>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
              <div>
                <p className="text-sm font-medium">New Enhancement</p>
                <p className="text-xs text-muted-foreground">{newAction.name}</p>
              </div>
              <Badge variant="default" className="bg-blue-600">
                {newAction.credits} credits
              </Badge>
            </div>
          </div>

          {/* Cache Warning */}
          {showCacheWarning && cachedPreset && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>Warning:</strong> This will replace your cached <strong>{cachedPreset}</strong> enhancement.
                You won't be able to restore it for free anymore.
              </div>
            </div>
          )}

          {/* Custom Message */}
          {message && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {message}
              </div>
            </div>
          )}

          {/* Free Alternative Tip */}
          {!showCacheWarning && currentAction && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>💡 Free Alternative:</strong> Click "Revert to Original" first to try different presets
                without additional charges.
              </div>
            </div>
          )}

          {/* Credit Charge Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Charge</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {newAction.credits}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              credits will be deducted from your account
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="gap-2">
            <DollarSign className="w-4 h-4" />
            Charge {newAction.credits} Credits & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

