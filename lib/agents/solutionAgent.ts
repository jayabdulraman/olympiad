import { Type } from '@google/genai';
import { BaseAgent } from './baseAgent';
import { Step } from '../types';

/**
 * Response structure for solution generation
 */
interface SolutionResponse {
  steps: Step[];
}

/**
 * Agent for generating step-by-step algebra solutions
 */
export class SolutionAgent extends BaseAgent {
  constructor() {
    super({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are an expert algebra tutor. The user will provide a problem. Your task is to break down the solution into simple, sequential steps. For each step, provide a short, clear explanation, the corresponding mathematical equation, and an optional boolean 'is_graphable'. Set 'is_graphable' to true ONLY if the equation represents a simple 2D graphable line, such as a linear equation with two variables (e.g., y = 2x + 1) or a single variable solution (e.g., x = 5, y = -2). Otherwise, omit the 'is_graphable' key. Format the equation string using LaTeX syntax and enclose it in block-mode MathJax delimiters ($$...$$). For example: "equation": "$$x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}$$". You MUST use double backslashes for LaTeX commands inside the JSON string. Respond ONLY with a JSON object containing a single key 'steps'.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                explanation: {type: Type.STRING},
                equation: {type: Type.STRING},
                is_graphable: {type: Type.BOOLEAN},
              },
              required: ['explanation', 'equation'],
            },
          },
        },
        required: ['steps'],
      },
    });
  }

  /**
   * Generate a step-by-step solution for an algebra problem
   */
  async generateSolution(problem: string): Promise<Step[]> {
    try {
      const response = await this.generate(problem) as SolutionResponse;
      return response.steps || [];
    } catch (error) {
      console.error('Error generating solution:', error);
      throw error;
    }
  }
}
