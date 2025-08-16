import { ChromaClient, Collection } from "chromadb";
import { generateEmbeddings } from "../utils/embeddings";

let client: ChromaClient | null = null;
const collections: Record<string, Collection> = {};

/**
 * Custom embedding function for ChromaDB
 * This uses our own embedding generator and handles errors gracefully
 */
class CustomEmbeddingFunction {
  public readonly sourceID: string = "custom-embedder";

  /**
   * Generate embeddings for documents (required by ChromaDB)
   */
  async generate(texts: string[]): Promise<number[][]> {
    return this.embedDocuments(texts);
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      // Process each text individually to handle errors better
      const embeddings: number[][] = [];
      for (const text of texts) {
        try {
          const embedding = await generateEmbeddings(text);
          embeddings.push(embedding);
        } catch (error) {
          console.error(`Error embedding document: ${error}`);
          // Create a fallback embedding if generation fails
          embeddings.push(this.createFallbackEmbedding(text));
        }
      }
      return embeddings;
    } catch (error) {
      console.error(`Error in embedDocuments: ${error}`);
      // Return fallback embeddings for all texts
      return texts.map((text) => this.createFallbackEmbedding(text));
    }
  }

  /**
   * Generate embedding for a single query
   */
  async embedQuery(text: string): Promise<number[]> {
    try {
      return await generateEmbeddings(text);
    } catch (error) {
      console.error(`Error embedding query: ${error}`);
      return this.createFallbackEmbedding(text);
    }
  }

  /**
   * Create a deterministic fallback embedding when normal embedding fails
   */
  private createFallbackEmbedding(text: string): number[] {
    console.warn("Using fallback embedding generation");

    // Create a simple hash-based embedding
    let seed = Array.from(text.toLowerCase()).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );

    // Generate a vector with 384 dimensions (same as MiniLM models)
    const vector = new Array(384).fill(0).map(() => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    });

    // Normalize the vector
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    return vector.map((v) => v / magnitude);
  }
}

/**
 * Get the embedding function for ChromaDB
 */
async function getEmbeddingFunction(): Promise<CustomEmbeddingFunction> {
  return new CustomEmbeddingFunction();
}

/**
 * Initialize ChromaDB client
 */
async function getClient(): Promise<ChromaClient> {
  if (client) return client;

  // Create a new client for local persistence
  const { ChromaClient } = await import("chromadb");

  // Check for cloud configuration in environment variables
  if (
    process.env.CHROMA_CLOUD_TOKEN &&
    process.env.CHROMA_TENANT_ID &&
    process.env.CHROMA_DATABASE
  ) {
    client = new ChromaClient({
      path: "https://api.trychroma.com:8000",
      auth: {
        provider: "token",
        credentials: process.env.CHROMA_CLOUD_TOKEN,
        tokenHeaderType: "X_CHROMA_TOKEN",
      },
      tenant: process.env.CHROMA_TENANT_ID,
      database: process.env.CHROMA_DATABASE,
    });
    return client;
  }
  const CHROMADB_URL = process.env.CHROMA_DB_PATH || "http://localhost:8000";
  const url = new URL(CHROMADB_URL);

  // Configure client with proper settings
  client = new ChromaClient({
    host: url.hostname,
    port: parseInt(url.port) || 8000,
    ssl: url.protocol === "https:",
    // Add additional options for better connection handling
    fetchOptions: {
      headers: {
        "Content-Type": "application/json",
      },
      mode: "cors",
    },
  });

  return client;
}

/**
 * Get or create a collection
 *
 * @param collectionName The name of the collection to get or create
 * @returns The ChromaDB collection
 */
export async function getCollection(
  collectionName: string = "articles"
): Promise<Collection> {
  // Return cached collection if available
  if (collections[collectionName]) {
    return collections[collectionName];
  }

  try {
    // Get client
    const client = await getClient();
    const existingCollections = await client.listCollections();

    // Get embedding function
    const embedFunc = await getEmbeddingFunction();

    if (
      existingCollections.some(
        (col: { name: string }) => col.name === collectionName
      )
    ) {
      // Get existing collection
      collections[collectionName] = await client.getCollection({
        name: collectionName,
        embeddingFunction: embedFunc,
      });
    } else {
      // Create new collection
      collections[collectionName] = await client.createCollection({
        name: collectionName,
        embeddingFunction: embedFunc,
        metadata: {
          description: `Collection for ${collectionName}`,
        },
      });
    }

    return collections[collectionName];
  } catch (error) {
    console.error(
      `Error getting ChromaDB collection ${collectionName}:`,
      error
    );
    throw error;
  }
}
