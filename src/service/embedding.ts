let extractor: any | undefined
let loadFailed = false

async function getExtractor() {
  if (loadFailed) throw new Error("Embedding service is not available in this environment")
  if (extractor) return extractor

  try {
    const { pipeline, env } = await import("@huggingface/transformers");
    
    env.allowLocalModels = false
    if (env.backends?.onnx?.wasm) {
      env.backends.onnx.wasm.numThreads = 1
    }
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
    return extractor
  } catch (e) {
    console.error("Failed to load transformers:", e);
    loadFailed = true
    throw new Error("Embedding service is not available in this environment")
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  const pipe = await getExtractor()
  const output = await pipe(text, { pooling: "mean", normalize: true })
  return Array.from(output.data as Float32Array)
}
