import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers"

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
