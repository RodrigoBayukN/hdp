import { pipeline, env } from "@huggingface/transformers";

let extractor: any | undefined
let loadFailed = false

async function getExtractor() {
  if (loadFailed) throw new Error("Embedding service is not available in this environment")
  if (extractor) return extractor

  try {
    env.allowLocalModels = false
    env.useWasmCache = false
    if (env.backends?.onnx) {
      env.backends.onnx.wasm = env.backends.onnx.wasm || {}
      env.backends.onnx.wasm.numThreads = 1
      env.backends.onnx.wasm.simd = true
      env.backends.onnx.wasm.wasmPaths = undefined as any
    }
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      device: "wasm",
    })
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
