import { pipeline, env } from "@huggingface/transformers"

env.allowLocalModels = false

const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
const output = await extractor("hello world", { pooling: "mean", normalize: true })
console.log(output)
