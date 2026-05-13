/**
 * Intercept slash-commands typed into the chat input and route them to the
 * YANG Autopilot APIs instead of the normal chat pipeline.
 *
 * Returns:
 *   - `true`  if the input was consumed (caller should NOT call sendMessage),
 *   - `false` if the input is a normal chat message.
 */
import { parseSlashCommand, memory, schedules } from './client';
import { goalsStore } from './store';

interface Toast {
  success?: (msg: string) => void;
  error?: (msg: string) => void;
}

const cronWordRe = /^(daily|weekday|weekdays|hourly)\s+(.+?)\s+(.+)$/i;
const timeRe = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;

function naturalLanguageToCron(natural: string): { cron: string; prompt: string } | null {
  // "daily 8am Run market briefing"
  const m = natural.match(cronWordRe);
  if (!m) return null;
  const [, freq, timeStr, restRaw] = m;
  const t = timeStr.match(timeRe);
  if (!t) return null;
  let hour = parseInt(t[1], 10);
  const min = t[2] ? parseInt(t[2], 10) : 0;
  const ampm = t[3]?.toLowerCase();
  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  const cron =
    freq.toLowerCase() === 'hourly'  ? `${min} * * * *`
    : freq.toLowerCase().startsWith('weekday') ? `${min} ${hour} * * 1-5`
    : `${min} ${hour} * * *`;
  return { cron, prompt: restRaw.trim() };
}

export async function handleSlashCommand(input: string, toast?: Toast): Promise<boolean> {
  const parsed = parseSlashCommand(input);
  if (!parsed) return false;

  try {
    if (parsed.kind === 'goal') {
      if (!parsed.prompt) {
        toast?.error?.('Usage: /goal <task>');
        return true;
      }
      const g = await goalsStore.create(parsed.prompt);
      toast?.success?.(`Goal started: ${g.title}`);
      return true;
    }

    if (parsed.kind === 'remember') {
      if (!parsed.text) {
        toast?.error?.('Usage: /remember <text>');
        return true;
      }
      // Use first 50 chars as key, full text as value.
      const key = parsed.text.slice(0, 50).replace(/[^a-z0-9]+/gi, '_').toLowerCase().replace(/^_+|_+$/g, '') || `note_${Date.now()}`;
      await memory.save({ key, value: parsed.text, kind: 'fact' });
      toast?.success?.(`Remembered: ${parsed.text.slice(0, 80)}`);
      return true;
    }

    if (parsed.kind === 'schedule') {
      const compiled = naturalLanguageToCron(parsed.raw);
      if (!compiled) {
        toast?.error?.('Usage: /schedule daily 8am <task>  (or weekdays 9am, hourly :15, etc.)');
        return true;
      }
      await schedules.create({
        name: compiled.prompt.slice(0, 60),
        cron: compiled.cron,
        prompt: compiled.prompt,
      });
      toast?.success?.(`Scheduled (${compiled.cron}): ${compiled.prompt.slice(0, 60)}`);
      return true;
    }
  } catch (err) {
    toast?.error?.(err instanceof Error ? err.message : String(err));
    return true;
  }
  return false;
}
