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

  const res = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Form creation failed: ${res.status}`);
  }
  const json = (await res.json()) as FormSubmitResult;
  if (!json.editUrl) {
    throw new Error("Form creation response missing editUrl");
  }
  return json;
}
