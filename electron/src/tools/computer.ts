/**
 * Computer-use tools — full mouse, keyboard, and screen control of any app.
 *
 * Uses @nut-tree-fork/nut-js for cross-platform input + Electron's built-in
 * desktopCapturer for screenshots (more reliable than nut.js screen on
 * Windows and respects OS Screen Recording permission on macOS).
 *
 * Every call goes through guardComputerUse() and pulses the on-screen
 * indicator overlay.
 */
import { desktopCapturer, screen } from 'electron';
import { guardComputerUse } from './sandbox';
import { pulse } from '../overlay/indicator';

// Lazy-load nut.js — it has native deps that are slow to load and we don't
// want to pay the cost on app startup when computer-use is disabled.
let _nut: typeof import('@nut-tree-fork/nut-js') | null = null;
function nut() {
  if (!_nut) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _nut = require('@nut-tree-fork/nut-js');
  }
  return _nut!;
}

export async function screenSize(): Promise<{ width: number; height: number; scaleFactor: number }> {
  await guardComputerUse('computer_screen_size');
  const primary = screen.getPrimaryDisplay();
  pulse('screen_size');
  return {
    width: primary.size.width,
    height: primary.size.height,
    scaleFactor: primary.scaleFactor,
  };
}

export async function screenshot(opts?: { displayIndex?: number }): Promise<{ pngBase64: string; width: number; height: number }> {
  await guardComputerUse('computer_screenshot');
  pulse('screenshot');
  const displays = screen.getAllDisplays();
  const target = displays[opts?.displayIndex ?? 0] || displays[0];
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: target.size.width, height: target.size.height },
  });
  const source = sources.find((s) => String(s.display_id) === String(target.id)) || sources[0];
  if (!source) throw new Error('No screen source available.');
  const img = source.thumbnail;
  const size = img.getSize();
  const png = img.toPNG();
  return { pngBase64: png.toString('base64'), width: size.width, height: size.height };
}

export async function cursorPosition(): Promise<{ x: number; y: number }> {
  await guardComputerUse('computer_cursor_position');
  const p = screen.getCursorScreenPoint();
  return { x: p.x, y: p.y };
}

export async function move(x: number, y: number, opts?: { speed?: number }): Promise<{ x: number; y: number }> {
  await guardComputerUse('computer_move');
  pulse(`move(${x},${y})`);
  const { mouse, straightTo, Point } = nut();
  if (opts?.speed !== undefined) {
    (mouse as any).config.mouseSpeed = opts.speed;
  }
  await mouse.move(straightTo(new Point(x, y)));
  return { x, y };
}

export async function click(opts?: { x?: number; y?: number; button?: 'left' | 'right' | 'middle' }): Promise<{ x: number; y: number; button: string }> {
  await guardComputerUse('computer_click');
  const { mouse, Button, straightTo, Point } = nut();
  if (opts?.x !== undefined && opts?.y !== undefined) {
    await mouse.move(straightTo(new Point(opts.x, opts.y)));
  }
  const btn = opts?.button === 'right' ? Button.RIGHT : opts?.button === 'middle' ? Button.MIDDLE : Button.LEFT;
  pulse(`click ${opts?.button || 'left'}`);
  await mouse.click(btn);
  const p = screen.getCursorScreenPoint();
  return { x: p.x, y: p.y, button: opts?.button || 'left' };
}

export async function doubleClick(x?: number, y?: number): Promise<{ x: number; y: number }> {
  await guardComputerUse('computer_double_click');
  const { mouse, Button, straightTo, Point } = nut();
  if (x !== undefined && y !== undefined) await mouse.move(straightTo(new Point(x, y)));
  pulse('double_click');
  await mouse.doubleClick(Button.LEFT);
  const p = screen.getCursorScreenPoint();
  return { x: p.x, y: p.y };
}

export async function rightClick(x?: number, y?: number): Promise<{ x: number; y: number }> {
  return click({ x, y, button: 'right' });
}

export async function drag(from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await guardComputerUse('computer_drag');
  const { mouse, straightTo, Point } = nut();
  pulse(`drag (${from.x},${from.y})→(${to.x},${to.y})`);
  await mouse.drag([new Point(from.x, from.y), new Point(to.x, to.y)] as any);
}

export async function scroll(direction: 'up' | 'down' | 'left' | 'right', amount: number): Promise<void> {
  await guardComputerUse('computer_scroll');
  const { mouse } = nut();
  pulse(`scroll ${direction} ${amount}`);
  if (direction === 'up') await mouse.scrollUp(amount);
  else if (direction === 'down') await mouse.scrollDown(amount);
  else if (direction === 'left') await mouse.scrollLeft(amount);
  else await mouse.scrollRight(amount);
}

export async function type(text: string, opts?: { delayMs?: number }): Promise<{ length: number }> {
  await guardComputerUse('computer_type');
  const { keyboard } = nut();
  pulse(`type ${text.slice(0, 24)}${text.length > 24 ? '…' : ''}`);
  if (opts?.delayMs) {
    (keyboard as any).config.autoDelayMs = opts.delayMs;
  }
  await keyboard.type(text);
  return { length: text.length };
}

/**
 * Press a key combo expressed like "Ctrl+Shift+T" or a single key like "Escape".
 * Modifiers: Ctrl, Cmd/Meta, Alt, Shift. Names match nut.js Key enum.
 */
export async function key(combo: string): Promise<{ combo: string }> {
  await guardComputerUse('computer_key');
  const { keyboard, Key } = nut();
  pulse(`key ${combo}`);
  const parts = combo.split('+').map((s) => s.trim());
  const mapped = parts.map((p) => {
    const norm = p.toLowerCase();
    const aliases: Record<string, string> = {
      ctrl: 'LeftControl',
      control: 'LeftControl',
      cmd: 'LeftSuper',
      meta: 'LeftSuper',
      win: 'LeftSuper',
      alt: 'LeftAlt',
      shift: 'LeftShift',
      esc: 'Escape',
      enter: 'Return',
      return: 'Return',
      space: 'Space',
      backspace: 'Backspace',
      del: 'Delete',
      delete: 'Delete',
      tab: 'Tab',
      up: 'Up',
      down: 'Down',
      left: 'Left',
      right: 'Right',
      pageup: 'PageUp',
      pagedown: 'PageDown',
      home: 'Home',
      end: 'End',
    };
    const targetName = aliases[norm] || (p.length === 1 ? p.toUpperCase() : p);
    const keyEnum = (Key as unknown as Record<string, number>)[targetName];
    if (keyEnum === undefined) {
      throw new Error(`Unknown key "${p}" in combo "${combo}"`);
    }
    return keyEnum;
  });
  await keyboard.pressKey(...(mapped as any));
  await keyboard.releaseKey(...(mapped as any));
  return { combo };
}
