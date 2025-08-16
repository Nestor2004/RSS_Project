import { Collection, Metadata, QueryResult } from "chromadb";
import { pipeline, env, FeatureExtractionPipeline } from "@xenova/transformers";
import connectToDatabase from "@/lib/db/mongodb";
import { Article, IArticle } from "@/models/Article";
import { getEnv } from "@/lib/env";
import axios from "axios";

// Configuration for vector search
export interface VectorSearchConfig {
  minSimilarity?: number; // Minimum similarity score (0-1)
  maxResults?: number; // Maximum number of results to return
  includeVectors?: boolean; // Whether to include vectors in response
  filters?: {
    dateFrom?: string; // Start date filter
    dateTo?: string; // End date filter
    source?: string; // Source ID filter
    category?: string; // Category filter
  };
}

// Default configuration
const DEFAULT_CONFIG: VectorSearchConfig = {
  minSimilarity: 0.5,
  maxResults: 10,
  includeVectors: false,
  filters: {},
};

// Result interface
export interface VectorSearchResult {
  id: string;
  score: number;
  document: IArticle & { _id: { toString(): string } };
  vector?: number[];
}

/**
 * Class for performing vector search operations
 */
export class VectorSearch {
  private collection: Collection;
  private embeddingModel: FeatureExtractionPipeline | null = null;
  private modelName: string = "Xenova/all-MiniLM-L6-v2";
  private embeddingDimension: number = 384;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private useOpenAI: boolean = false;
  private openAIModel: string = "text-embedding-3-small";
  private fallbackToSimpleMatch: boolean = false;

  constructor(collection: Collection) {
    this.collection = collection;
  }

  /**
   * Initialize the embedding model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          // Check for OpenAI API key first
          const envVars = getEnv();
          if (envVars.OPENAI_API_KEY) {
            console.log("OpenAI API key found, using OpenAI for embeddings");
            this.useOpenAI = true;
            this.isInitialized = true;
            return;
          }

          // Configure the environment for Node.js
          if (
            typeof process !== "undefined" &&
            process.versions &&
            process.versions.node
          ) {
            env.allowLocalModels = true;
            env.localModelPath = "./models";
          }
          this.embeddingModel = await pipeline(
            "feature-extraction",
            this.modelName,
            {
              quantized: false,
              revision: "main",
            }
          );

          this.isInitialized = true;
        } catch (error) {
          console.error("Failed to initialize primary embedding model:", error);

          // Try with a different model as fallback
          try {
            this.modelName = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
            this.embeddingModel = await pipeline(
              "feature-extraction",
              this.modelName,
              {
                quantized: true,
                revision: "main",
              }
            );

            this.isInitialized = true;
          } catch (secondError) {
            console.error(
              "Failed to initialize alternative model:",
              secondError
            );
            console.warn("Falling back to simple text matching");
            this.fallbackToSimpleMatch = true;
            this.isInitialized = true;
          }
        }
      })();
    }

    return this.initPromise;
  }

  /**
   * Generate embeddings for a text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    await this.initialize();

    try {
      // Clean and prepare the text
      const cleanedText = this.preprocessText(text);

      // If using OpenAI
      if (this.useOpenAI) {
        return await this.generateOpenAIEmbedding(cleanedText);
      }

      // If using fallback simple text matching
      if (this.fallbackToSimpleMatch) {
        return this.generateSimpleEmbedding(cleanedText);
      }

      // Generate embedding using local model
      if (!this.embeddingModel) {
        throw new Error("Embedding model not initialized");
      }
      const result = await this.embeddingModel(cleanedText, {
        pooling: "mean",
        normalize: true,
      });

      // Convert to array
      const embedding = Array.from(result.data) as number[];
      return embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);

      // If local model fails, try OpenAI if API key is available
      try {
        const envVars = getEnv();
        if (envVars.OPENAI_API_KEY) {
          console.warn("Local embedding failed, falling back to OpenAI");
          this.useOpenAI = true;
          return await this.generateOpenAIEmbedding(this.preprocessText(text));
        }
      } catch (openAIError) {
        console.error("OpenAI fallback also failed:", openAIError);
      }

      // If all else fails, use simple text embedding
      console.warn("All embedding methods failed, using simple text embedding");
      this.fallbackToSimpleMatch = true;
      return this.generateSimpleEmbedding(this.preprocessText(text));
    }
  }

  /**
   * Generate embeddings using OpenAI API
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    try {
      const envVars = getEnv();
      const response = await axios.post(
        "https://api.openai.com/v1/embeddings",
        {
          input: text,
          model: this.openAIModel,
        },
        {
          headers: {
            Authorization: `Bearer ${envVars.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.data && response.data.data[0]) {
        return response.data.data[0].embedding;
      }

      throw new Error("Invalid response from OpenAI API");
    } catch (error) {
      console.error("OpenAI embedding error:", error);
      throw error;
    }
  }

  /**
   * Generate a simple deterministic embedding based on text content
   * This is used as a last resort when other methods fail
   */
  private generateSimpleEmbedding(text: string): number[] {
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 0);
    const uniqueWords = [...new Set(words)];

