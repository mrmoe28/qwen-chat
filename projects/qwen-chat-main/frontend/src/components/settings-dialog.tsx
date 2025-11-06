'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings, Sparkles, Zap, Brain } from 'lucide-react';
import type { ModelSettings } from '@/types/chat';
import { DEFAULT_MODEL_SETTINGS } from '@/types/chat';
import { useModels } from '@/hooks/useModels';

interface SettingsDialogProps {
  settings: ModelSettings;
  onSettingsChange: (settings: ModelSettings) => void;
  trigger?: React.ReactNode;
}

export function SettingsDialog({ settings, onSettingsChange, trigger }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<ModelSettings>(settings);
  const [open, setOpen] = useState(false);
  const { models, loading: modelsLoading } = useModels();

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_MODEL_SETTINGS);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Model Settings</DialogTitle>
          <DialogDescription>
            Adjust the parameters for the Qwen model
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          {/* Model Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Model</Label>
              {localSettings.model === 'auto' && <Sparkles className="h-4 w-4 text-yellow-500" />}
              {models.find(m => m.id === localSettings.model && m.speed === 'fast') && <Zap className="h-4 w-4 text-blue-500" />}
            </div>
            <Select
              value={localSettings.model}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, model: value })
              }
              disabled={modelsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model..." />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {localSettings.model === 'auto'
                ? 'Automatically selects the best model for coding, quick tasks, or complex analysis'
                : models.find((m) => m.id === localSettings.model)?.description}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperature: {localSettings.temperature}</Label>
            </div>
            <Slider
              value={[localSettings.temperature]}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, temperature: value[0] })
              }
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness. Lower = more focused, higher = more creative
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Max Tokens: {localSettings.maxTokens}</Label>
            </div>
            <Slider
              value={[localSettings.maxTokens]}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, maxTokens: value[0] })
              }
              min={256}
              max={8192}
              step={256}
            />
            <p className="text-xs text-muted-foreground">
              Maximum length of the response
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Top P: {localSettings.topP}</Label>
            </div>
            <Slider
              value={[localSettings.topP]}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, topP: value[0] })
              }
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Nucleus sampling threshold
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Frequency Penalty: {localSettings.frequencyPenalty}</Label>
            </div>
            <Slider
              value={[localSettings.frequencyPenalty]}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, frequencyPenalty: value[0] })
              }
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              Reduces repetition of token sequences
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Presence Penalty: {localSettings.presencePenalty}</Label>
            </div>
            <Slider
              value={[localSettings.presencePenalty]}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, presencePenalty: value[0] })
              }
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              Encourages talking about new topics
            </p>
          </div>
        </div>
        <div className="flex justify-between pt-4 border-t border-border flex-shrink-0">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
