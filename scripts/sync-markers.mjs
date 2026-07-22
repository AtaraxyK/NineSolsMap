import { writeFile } from "node:fs/promises";

const sourceUrl = "https://ninesolsmap.com/api/markers";
const response = await fetch(sourceUrl);

if (!response.ok) {
  throw new Error(`Marker download failed: ${response.status} ${response.statusText}`);
}

const markers = await response.json();

if (!Array.isArray(markers) || markers.some((marker) => typeof marker?.id !== "string")) {
  throw new Error("Marker response has an unexpected shape");
}

await writeFile(new URL("../public/markers.json", import.meta.url), `${JSON.stringify(markers)}\n`, "utf8");
console.log(`Saved ${markers.length} markers to public/markers.json`);
