import { BaseAgent } from './baseAgent';
import { Step } from '../types';

/**
 * Agent for handling follow-up questions about solution steps
 */
export class FollowUpAgent extends BaseAgent {
  constructor() {
    super({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are a helpful algebra tutor. The user is in the middle of a step-by-step solution. Based on the original problem, the current step, and the user's question, provide a concise and helpful answer. If your answer includes any mathematical expressions, fractions, or equations, you MUST format them using LaTeX syntax enclosed in block-mode MathJax delimiters ($$...$$).`,
    });
  }

  /**
   * Generate a response to a follow-up question about a solution step
   */
  async generateFollowUpResponse(
    originalProblem: string,
    currentStep: Step,
    currentStepIndex: number,
    totalSteps: number,
    followUpQuestion: string
  ): Promise<string> {
    try {
      const prompt = `Original Problem: "${originalProblem}"\nWe are on step ${
        currentStepIndex + 1
      } of ${totalSteps}.\nThe equation for this step is:\n${
        currentStep.equation
      }\nThe explanation for this step is:\n"${
        currentStep.explanation
      }"\nUser's Question: "${followUpQuestion}"`;

      const response = await this.generate(prompt) as string;
      return response || '';
    } catch (error) {
      console.error('Error generating follow-up response:', error);
      throw error;
    }
  }
}
