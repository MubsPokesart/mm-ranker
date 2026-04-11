const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_HASH = "SHA-256";
const DERIVED_KEY_BITS = 256;

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function deriveHashBytes(passcode: string, saltBytes: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passcode),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    DERIVED_KEY_BITS,
  );
  return new Uint8Array(derived);
}

export interface GateConfig {
  hashBase64: string;
  saltBase64: string;
}

export function readGateConfig(): GateConfig | null {
  const hashBase64 = import.meta.env.VITE_DRAFT_MGMT_HASH;
  const saltBase64 = import.meta.env.VITE_DRAFT_MGMT_SALT;
  if (!hashBase64 || !saltBase64) return null;
  return { hashBase64, saltBase64 };
}

export async function verifyPasscode(passcode: string, config: GateConfig): Promise<boolean> {
  try {
    const saltBytes = base64ToBytes(config.saltBase64);
    const expected = base64ToBytes(config.hashBase64);
    const actual = await deriveHashBytes(passcode, saltBytes);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function generateHash(passcode: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const hashBytes = await deriveHashBytes(passcode, saltBytes);
  return { hash: bytesToBase64(hashBytes), salt: bytesToBase64(saltBytes) };
}
