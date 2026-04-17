import { pipeline, type FeatureExtractionPipeline, env } from "@huggingface/transformers"

// Configure transformers to use WASM backend to avoid native library issues in the binary
env.allowLocalModels = false;

// Defensive configuration for backends
if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}


let extractor: FeatureExtractionPipeline | undefined

async function getExtractor() {
  if (extractor) return extractor
  extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
  return extractor
}

export async function getEmbedding(text: string): Promise<number[]> {
  const pipe = await getExtractor()
  const output = await pipe(text, { pooling: "mean", normalize: true })
  return Array.from(output.data as Float32Array)
}
