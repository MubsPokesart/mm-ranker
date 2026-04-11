import { useEffect, useRef, useState } from "react";
import { readGateConfig, verifyPasscode } from "./draftGate";
import { setCachedPasscode } from "./draftGateStorage";
import "./DraftGateModal.css";

interface DraftGateModalProps {
  onUnlock: () => void;
  onClose: () => void;
}

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;

export function DraftGateModal({ onUnlock, onClose }: DraftGateModalProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldownUntil === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const cooldownRemainingMs = Math.max(0, cooldownUntil - now);
  const locked = cooldownRemainingMs > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || locked) return;

    const config = readGateConfig();
    if (!config) {
      setError("Gate is not configured for this build.");
      return;
    }

    setBusy(true);
    setError(null);
    const ok = await verifyPasscode(passcode, config);
    setBusy(false);

    if (ok) {
      setCachedPasscode(passcode);
      onUnlock();
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= MAX_ATTEMPTS) {
      setCooldownUntil(Date.now() + COOLDOWN_MS);
      setAttempts(0);
      setError(`Too many attempts. Try again in ${Math.ceil(COOLDOWN_MS / 1000)}s.`);
    } else {
      setError("Incorrect passcode.");
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="gate-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="gate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
      >
        <h2 id="gate-title" className="gate-title">Draft Management</h2>
        <p className="gate-subtitle">Enter the mod passcode to continue.</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            className="gate-input"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            autoComplete="current-password"
            disabled={busy || locked}
            aria-invalid={error !== null}
          />
          {error && <div className="gate-error" role="alert">{error}</div>}
          {locked && (
            <div className="gate-error" role="status">
              Locked. Retry in {Math.ceil(cooldownRemainingMs / 1000)}s.
            </div>
          )}
          <div className="gate-actions">
            <button
              type="button"
              className="gate-button gate-button--ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gate-button gate-button--primary"
              disabled={busy || locked || passcode.length === 0}
            >
              {busy ? "Verifying…" : "Unlock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
