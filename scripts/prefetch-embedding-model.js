// Runs once as `postinstall` (see package.json), right after `npm install`
// on every deploy — the point is to make this download happen during the
// build step (generous timeout, only blocks the deploy) instead of at
// runtime, where a cold, unresolved model was hanging/crashing a live
// /medic-query/ask request on Render's constrained instance. The download
// lands in @xenova/transformers' own default cache dir inside node_modules,
// so the server's normal load at boot (medicQueryModel.loadEmbedder) finds
// it already on disk and loads instantly instead of fetching it again.
const { pipeline } = require("@xenova/transformers");

const EMBEDDING_MODEL = "Xenova/multilingual-e5-base";

(async () => {
  console.log(`Prefetching embedding model (${EMBEDDING_MODEL})...`);
  await pipeline("feature-extraction", EMBEDDING_MODEL);
  console.log("Embedding model cached.");
})().catch((err) => {
  // Non-fatal: don't fail the whole `npm install` over this. Worst case, the
  // server falls back to downloading it lazily at boot/request time, same as
  // before this script existed.
  console.error("Failed to prefetch embedding model:", err);
});
