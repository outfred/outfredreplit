import { GoogleGenerativeAI } from "@google/generative-ai";

// AI Provider Abstraction Layer
export interface EmbeddingProvider {
  generateTextEmbedding(text: string): Promise<number[]>;
  generateImageEmbedding(imageBuffer: Buffer): Promise<number[]>;
}

export interface OutfitSuggestionProvider {
  generateOutfitSuggestions(params: {
    userHeight: number;
    userWeight: number;
    aiPrompt: string;
    availableProducts: { id: string; nameEn: string; category: string }[];
  }): Promise<{
    topProductId: string;
    bottomProductId: string;
    shoeRecommendation: { brandName: string; model: string; reason: string };
    reasoning: string;
  }>;
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

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateTextEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error("Gemini Text Embedding Error:", error);
      // Fallback to random embedding on error
      return Array.from({ length: 768 }, () => Math.random());
    }
  }

  async generateImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
    try {
      // Gemini API doesn't support direct image embeddings yet
      // Strategy: Use vision model to describe image, then embed description
      const visionModel = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };
      
      // Generate text description of image
      const descriptionResult = await visionModel.generateContent([
        "Describe this fashion product in detail: style, color, type, material, and key features.",
        imagePart
      ]);
      const description = descriptionResult.response.text();
      
      // Embed the description
      const embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
      const embeddingResult = await embeddingModel.embedContent(description);
      return embeddingResult.embedding.values;
    } catch (error) {
      console.error("Gemini Image Embedding Error:", error);
      // Fallback to random embedding on error
      return Array.from({ length: 768 }, () => Math.random());
    }
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
    case "gemini":
      if (!apiKey) throw new Error("Gemini API key required");
      return new GeminiEmbeddingProvider(apiKey);
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

// Gemini Outfit Suggestion Provider
export class GeminiOutfitSuggestionProvider implements OutfitSuggestionProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateOutfitSuggestions(params: {
    userHeight: number;
    userWeight: number;
    aiPrompt: string;
    availableProducts: { id: string; nameEn: string; category: string }[];
  }): Promise<{
    topProductId: string;
    bottomProductId: string;
    shoeRecommendation: { brandName: string; model: string; reason: string };
    reasoning: string;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      
      const tops = params.availableProducts.filter(p => 
        ['top', 'shirt', 't-shirt', 'hoodie', 'jacket', 'sweater', 'blazer'].includes(p.category.toLowerCase())
      );
      const bottoms = params.availableProducts.filter(p => 
        ['bottom', 'pants', 'jeans', 'shorts', 'skirt', 'trousers'].includes(p.category.toLowerCase())
      );
      
      const prompt = `You are a professional fashion stylist. Create an outfit recommendation based on:

User Profile:
- Height: ${params.userHeight}cm
- Weight: ${params.userWeight}kg
- Style Request: ${params.aiPrompt}

Available Tops:
${tops.map(t => `- ${t.id}: ${t.nameEn} (${t.category})`).join('\n')}

Available Bottoms:
${bottoms.map(b => `- ${b.id}: ${b.nameEn} (${b.category})`).join('\n')}

Available Shoe Brands: Nike, Adidas, Puma, New Balance, Converse, Vans, Reebok, Skechers, ASICS, Under Armour

Task: Select ONE top, ONE bottom, and recommend ONE shoe model that work together.

Respond in JSON format:
{
  "topProductId": "selected_top_id",
  "bottomProductId": "selected_bottom_id",
  "shoeRecommendation": {
    "brandName": "brand_name",
    "model": "specific_model_name",
    "reason": "why this shoe completes the outfit"
  },
  "reasoning": "explanation of why these items work together for this user"
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       responseText.match(/(\{[\s\S]*\})/);
      
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      
      const suggestion = JSON.parse(jsonMatch[1]);
      
      return {
        topProductId: suggestion.topProductId,
        bottomProductId: suggestion.bottomProductId,
        shoeRecommendation: suggestion.shoeRecommendation,
        reasoning: suggestion.reasoning
      };
    } catch (error) {
      console.error("Gemini Outfit Suggestion Error:", error);
      // Fallback: Random selection
      const tops = params.availableProducts.filter(p => 
        ['top', 'shirt', 't-shirt', 'hoodie', 'jacket'].includes(p.category.toLowerCase())
      );
      const bottoms = params.availableProducts.filter(p => 
        ['bottom', 'pants', 'jeans', 'shorts'].includes(p.category.toLowerCase())
      );
      
      return {
        topProductId: tops[Math.floor(Math.random() * tops.length)]?.id || params.availableProducts[0].id,
        bottomProductId: bottoms[Math.floor(Math.random() * bottoms.length)]?.id || params.availableProducts[1].id,
        shoeRecommendation: {
          brandName: "Nike",
          model: "Air Force 1",
          reason: "Classic versatile sneaker that matches most outfits"
        },
        reasoning: "Randomly selected due to AI error"
      };
    }
  }
}

export function createOutfitSuggestionProvider(apiKey: string): OutfitSuggestionProvider {
  return new GeminiOutfitSuggestionProvider(apiKey);
}
