import { pipeline, env } from "@xenova/transformers";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";

// Define the type for the embedder
type Embedder = {
  (text: string, options: { pooling: string; normalize: boolean }): Promise<{
    data: Float32Array;
  }>;
};

// Global variables
let _embedder: Embedder | null = null;
let _embeddingMethod: "transformers" | "openai" | "fallback" = "transformers";
const MODEL_DIMENSION = 384; // Dimension for MiniLM models
const MODELS_DIR = path.resolve(process.cwd(), "models");

/**
 * Configure the Node.js environment for transformers.js
 */
function configureNodeEnvironment() {
  // Create models directory if it doesn't exist
  if (!fs.existsSync(MODELS_DIR)) {
    try {
      fs.mkdirSync(MODELS_DIR, { recursive: true });
      console.log(`Created models directory at ${MODELS_DIR}`);
    } catch (err) {
      console.error(`Failed to create models directory: ${err}`);
    }
  }

  // Configure transformers.js environment
  env.allowLocalModels = true;
  env.localModelPath = MODELS_DIR;
}

/**
 * Initialize and return the embedding model
 */
export async function getEmbedder() {
  if (_embedder) return _embedder;

  // Check for OpenAI API key first
  if (process.env.OPENAI_API_KEY) {
    try {
      // Test the OpenAI connection with a simple request
      const response = await axios.post(
        "https://api.openai.com/v1/embeddings",
        {
          input: "test",
          model: "text-embedding-3-small",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.data && response.data.data[0]) {
        _embeddingMethod = "openai";
        _embedder = createOpenAIEmbedder();
        return _embedder;
      }
    } catch (error) {
      console.warn("OpenAI API available but test failed:", error);
    }
  }

  // If OpenAI is not available or failed, try transformers.js
  try {
    // Configure Node.js environment
    if (
      typeof process !== "undefined" &&
      process.versions &&
      process.versions.node
    ) {
      configureNodeEnvironment();
    }
    _embedder = (await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      {
        quantized: true,
        revision: "main",
      }
    )) as unknown as Embedder;
    _embeddingMethod = "transformers";
    return _embedder;
  } catch (firstError) {
    console.error("Primary model initialization failed:", firstError);

    // Try with an alternative model
    try {
      _embedder = (await pipeline(
        "feature-extraction",
        "Xenova/paraphrase-MiniLM-L3-v2", // Smaller model
        {
          quantized: true,
          revision: "main",
        }
      )) as unknown as Embedder;
      _embeddingMethod = "transformers";
      return _embedder;
    } catch (secondError) {
      console.error("Alternative model failed too:", secondError);

      // Fall back to deterministic vector generation
      console.warn("All models failed, using fallback vector generation");
      _embeddingMethod = "fallback";
      _embedder = createFallbackEmbedder();
      return _embedder;
    }
  }
}

/**
 * Create an OpenAI-based embedder
 */
function createOpenAIEmbedder(): Embedder {
  return async (
    text: string,
    options: { pooling: string; normalize: boolean }
  ) => {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/embeddings",
        {
          input: text,
          model: "text-embedding-3-small",
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.data && response.data.data[0]) {
        // Convert to Float32Array for compatibility
        const embedding = new Float32Array(response.data.data[0].embedding);
        return { data: embedding };
      }

      throw new Error("Invalid response from OpenAI API");
    } catch (error) {
      console.error("OpenAI embedding failed, using fallback:", error);
      // Fall back to deterministic embedding if OpenAI fails
      return createFallbackEmbedder()(text, options);
    }
  };
}

/**
 * Create a fallback embedder that generates deterministic vectors
 */
function createFallbackEmbedder(): Embedder {
  return async (
    text: string,
    options: { pooling: string; normalize: boolean }
  ) => {
    // Create a deterministic hash-based embedding
    let seedValue = Array.from(text.toLowerCase()).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );

    // Generate a consistent vector based on the seed
    const random = () => {
      const x = Math.sin(seedValue++) * 10000;
      return x - Math.floor(x);
    };

    // Create a vector with the same dimensions as the model would return
    const vector = new Float32Array(MODEL_DIMENSION)
      .fill(0)
      .map(() => random() * 2 - 1);

    // Normalize if requested
    if (options?.normalize) {
      const magnitude = Math.sqrt(
        Array.from(vector).reduce((sum, val) => sum + val * val, 0)
      );
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    return { data: vector };
  };
}

/**
 * Generate embeddings for a text string
 */
export async function generateEmbeddings(text: string): Promise<number[]> {
  // Handle empty or invalid text
  if (!text || typeof text !== "string") {
    console.warn("Invalid text provided for embedding, using empty string");
    text = "";
  }

  // Trim and truncate text to avoid issues with very long inputs
  const processedText = text.trim().substring(0, 8000);

  try {
    // Get the embedder (will initialize if needed)
    const embedder = await getEmbedder();

    // Generate embedding
    const result = await embedder(processedText, {
      pooling: "mean",
      normalize: true,
    });

    // Convert to regular array and return
    return Array.from(result.data);
  } catch (error) {
    console.error("Error generating embeddings:", error);

    // If all else fails, use the fallback embedder directly
    console.warn("Using emergency fallback for embedding generation");
    try {
      const fallbackEmbedder = createFallbackEmbedder();
      const result = await fallbackEmbedder(processedText, {
        pooling: "mean",
        normalize: true,
      });
      return Array.from(result.data);
    } catch (fallbackError) {
      console.error("Even fallback embedding failed:", fallbackError);
      throw new Error(
        `Failed to generate embeddings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

/**
 * Get the current embedding method being used
 */
export function getEmbeddingMethod(): string {
  return _embeddingMethod;
}
