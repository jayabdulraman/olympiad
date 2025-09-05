import { Type } from '@google/genai';
import { BaseAgent } from './baseAgent';
import { QuizData } from '../types';

/**
 * Agent for generating quizzes based on algebra problems
 */
export class QuizAgent extends BaseAgent {
  constructor() {
    super({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are a quiz master. Based on the user's algebra problem, create a single multiple-choice question to test their understanding of the core concept. One option must be correct. For the 'answer' fields in the options, if an answer contains mathematical notation, it MUST be formatted using LaTeX syntax enclosed in block-mode MathJax delimiters ($$...$$). You MUST use double backslashes for LaTeX commands inside the JSON string. For incorrect options, provide a brief hint explaining the common mistake.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: {type: Type.STRING, description: 'The quiz question.'},
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                answer: {
                  type: Type.STRING,
                  description:
                    "The answer text for the option. If it contains math, format it with MathJax delimiters ($$...$$).",
                },
                correct: {type: Type.BOOLEAN},
                hint: {
                  type: Type.STRING,
                  description:
                    'A helpful hint if this incorrect answer is chosen.',
                },
              },
              required: ['answer', 'correct', 'hint'],
            },
          },
        },
        required: ['question', 'options'],
      },
    });
  }

  /**
   * Generate a quiz based on an algebra problem
   */
  async generateQuiz(originalProblem: string): Promise<QuizData> {
    try {
      const prompt = `Original Problem: "${originalProblem}". Create a NEW but SIMILAR multiple choice question that tests the same core concept as the original problem. Do not use the exact same numbers or solution.`;
      
      const response = await this.generate(prompt) as QuizData;
      return response;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  }
}
