// AI Provider Abstraction Layer
export interface EmbeddingProvider {
  generateTextEmbedding(text: string): Promise<number[]>;
  generateImageEmbedding(imageBuffer: Buffer): Promise<number[]>;
}

export class LocalEmbeddingProvider implements EmbeddingProvider {
  async generateTextEmbedding(text: string): Promise<number[]> {
    // Stub implementation - returns mock 384-dim embedding
    return Array.from({ length: 384 }, () => Math.random());
  }

  async generateImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
    // Stub implementation - returns mock 384-dim embedding
    return Array.from({ length: 384 }, () => Math.random());
  }
}

export class HuggingFaceEmbeddingProvider implements EmbeddingProvider {
  constructor(private apiKey: string) {}

  async generateTextEmbedding(text: string): Promise<number[]> {
    // Stub - would make actual HF API call
    console.log("HF Text Embedding for:", text.slice(0, 50));
    return Array.from({ length: 384 }, () => Math.random());
  }

  async generateImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
    // Stub - would make actual HF API call
    console.log("HF Image Embedding, buffer size:", imageBuffer.length);
    return Array.from({ length: 384 }, () => Math.random());
  }
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  constructor(private apiKey: string) {}

  async generateTextEmbedding(text: string): Promise<number[]> {
    // Stub - would make actual OpenAI API call
    console.log("OpenAI Text Embedding for:", text.slice(0, 50));
    return Array.from({ length: 384 }, () => Math.random());
  }

  async generateImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
    // Stub - would make actual OpenAI CLIP API call
    console.log("OpenAI Image Embedding, buffer size:", imageBuffer.length);
    return Array.from({ length: 384 }, () => Math.random());
  }
}

export function createEmbeddingProvider(
  type: string,
  apiKey?: string
): EmbeddingProvider {
  switch (type) {
    case "huggingface":
      if (!apiKey) throw new Error("HuggingFace API key required");
      return new HuggingFaceEmbeddingProvider(apiKey);
    case "openai":
      if (!apiKey) throw new Error("OpenAI API key required");
      return new OpenAIEmbeddingProvider(apiKey);
    case "local":
    default:
      return new LocalEmbeddingProvider();
  }
}

// Spell Correction
export interface SpellCorrector {
  suggest(query: string, language: "en" | "ar"): string[];
}

export class SimpleSpellCorrector implements SpellCorrector {
  private synonyms: Record<string, string> = {
    // Arabic synonyms
    "هودي": "hoodie",
    "جينز": "jeans",
    "تيشيرت": "t-shirt",
    "جاكيت": "jacket",
    
    // English corrections
    "hodie": "hoodie",
    "hoddie": "hoodie",
    "tshirt": "t-shirt",
    "jaket": "jacket",
  };

  suggest(query: string, language: "en" | "ar"): string[] {
    const normalized = query.toLowerCase().trim();
    const suggestions: string[] = [];

    // Check for exact synonym match
    if (this.synonyms[normalized]) {
      suggestions.push(this.synonyms[normalized]);
    }

    // Simple Levenshtein-based suggestions (stub)
    Object.keys(this.synonyms).forEach((key) => {
      if (key.includes(normalized) || normalized.includes(key)) {
        if (!suggestions.includes(this.synonyms[key])) {
          suggestions.push(this.synonyms[key]);
        }
      }
    });

    return suggestions.slice(0, 3);
  }

  addSynonym(from: string, to: string) {
    this.synonyms[from.toLowerCase()] = to;
  }
}

export const spellCorrector = new SimpleSpellCorrector();
