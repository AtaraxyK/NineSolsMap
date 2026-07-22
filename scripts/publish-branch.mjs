import { cp, copyFile, mkdir, readdir, unlink } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);
const buildRoot = new URL("pages-dist/", projectRoot);
const publishedAssets = new URL("assets/", projectRoot);
const rootFiles = [
  ".nojekyll",
  "favicon.svg",
  "grotto-west-connections.png",
  "index.html",
  "markers.json",
  "og.png",
];

await mkdir(publishedAssets, { recursive: true });
const builtAssetNames = new Set(await readdir(new URL("assets/", buildRoot)));
const previouslyPublishedAssets = await readdir(publishedAssets, { withFileTypes: true });
await Promise.all(previouslyPublishedAssets
  .filter((entry) => entry.isFile() && !builtAssetNames.has(entry.name))
  .map((entry) => unlink(new URL(entry.name, publishedAssets))));
await cp(new URL("assets/", buildRoot), publishedAssets, { recursive: true, force: true });
await Promise.all(rootFiles.map((file) => copyFile(new URL(file, buildRoot), new URL(file, projectRoot))));
console.log("Copied the static Pages build to the repository root.");
