import { Type } from '@google/genai';
import { BaseAgent } from './baseAgent';

/**
 * Response structure for scope checking
 */
interface ScopeResponse {
  in_scope: boolean;
}

/**
 * Agent for checking if a problem is within the scope of algebra
 */
export class ScopeAgent extends BaseAgent {
  constructor() {
    super({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are a scoping agent for an algebra tutor. Your task is to determine if the user's prompt is an algebra problem. This includes topics like basic algebra (e.g., solving single-variable equations), systems of linear equations, matrices, and vectors. It does NOT include more advanced linear algebra topics like determinants, eigenvalues, or linear transformations, nor does it include calculus, statistics, logarithms, or general non-math questions. Respond ONLY with a JSON object with a single key "in_scope" which is a boolean.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          in_scope: {
            type: Type.BOOLEAN,
            description: 'Whether the prompt is an algebra problem.',
          },
        },
        required: ['in_scope'],
      },
    });
  }

  /**
   * Check if a problem is within the scope of algebra
   */
  async checkScope(problem: string): Promise<boolean> {
    try {
      const response = await this.generate(problem) as ScopeResponse;
      return response.in_scope;
    } catch (error) {
      console.error('Error checking scope:', error);
      // Default to true to avoid blocking users unnecessarily on error
      return true;
    }
  }
}
