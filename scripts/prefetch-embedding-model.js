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

// A stalled connection to Hugging Face (not a clean failure — just a hang)
// left this running with no way to finish, blocking `npm install` and the
// whole Render build indefinitely. Bounding it means the build always moves
// on, worst case falling back to loading the model lazily at boot/request
// time, same as before this script existed.
const TIMEOUT_MS = 90_000;

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms));
}

(async () => {
  console.log(`Prefetching embedding model (${EMBEDDING_MODEL})...`);
  await Promise.race([pipeline("feature-extraction", EMBEDDING_MODEL), timeout(TIMEOUT_MS)]);
  console.log("Embedding model cached.");
})()
  .catch((err) => {
    // Non-fatal: don't fail the whole `npm install` over this.
    console.error("Failed to prefetch embedding model:", err.message || err);
  })
  .finally(() => {
    // A stalled fetch can keep sockets/handles open even after we've given
    // up above — force the process to exit so this can never hang npm
    // install (and the whole build) past the timeout.
    process.exit(0);
  });
