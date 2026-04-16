import { toPng } from "html-to-image";
import type { CatalogEntry } from "../matchup/teamCatalog";

export interface FormMatchup {
  home: CatalogEntry;
  away: CatalogEntry;
}

interface SubmitPayload {
  title: string;
  description: string;
  matchups: Array<{
    title: string;
    homeLabel: string;
    awayLabel: string;
    imageBase64: string;
    filename: string;
  }>;
}

export interface FormSubmitResult {
  editUrl: string;
  publishedUrl?: string;
}

const FORM_DESCRIPTION =
  "Vote 0-1 for the left team to win, 0 is win in 2, 1 is win in 3. " +
  "Vote 2-3 for the right team to win, 3 is win in 2, 2 is win in 3";

function slugForFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const MASCOT_MODIFIERS = new Set([
  "rainbow", "yellow", "tar", "horned", "fighting", "big",
  "red", "sun", "blue", "crimson", "mountain",
]);

function shortenTeamName(fullName: string): string {
  const words = fullName.split(/\s+/);
  if (words.length <= 1) return fullName;
  if (words.length >= 3) {
    const secondToLast = words[words.length - 2]!.toLowerCase();
    if (MASCOT_MODIFIERS.has(secondToLast)) {
      return words.slice(0, -2).join(" ");
    }
  }
  return words.slice(0, -1).join(" ");
}

async function captureNodeAsBase64(node: HTMLElement): Promise<string> {
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#ffffff",
  });
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Unexpected dataUrl format");
  return dataUrl.slice(comma + 1);
}

export async function submitForm(
  title: string,
  matchups: FormMatchup[],
  nodes: Array<HTMLElement | null>,
): Promise<FormSubmitResult> {
  const endpoint = import.meta.env.VITE_FORM_APPS_SCRIPT_URL;
  if (!endpoint) {
    throw new Error("Form creation endpoint is not configured.");
  }

  const captured = await Promise.all(
    matchups.map((m, i) => {
      const node = nodes[i];
      if (!node) throw new Error(`Missing preview node for matchup ${i + 1}`);
      return captureNodeAsBase64(node).then((imageBase64) => ({
        title: `${m.home.team.name} vs ${m.away.team.name}`,
        homeLabel: shortenTeamName(m.home.team.name),
        awayLabel: shortenTeamName(m.away.team.name),
        imageBase64,
        filename: `matchup-${slugForFilename(m.home.team.name)}-vs-${slugForFilename(m.away.team.name)}.png`,
      }));
    }),
  );

  const payload: SubmitPayload = {
    title,
    description: FORM_DESCRIPTION,
    matchups: captured,
  };

  const body = new FormData();
  body.append("payload", JSON.stringify(payload));
  const res = await fetch(endpoint, {
    method: "POST",
    body,
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Form creation failed: ${res.status}`);
  }
  const raw = await res.text();
  let json: FormSubmitResult & { error?: string };
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Form creation returned non-JSON response: ${raw.slice(0, 300)}`);
  }
  if (json.error) {
    throw new Error(`Apps Script error: ${json.error}`);
  }
  if (!json.editUrl) {
    throw new Error(`Form creation response missing editUrl. Raw: ${raw.slice(0, 300)}`);
  }
  return json;
}
