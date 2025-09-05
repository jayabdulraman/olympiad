import { GoogleGenAI } from '@google/genai';

// Initialize the Google GenAI client
export const ai = new GoogleGenAI({apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY});

/**
 * Base agent configuration options
 */
export interface AgentOptions {
  model?: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: object;
}

/**
 * Base agent class with common functionality
 */
export class BaseAgent {
  protected model: string;
  protected systemInstruction: string;
  protected responseMimeType?: string;
  protected responseSchema?: object;

  constructor(options: AgentOptions) {
    this.model = options.model || 'gemini-2.5-flash';
    this.systemInstruction = options.systemInstruction || '';
    this.responseMimeType = options.responseMimeType;
    this.responseSchema = options.responseSchema;
  }

  /**
   * Generate content using the agent
   */
  async generate(prompt: string): Promise<string | object> {
    try {
      const response = await ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: this.systemInstruction,
          responseMimeType: this.responseMimeType,
          responseSchema: this.responseSchema,
        },
      });

      // Handle different response formats based on responseMimeType
      if (this.responseMimeType === 'application/json') {
        return JSON.parse(response.text?.trim() || '{}');
      }

      return response.text || '';
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }
}
