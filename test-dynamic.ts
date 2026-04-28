const originalNode = process.versions.node
try {
  Object.defineProperty(process.versions, 'node', { value: undefined, writable: true, configurable: true })
} catch (e) {
  process.versions = new Proxy(process.versions, { get: (t, p) => p === 'node' ? undefined : t[p] })
}

import("./node_modules/@huggingface/transformers/dist/transformers.web.js").then(async (mod) => {
  const { pipeline, env } = mod;
  env.allowLocalModels = false;
  const pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log(await pipe("hello world", { pooling: "mean", normalize: true }));
});
