/**
 * Represents a step in the solution process
 */
export interface Step {
  explanation: string;
  equation: string;
  is_graphable?: boolean;
}

/**
 * Represents quiz data structure
 */
export interface QuizData {
  question: string;
  options: {
    answer: string;
    correct: boolean;
    hint: string;
  }[];
}

/**
 * Line parameters for equation parsing
 */
export interface LineParams {
  type: 'vertical' | 'horizontal' | 'slope-intercept';
  x?: number;
  y?: number;
  m?: number;
  b?: number;
}
