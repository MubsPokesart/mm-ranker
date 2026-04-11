#!/usr/bin/env node
// Generates VITE_DRAFT_MGMT_HASH and VITE_DRAFT_MGMT_SALT for the Draft Management gate.
// Usage:  node scripts/hash-passcode.mjs
// Then paste the passcode (input is hidden). Output goes to stdout.

import { webcrypto } from "node:crypto";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_HASH = "SHA-256";
const DERIVED_KEY_BITS = 256;

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

async function deriveHash(passcode, saltBytes) {
  const keyMaterial = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passcode),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    DERIVED_KEY_BITS,
  );
  return new Uint8Array(derived);
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    const originalWrite = rl._writeToOutput?.bind(rl);
    if (originalWrite) {
      rl._writeToOutput = (chunk) => {
        if (chunk.includes(question)) originalWrite(chunk);
        else originalWrite("*");
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      stdout.write("\n");
      resolve(answer);
    });
  });
}

const passcode = await promptHidden("Enter passcode: ");
if (!passcode) {
  console.error("No passcode entered.");
  process.exit(1);
}

const saltBytes = webcrypto.getRandomValues(new Uint8Array(16));
const hashBytes = await deriveHash(passcode, saltBytes);

console.log("");
console.log("Add these to .env.local (dev) and your GitHub Actions secrets (deploy):");
console.log("");
console.log(`VITE_DRAFT_MGMT_HASH=${bytesToBase64(hashBytes)}`);
console.log(`VITE_DRAFT_MGMT_SALT=${bytesToBase64(saltBytes)}`);
console.log("");
