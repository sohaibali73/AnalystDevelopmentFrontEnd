/**
 * Background Computer Use — shared adapter interface.
 *
 * Every backend (Playwright, Windows UI Automation, Virtual Desktop) implements
 * the same shape so the model can use one uniform tool family (`cu_*`) without
 * caring whether it's poking a webpage, a Notepad window, or a background
 * virtual desktop.
 */

export interface TargetInfo {
  id: string;
  kind: 'browser' | 'native' | 'virtual-desktop';
  title: string;
  url?: string;
  createdAt: number;
  meta?: Record<string, unknown>;
}

export interface Point { x: number; y: number; }

export interface Size { width: number; height: number; }

export interface ScreenshotResult {
  pngBase64: string;
  width: number;
  height: number;
}

export interface ClickOpts {
  button?: 'left' | 'right' | 'middle';
  modifiers?: Array<'Ctrl' | 'Shift' | 'Alt' | 'Meta'>;
  delayMs?: number;
}

export interface CuAdapter {
  readonly kind: TargetInfo['kind'];

  /** Idempotent — return existing target or create a new one. */
  openTarget(
    identifier:
      | string
      | { type: 'url'; url: string }
      | { type: 'app'; name: string; args?: string[] }
      | { type: 'window'; title: string },
  ): Promise<TargetInfo>;

  /** Close & dispose. */
  closeTarget(targetId: string): Promise<void>;

  /** List all currently-open targets owned by this adapter. */
  listTargets(): Promise<TargetInfo[]>;

  /** Visual snapshot. */
  screenshot(targetId: string): Promise<ScreenshotResult>;

  /** Logical content for grounding (DOM for browser, UIA tree for native). */
  getContent(targetId: string): Promise<{ kind: 'dom' | 'a11y'; content: unknown }>;

  /** Input. Coordinates are RELATIVE to the target surface. */
  click(targetId: string, x: number, y: number, opts?: ClickOpts): Promise<void>;
  doubleClick(targetId: string, x: number, y: number): Promise<void>;
  type(targetId: string, text: string, opts?: { delayMs?: number }): Promise<void>;
  key(targetId: string, combo: string): Promise<void>;
  scroll(targetId: string, x: number, y: number, dx: number, dy: number): Promise<void>;

  /** Best-effort target dimensions. */
  size(targetId: string): Promise<Size>;

  /** Optional: dispose all targets (called on app quit / kill switch). */
  shutdown(): Promise<void>;
}

export class CuError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
