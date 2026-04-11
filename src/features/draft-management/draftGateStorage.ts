import { STORAGE_KEY_PREFIX } from "../../config/constants";

const PASSCODE_KEY = `${STORAGE_KEY_PREFIX}-draft-mgmt-passcode`;

export function getCachedPasscode(): string | null {
  try {
    return localStorage.getItem(PASSCODE_KEY);
  } catch {
    return null;
  }
}

export function setCachedPasscode(passcode: string): void {
  try {
    localStorage.setItem(PASSCODE_KEY, passcode);
  } catch {
    // localStorage unavailable — silent no-op, user will be re-prompted next time
  }
}

export function clearCachedPasscode(): void {
  try {
    localStorage.removeItem(PASSCODE_KEY);
  } catch {
    // ignore
  }
}
