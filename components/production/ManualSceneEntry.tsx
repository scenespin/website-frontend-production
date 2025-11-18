'use client';

/**
 * ManualSceneEntry Component
 * 
 * Allows users to manually enter scene descriptions.
 * Part of Production Hub Phase 2 redesign.
 */

import React, { useState } from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface ManualSceneEntryProps {
  value: string;
  onChange: (value: string) => void;
  onUseAsIs: () => void;
  onGenerateWithAI?: () => Promise<void>;
  className?: string;
  isMobile?: boolean;
}

export function ManualSceneEntry({
  value,
  onChange,
  onUseAsIs,
  onGenerateWithAI,
  className = '',
  isMobile = false
}: ManualSceneEntryProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateWithAI = async () => {
    if (!onGenerateWithAI) {
      toast.error('AI generation not available');
      return;
    }

    if (!value.trim()) {
      toast.error('Please enter a scene description first');
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerateWithAI();
      // Success toast is handled by parent component
    } catch (error) {
      console.error('[ManualSceneEntry] AI generation failed:', error);
      toast.error('Failed to generate scene. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Scene Description</CardTitle>
        <CardDescription>
          Describe your scene in Fountain format or plain English
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={`Example:\n\nINT. COFFEE SHOP - DAY\n\nDetective SARAH interviews nervous suspect across table.\nSteam rises from coffee cups. Tense silence.\n\nOr just: "A detective interviewing someone in a coffee shop"`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={8}
          maxLength={500}
          className="font-mono text-sm"
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {value.length}/500 characters
          </div>
          {onGenerateWithAI && (
            <Button
              onClick={handleGenerateWithAI}
              variant="outline"
              size="sm"
              disabled={isGenerating || !value.trim()}
              className="flex items-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Scene with AI'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onUseAsIs}
            disabled={!value.trim()}
            className="flex-1"
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Use As-Is
          </Button>
        </div>

        {onGenerateWithAI && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              💡 <strong>AI Generation:</strong> Enter a simple description and let AI create a full scene in Fountain format. You can edit the result before using it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

