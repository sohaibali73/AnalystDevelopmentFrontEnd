/**
 * Kill-switch passcode management.
 *
 * The kill switch is a one-way panic state that disables all tool execution.
 * To re-enable, the user must supply the passcode they set during first-run
 * onboarding. This defends against prompt-injection attacks where a malicious
 * tool result could try to trick the agent into disabling its own safeguards.
 */
import * as bcrypt from 'bcryptjs';
import { getStore } from './store';

const BCRYPT_ROUNDS = 12;

export async function setPasscode(plain: string): Promise<void> {
  if (!plain || plain.length < 4) {
    throw new Error('Passcode must be at least 4 characters.');
  }
  const hash = await bcrypt.hash(plain, BCRYPT_ROUNDS);
  getStore().patch({ passcodeHash: hash });
}

export async function verifyPasscode(plain: string): Promise<boolean> {
  const { passcodeHash } = getStore().get();
  if (!passcodeHash) return false;
  try {
    return await bcrypt.compare(plain, passcodeHash);
  } catch {
    return false;
  }
}

export function hasPasscode(): boolean {
  return !!getStore().get().passcodeHash;
}
