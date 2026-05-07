'use client';

/**
 * CreateSkillModal — two-tab dialog (Upload bundle / Author inline).
 * No emojis; icons only via lucide-react.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileArchive,
} from 'lucide-react';
import { toast } from 'sonner';

import { uploadSkill } from '@/lib/skills/api';
import {
  parseBundle,
  buildInlineBundle,
  slugify,
  type ParsedBundlePreview,
} from '@/lib/skills/parseBundle';
import {
  explainSkillError,
  KEBAB_SLUG_RE,
  SKILL_CATEGORIES,
} from '@/types/skills';
import { bumpSkillsVersion } from '@/stores/skills';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (slug: string) => void;
}

export function CreateSkillModal({ open, onOpenChange, onCreated }: Props) {
  const [tab, setTab] = useState<'upload' | 'inline'>('upload');
  const [submitting, setSubmitting] = useState(false);

  // Upload tab state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedBundlePreview | null>(null);
  const [overrideSlug, setOverrideSlug] = useState('');
  const [overrideCategory, setOverrideCategory] = useState('');

  // Inline tab state
  const [iName, setIName] = useState('');
  const [iSlug, setISlug] = useState('');
  const [iSlugTouched, setISlugTouched] = useState(false);
  const [iDescription, setIDescription] = useState('');
  const [iCategory, setICategory] = useState('general');
  const [iTagsRaw, setITagsRaw] = useState('');
  const [iPrompt, setIPrompt] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!iSlugTouched) setISlug(slugify(iName));
  }, [iName, iSlugTouched]);

  useEffect(() => {
    let cancelled = false;
    if (!file) {
      setPreview(null);
      return;
    }
    parseBundle(file).then((p) => {
      if (!cancelled) setPreview(p);
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  function reset() {
    setFile(null);
    setPreview(null);
    setOverrideSlug('');
    setOverrideCategory('');
    setIName('');
    setISlug('');
    setISlugTouched(false);
    setIDescription('');
    setICategory('general');
    setITagsRaw('');
    setIPrompt('');
    setSubmitting(false);
    setTab('upload');
  }

  async function handleUploadSubmit() {
    if (!file || !preview?.ok) return;
    setSubmitting(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (overrideSlug) metadata.slug = overrideSlug;
      if (overrideCategory) metadata.category = overrideCategory;
      const res = await uploadSkill(
        file,
        Object.keys(metadata).length ? metadata : undefined
      );
      toast.success(`Uploaded "${res.skill.name}"`);
      if (res.warnings && res.warnings.length) {
        toast.message(`${res.warnings.length} warning(s)`, {
          description: res.warnings.join('\n'),
        });
      }
      bumpSkillsVersion();
      onCreated?.(res.skill.slug);
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(explainSkillError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInlineSubmit() {
    if (!iName.trim() || !iDescription.trim() || !iPrompt.trim()) return;
    if (!KEBAB_SLUG_RE.test(iSlug)) {
      toast.error(
        'Slug must be kebab-case (3-64 chars, lowercase, start with a letter).'
      );
      return;
    }
    setSubmitting(true);
    try {
      const tags = iTagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const blob = await buildInlineBundle({
        name: iName.trim(),
        description: iDescription.trim(),
        systemPrompt: iPrompt.trim(),
        slug: iSlug,
        category: iCategory,
        tags,
      });
      const zipFile = new File([blob], `${iSlug}.zip`, {
        type: 'application/zip',
      });
      const res = await uploadSkill(zipFile, {
        mode: 'inline',
        slug: iSlug,
        name: iName,
        description: iDescription,
        category: iCategory,
        tags,
      });
      toast.success(`Created "${res.skill.name}"`);
      bumpSkillsVersion();
      onCreated?.(res.skill.slug);
      onOpenChange(false);
      reset();
    } catch (err) {
      toast.error(explainSkillError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.toLowerCase().endsWith('.zip')) setFile(f);
    else toast.error('Drop a .zip file.');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New skill</DialogTitle>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'upload' | 'inline')}
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload">Upload bundle</TabsTrigger>
            <TabsTrigger value="inline">Author inline</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent/40 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <FileArchive className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              ) : (
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              )}
              <p className="text-sm">
                {file ? (
                  <strong>{file.name}</strong>
                ) : (
                  'Drop a .zip skill bundle, or click to browse'
                )}
              </p>
              {file && (
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {preview && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {preview.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    {preview.ok ? 'Bundle looks good' : 'Bundle has issues'}
                  </span>
                  <Badge variant="secondary">{preview.storageKindGuess}</Badge>
                </div>

                {preview.errors.length > 0 && (
                  <ul className="text-red-600 list-disc list-inside text-xs space-y-0.5">
                    {preview.errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}

                {preview.warnings.length > 0 && (
                  <ul className="text-yellow-600 list-disc list-inside text-xs space-y-0.5">
                    {preview.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}

                {preview.frontmatter.name && (
                  <div className="rounded border bg-muted/40 p-3 space-y-1">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{' '}
                      <strong>{String(preview.frontmatter.name)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Slug:</span>{' '}
                      {String(
                        preview.frontmatter.slug ||
                          preview.frontmatter.name ||
                          ''
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>{' '}
                      {String(preview.frontmatter.category || 'general')}
                    </div>
                    {preview.frontmatter.description && (
                      <div className="text-muted-foreground line-clamp-2">
                        {String(preview.frontmatter.description)}
                      </div>
                    )}
                  </div>
                )}

                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    {preview.fileTree.length} files
                  </summary>
                  <ul className="mt-1 max-h-40 overflow-auto font-mono">
                    {preview.fileTree.map((f) => (
                      <li
                        key={f.path}
                        className="flex justify-between gap-4 py-0.5"
                      >
                        <span className="truncate">{f.path}</span>
                        <span className="text-muted-foreground shrink-0">
                          {(f.size / 1024).toFixed(1)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label htmlFor="ovr-slug">Override slug (optional)</Label>
                    <Input
                      id="ovr-slug"
                      value={overrideSlug}
                      onChange={(e) => setOverrideSlug(e.target.value)}
                      placeholder={String(preview.frontmatter.slug || '')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ovr-cat">Override category</Label>
                    <select
                      id="ovr-cat"
                      value={overrideCategory}
                      onChange={(e) => setOverrideCategory(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm h-9"
                    >
                      <option value="">— keep bundle&apos;s —</option>
                      {SKILL_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="inline" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="i-name">Name</Label>
                <Input
                  id="i-name"
                  value={iName}
                  onChange={(e) => setIName(e.target.value)}
                  placeholder="My Skill"
                />
              </div>
              <div>
                <Label htmlFor="i-slug">Slug</Label>
                <Input
                  id="i-slug"
                  value={iSlug}
                  onChange={(e) => {
                    setISlugTouched(true);
                    setISlug(e.target.value);
                  }}
                  placeholder="my-skill"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="i-desc">
                Description (also used as trigger hint)
              </Label>
              <Textarea
                id="i-desc"
                rows={3}
                value={iDescription}
                onChange={(e) => setIDescription(e.target.value)}
                placeholder="One-paragraph description of when to use this skill."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="i-cat">Category</Label>
                <select
                  id="i-cat"
                  value={iCategory}
                  onChange={(e) => setICategory(e.target.value)}
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
                <Label htmlFor="i-tags">Tags (comma-separated)</Label>
                <Input
                  id="i-tags"
                  value={iTagsRaw}
                  onChange={(e) => setITagsRaw(e.target.value)}
                  placeholder="research, valuation"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="i-prompt">System prompt</Label>
              <Textarea
                id="i-prompt"
                rows={10}
                value={iPrompt}
                onChange={(e) => setIPrompt(e.target.value)}
                placeholder="You are a senior research analyst. Always cite sources..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          {tab === 'upload' ? (
            <Button
              onClick={handleUploadSubmit}
              disabled={submitting || !file || !preview?.ok}
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Upload skill
            </Button>
          ) : (
            <Button
              onClick={handleInlineSubmit}
              disabled={
                submitting ||
                !iName.trim() ||
                !iDescription.trim() ||
                !iPrompt.trim()
              }
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create skill
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateSkillModal;
