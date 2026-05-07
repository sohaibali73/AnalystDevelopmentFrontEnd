'use client';

/**
 * EditSkillModal — patch an existing skill's metadata + (lightweight only)
 * its system prompt.
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getSkill, patchSkill } from '@/lib/skills/api';
import {
  explainSkillError,
  SKILL_CATEGORIES,
  type SkillDefinition,
} from '@/types/skills';
import { bumpSkillsVersion } from '@/stores/skills';

interface Props {
  skill: SkillDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSkillModal({ skill, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [tagsRaw, setTagsRaw] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isLightweight, setIsLightweight] = useState(false);

  useEffect(() => {
    if (!open || !skill) return;
    setLoading(true);
    getSkill(skill.slug)
      .then((full) => {
        setName(full.name);
        setDescription(full.description);
        setCategory(String(full.category));
        setTagsRaw((full.tags || []).join(', '));
        setEnabled(full.enabled);
        setSystemPrompt(full.system_prompt || '');
        setIsLightweight(full.storage_kind === 'lightweight');
      })
      .catch((e) => toast.error(explainSkillError(e)))
      .finally(() => setLoading(false));
  }, [open, skill]);

  async function handleSave() {
    if (!skill) return;
    setSubmitting(true);
    try {
      const tags = tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await patchSkill(skill.slug, {
        name,
        description,
        category,
        tags,
        enabled,
        ...(isLightweight ? { system_prompt: systemPrompt } : {}),
      });
      toast.success('Saved');
      bumpSkillsVersion();
      onOpenChange(false);
    } catch (e) {
      toast.error(explainSkillError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit skill — {skill?.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm h-9"
                >
                  {SKILL_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <Label>Enabled</Label>
            </div>
            {isLightweight && (
              <div>
                <Label>System prompt</Label>
                <Textarea
                  rows={10}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting || loading}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditSkillModal;