    // Create a seed based on the text
    let seed = uniqueWords.reduce((acc, word, i) => {
      return acc + word.charCodeAt(0) * (i + 1);
    }, 0);

    // Generate a consistent vector based on the seed
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Create a 384-dimensional vector (same as the transformer model)
    const vector = new Array(this.embeddingDimension)
      .fill(0)
      .map(() => random() * 2 - 1);

    // Normalize the vector
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    const normalized = vector.map((v) => v / magnitude);

    return normalized;
  }

  /**
   * Preprocess text for embedding
   */
  private preprocessText(text: string): string {
    // Remove excess whitespace
    let cleaned = text.replace(/\s+/g, " ").trim();

    // Truncate if too long (model context limit)
    const maxLength = 512;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }

    return cleaned;
  }

  /**
   * Search by text query
   */
  async searchByText(
    query: string,
    config: VectorSearchConfig = {}
  ): Promise<VectorSearchResult[]> {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search in ChromaDB
      const searchResults = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: mergedConfig.maxResults,
        include: ["metadatas", "documents", "distances"],
      });

      // Process results
      const results = await this.processSearchResults(
        searchResults,
        mergedConfig
      );
      return results;
    } catch (error) {
      console.error("Error searching by text:", error);
      throw error;
    }
  }

  /**
   * Search for similar articles by ID
   */
  async searchSimilarById(
    articleId: string,
    config: VectorSearchConfig = {}
  ): Promise<VectorSearchResult[]> {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    try {
      // Connect to MongoDB
      await connectToDatabase();

      // Find the article
      const article = await Article.findById(articleId);
      if (!article || !article.vectorId) {
        throw new Error("Article not found or has no vector ID");
      }

      // Get the article's vector from ChromaDB
      const vectorResults = await this.collection.get({
        ids: [article.vectorId],
        include: ["embeddings"],
      });

      if (!vectorResults.embeddings || vectorResults.embeddings.length === 0) {
        throw new Error("Vector not found for article");
      }

      // Use the vector to find similar articles
      const searchResults = await this.collection.query({
        queryEmbeddings: [vectorResults.embeddings[0]],
        nResults: (mergedConfig.maxResults || 0) + 1, // +1 to account for the article itself
        include: ["metadatas", "documents", "distances"],
      });

      // Filter out the original article
      const filteredResults = {
        ids: searchResults.ids[0].filter((id) => id !== article.vectorId),
        distances: searchResults.distances
          ? searchResults.distances[0].filter(
              (_, i) => searchResults.ids[0][i] !== article.vectorId
            )
          : [],
        metadatas: searchResults.metadatas
          ? searchResults.metadatas[0].filter(
              (_, i) => searchResults.ids[0][i] !== article.vectorId
            )
          : [],
        documents: searchResults.documents
          ? searchResults.documents[0].filter(
              (_, i) => searchResults.ids[0][i] !== article.vectorId
            )
          : [],
      };

      // Process results
      const results = await this.processSearchResults(
        {
          ids: [filteredResults.ids],
          distances:
            filteredResults.distances.length > 0
              ? [filteredResults.distances]
              : ([] as (number | null)[][]),
          metadatas:
            filteredResults.metadatas.length > 0
              ? [filteredResults.metadatas]
              : ([] as (Metadata | null)[][]),
          documents:
            filteredResults.documents.length > 0
              ? [filteredResults.documents]
              : ([] as (string | null)[][]),
        } as QueryResult<Metadata>,
        mergedConfig
      );

      return results;
    } catch (error) {
      console.error("Error searching similar by ID:", error);
      throw error;
    }
  }

  /**
   * Process search results from ChromaDB
   */
  private async processSearchResults(
    searchResults: QueryResult<Metadata>,
    config: VectorSearchConfig
  ): Promise<VectorSearchResult[]> {
    // Connect to MongoDB
    await connectToDatabase();

    if (
      !searchResults.ids ||
      searchResults.ids.length === 0 ||
      searchResults.ids[0].length === 0
    ) {
      return [];
    }

    const vectorIds = searchResults.ids[0];
    const distances = searchResults.distances ? searchResults.distances[0] : [];

    // Find articles by vector IDs
    const articles = await Article.find({ vectorId: { $in: vectorIds } })
      .populate("feed")
      .lean();

    // Map articles to results with scores
    const results = vectorIds
      .map((vectorId: string, index: number) => {
        // Find the article with this vector ID
        const article = articles.find((a) => a.vectorId === vectorId) as
          | (IArticle & { _id: { toString(): string } })
          | undefined;

        if (!article) return null;

        // Calculate similarity score (convert distance to similarity)
        const distance = distances[index] || 0;
        const score = 1 - distance;

        // Skip if below minimum similarity threshold
        if (score < (config.minSimilarity || 0)) return null;

        // Apply date filters if specified
        if (config.filters?.dateFrom || config.filters?.dateTo) {
          const articleDate = new Date(article.pubDate);

          if (
            config.filters.dateFrom &&
            articleDate < new Date(config.filters.dateFrom)
          ) {
            return null;
          }

          if (
            config.filters.dateTo &&
            articleDate > new Date(config.filters.dateTo)
          ) {
            return null;
          }
        }

        // Apply source filter if specified
        if (
          config.filters?.source &&
          article.feed &&
          typeof article.feed !== "string" &&
          article.feed._id &&
          article.feed._id.toString() !== config.filters.source
        ) {
          return null;
        }

        // Apply category filter if specified
        if (
          config.filters?.category &&
          (!article.categories ||
            !article.categories.includes(config.filters.category))
        ) {
          return null;
        }

        return {
          id: article._id.toString(),
          score,
          document: article,
          vector: config.includeVectors
            ? (article as unknown as { vector: number[] }).vector
            : undefined,
        };
      })
      .filter(Boolean) as VectorSearchResult[];

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);

    // Limit to max results
    return results.slice(0, config.maxResults);
  }

  /**
   * Check if an article is a potential duplicate
   */
  async checkDuplicate(
    article: Partial<IArticle>,
    threshold: number = 0.98
  ): Promise<{
    isDuplicate: boolean;
    similarArticle?: IArticle & { _id: { toString(): string } };
    similarityScore?: number;
  }> {
    try {
      // First check by GUID or link (exact match)
      await connectToDatabase();
      const existingArticle = await Article.findOne({
        $or: [{ guid: article.guid }, { link: article.link }],
      });

      if (existingArticle) {
        return {
          isDuplicate: true,
          similarArticle: existingArticle,
          similarityScore: 1.0, // Exact match
        };
      }

      // If no exact match, check by content similarity
      if (!article.title && !article.description) {
        return { isDuplicate: false };
      }

      // Generate embedding for the article
      const contentText = `${article.title} ${article.description}`.trim();
      const embedding = await this.generateEmbedding(contentText);

      // Search for similar articles
      const searchResults = await this.collection.query({
        queryEmbeddings: [embedding],
        nResults: 1,
        include: ["metadatas", "distances"],
      });

      if (
        !searchResults.ids ||
        searchResults.ids.length === 0 ||
        searchResults.ids[0].length === 0
      ) {
        return { isDuplicate: false };
      }

      const vectorId = searchResults.ids[0][0];
      const distance = searchResults.distances
        ? searchResults.distances[0][0]
        : 1;
      const similarity = distance ? 1 - distance : 0;

      // If similarity is above threshold, consider it a duplicate
      if (similarity >= threshold) {
        const similarArticle = (await Article.findOne({ vectorId }).lean()) as
          | (IArticle & { _id: { toString(): string } })
          | null;

        if (similarArticle) {
          return {
            isDuplicate: true,
            similarArticle,
            similarityScore: similarity,
          };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return { isDuplicate: false };
    }
  }
}
