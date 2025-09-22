"use client";

import {
  BarChart,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  SendHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import { parseError } from '@/lib/utils';
import { useVisitorStore } from '@/lib/visitorStore';
import { logAnalyticsEvent } from '@/lib/analyticsService';
import { checkRateLimit, incrementRateLimit } from '@/lib/rateLimitService';
import { RateLimitBanner } from '@/components/RateLimitBanner';
import { Step, QuizData } from '@/lib/types';
import { GraphCanvas } from '@/components/GraphCanvas';
import { ScopeAgent, SolutionAgent, FollowUpAgent, QuizAgent } from '@/lib/agents';

// Extend the Window interface to include MathJax
declare global {
  interface Window {
    MathJax: {
      typesetPromise: (elements?: Element[]) => Promise<void>;
      startup: {
        defaultPageReady: () => Promise<void>;
      };
    };
  }
}

// Initialize agents
const scopeAgent = new ScopeAgent();
const solutionAgent = new SolutionAgent();
const followUpAgent = new FollowUpAgent();
const quizAgent = new QuizAgent();

export default function HomePage() {
  const equationContainerRef = useRef<HTMLDivElement | null>(null);
  const followUpResponseRef = useRef<HTMLDivElement | null>(null);
  const quizDrawerRef = useRef<HTMLDivElement | null>(null);
  const stepExplanationContainerRef = useRef<HTMLDivElement | null>(null);

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [scopeError, setScopeError] = useState('');
  const [, setRateLimitError] = useState('');
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const { } = useVisitorStore();
  const [showGraphModal, setShowGraphModal] = useState(false);

  // Follow-up questions state
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // Quiz State
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuizDrawer, setShowQuizDrawer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  // Email signup state
  const [email, setEmail] = useState('');
  const [emailSubmissionStatus, setEmailSubmissionStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  // Check for rate limit from Upstash on component mount
  useEffect(() => {
    const checkRateLimitOnLoad = async () => {
      try {
        // Use our service to check rate limit
        const result = await checkRateLimit();
        
        if (!result.allowed) {
          setRateLimitResetTime(result.resetsAt);
          setRateLimitError(`You have reached the limit of 5 problems per day.`);
          setIsRateLimited(true);
        } else {
          // If the rate limit is not exceeded, ensure we're not showing the banner
          setIsRateLimited(false);
          setRateLimitError('');
          setRateLimitResetTime(null);
        }
      } catch (error) {
        console.error('Error checking rate limit on load:', error);
      }
    };
    
    // Run this effect when the component mounts
    checkRateLimitOnLoad();
  }, []);

  // Render MathJax equation for main whiteboard
  useEffect(() => {
    const container = equationContainerRef.current;
    if (steps.length > 0 && container) {
      console.log("Attempting to render equation:", steps[currentStep].equation);
      container.innerText = steps[currentStep].equation;
      
      if (window.MathJax) {
        console.log("MathJax is available");
        if (window.MathJax.typesetPromise) {
          console.log("MathJax.typesetPromise is available");
          window.MathJax.typesetPromise([container])
            .then(() => console.log("MathJax typesetting completed"))
            .catch((err: Error) => {
              console.error('MathJax typesetting error:', err);
              container.innerText = steps[currentStep].equation; // Fallback
            });
        } else {
          console.error("MathJax.typesetPromise is not available");
        }
      } else {
        console.error("MathJax is not available");
      }
    }
  }, [steps, currentStep]);

  // Render MathJax for follow-up response
  useEffect(() => {
    const container = followUpResponseRef.current;
    if (followUpResponse && container) {
      if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([container]).catch((err: Error) => {
          console.error('MathJax typesetting error in follow-up:', err);
        });
      }
    }
  }, [followUpResponse]);

  // Render MathJax for quiz drawer
  useEffect(() => {
    const container = quizDrawerRef.current;
    if (showQuizDrawer && quizData && container) {
      if (window.MathJax?.typesetPromise) {
        // Delay to allow drawer animation
        setTimeout(() => {
          window.MathJax.typesetPromise([container]).catch((err: Error) => {
            console.error('MathJax typesetting error in quiz:', err);
          });
        }, 300); // Match animation duration
      }
    }
  }, [showQuizDrawer, quizData]);

  // Render MathJax for step explanation
  useEffect(() => {
    const container = stepExplanationContainerRef.current;
    if (steps.length > 0 && container) {
      if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([container]).catch((err: Error) => {
          console.error('MathJax typesetting error in explanation:', err);
        });
      }
    }
  }, [steps, currentStep]);

  const clearTutorState = () => {
    if (equationContainerRef.current) {
      equationContainerRef.current.innerHTML = '';
    }
    setSteps([]);
    setCurrentStep(0);
    setPrompt('');
    setFollowUpPrompt('');
    setFollowUpResponse('');
    setScopeError('');
    // Reset quiz state
    setQuizData(null);
    setShowQuizDrawer(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setIsQuizLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    // Always check rate limit first before any API calls
    try {
      // Use our service to check and increment rate limit
      const result = await incrementRateLimit();
      
      if (!result.allowed) {
        setRateLimitResetTime(result.resetsAt);
        setRateLimitError(
          `You have reached the limit of 5 problems per day.`
        );
        setIsRateLimited(true);
        await logAnalyticsEvent('rate_limit_hit');
        return; // Block request - don't proceed to any API calls
      }
    } catch (error) {
      // In production, you might want to block the request on error
      console.error('Error checking rate limit:', error);
    }

    setIsLoading(true);
    // Don't clear the whole state yet, just the previous steps and errors
    setSteps([]);
    setCurrentStep(0);
    setScopeError('');
    // Don't clear rate limit error here - it should persist until reset time

    try {
      // 1. Scope Check
      const isInScope = await scopeAgent.checkScope(prompt);
      
      if (!isInScope) {
        setScopeError(
          'This question appears to be outside the scope of algebra. Please try another problem.',
        );
        await logAnalyticsEvent('scope_failure');
        setIsLoading(false);
        return;
      }

      // 2. Generate Solution (if in scope)
      const steps = await solutionAgent.generateSolution(prompt);
      
      if (steps && Array.isArray(steps)) {
        setSteps(steps);
        await logAnalyticsEvent('problem_submitted');
      } else {
        throw new Error('Invalid response format from the API.');
      }
    } catch (error) {
      console.error('Error submitting problem:', error);
      setErrorMessage((error as Error).message || 'An unexpected error occurred.');
      setShowErrorModal(true);
      await logAnalyticsEvent('api_error_submit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpPrompt) return;
    setIsFollowUpLoading(true);
    setFollowUpResponse('');

    try {
      const currentStepData = steps[currentStep];
      
      const response = await followUpAgent.generateFollowUpResponse(
        prompt,
        currentStepData,
        currentStep,
        steps.length,
        followUpPrompt
      );

      setFollowUpResponse(response);
      await logAnalyticsEvent('follow_up_submitted');
    } catch (error) {
      console.error('Error submitting follow-up:', error);
      setErrorMessage(
        `Follow-up question failed: ${
          (error as Error).message || 'An unexpected error occurred.'
        }`,
      );
      setShowErrorModal(true);
      await logAnalyticsEvent('api_error_followup');
    } finally {
      setIsFollowUpLoading(false);
      setFollowUpPrompt('');
    }
  };

  const handleGenerateQuiz = async () => {
    setIsQuizLoading(true);
    setFeedback(null);
    setSelectedAnswer(null);

    try {
      const quizData = await quizAgent.generateQuiz(prompt);
      
      if (quizData.question && quizData.options) {
        setQuizData(quizData);
        setShowQuizDrawer(true);
        await logAnalyticsEvent('quiz_generated');
      } else {
        throw new Error('Invalid quiz format from API.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setErrorMessage(
        `Failed to generate quiz: ${
          (error as Error).message || 'An unexpected error occurred.'
        }`,
      );
      setShowErrorModal(true);
      await logAnalyticsEvent('api_error_quiz');
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleAnswerSelect = (option: QuizData['options'][0], index: number) => {
    setSelectedAnswer(index);
    if (option.correct) {
      setFeedback({correct: true, message: 'Correct! Well done.'});
    } else {
      setFeedback({
        correct: false,
        message: `Not quite. Hint: ${option.hint}`,
      });
    }
  };

  const openQuizDrawer = () => {
    setSelectedAnswer(null);
    setFeedback(null);
    setShowQuizDrawer(true);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setFollowUpResponse('');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setFollowUpResponse('');
    }
  };

  const handleCloseQuizDrawer = () => {
    setShowQuizDrawer(false);
    // If the answer was correct, clear the board after the drawer closes
    if (feedback?.correct) {
      setTimeout(() => {
        clearTutorState();
        setPrompt(''); // Also clear the prompt in the input bar
      }, 300); // Match animation duration
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || emailSubmissionStatus === 'loading') return;

    setEmailSubmissionStatus('loading');
    // IMPORTANT: Replace this placeholder with your own Google Apps Script Web App URL.
    const googleSheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL;
    if (!googleSheetUrl) {
      console.error('Google Sheet URL is not defined');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('email', email);

      await fetch(googleSheetUrl, {
        method: 'POST',
        body: formData,
        mode: 'no-cors', // 'no-cors' is needed for simple POSTs to Google Scripts from another domain.
      });

      // Since 'no-cors' mode prevents reading the response, we optimistically assume success.
      setEmailSubmissionStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Email submission error:', error);
      setEmailSubmissionStatus('error');
      // Reset the form after a few seconds on error
      setTimeout(() => setEmailSubmissionStatus('idle'), 3000);
    }
  };

  return (
    <>
      <div className="min-h-screen notebook-paper-bg text-gray-900 flex flex-col justify-start items-center">
        <main className="container mx-auto px-3 sm:px-6 py-5 sm:py-10 pb-48 max-w-5xl w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-2 sm:mb-6 gap-2 font-mono">
            <div>
              <h1 className="text-2l sm:text-3xl font-bold mb-0 leading-tight">
                Olympiad - Algebra Tutor
              </h1>
              <p className="!text-sm sm:text-base text-gray-500 mt-1">
                Walk through an algebra problem step-by-step. Limited to foundational algebra!
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <a
                href="https://forms.gle/dxDgHHzixM2M477x5"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-black font-semibold rounded-none border-2 border-black ml-[-2px] transition-colors disabled:bg-gray-300 disabled:cursor-wait flex items-center justify-center">
                Help us improve
              </a>
              <button
                type="button"
                onClick={() => {
                  clearTutorState();
                  setPrompt(''); // Ensure prompt in input bar is cleared
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-all hover:bg-gray-50 hover:scale-110 ring-1 ring-gray-300 cursor-pointer">
                <Trash2
                  className="w-5 h-5 text-gray-700"
                  aria-label="Clear whiteboard and steps"
                />
              </button>
            </div>
          </div>

          <div className="w-full mb-4">
            <div
              ref={equationContainerRef}
              className="border-2 border-black w-full sm:h-[50vh] h-[30vh] min-h-[320px] bg-white/90 flex items-center justify-center p-4 overflow-auto text-2xl sm:text-3xl"
            />
          </div>

          {steps.length > 0 && !isLoading && (
            <div className="w-full mb-6 p-4 border-2 border-black bg-yellow-100/50 flex flex-col gap-4">
              <div ref={stepExplanationContainerRef}>
                <p className="font-bold text-gray-700 mb-2">
                  Step {currentStep + 1} of {steps.length}:
                </p>
                <p className="text-gray-800 font-mono">
                  {steps[currentStep].explanation}
                </p>
              </div>
              <div className="flex justify-end items-center gap-3 flex-wrap">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className="px-4 py-2 flex items-center gap-2 bg-white border-2 border-black text-black hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-5 h-5" /> Previous
                </button>

                {steps[currentStep]?.is_graphable && (
                  <button
                    onClick={() => setShowGraphModal(true)}
                    className="px-4 py-2 flex items-center gap-2 bg-blue-600 border-2 border-blue-600 text-white hover:bg-blue-700 transition-colors">
                    <BarChart className="w-5 h-5" />
                    Visualize
                  </button>
                )}

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNextStep}
                    disabled={currentStep >= steps.length - 1}
                    className="px-4 py-2 flex items-center gap-2 bg-black border-2 border-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                    Next <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={quizData ? openQuizDrawer : handleGenerateQuiz}
                    disabled={isQuizLoading}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isQuizLoading ? (
                      <>
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : quizData && !feedback?.correct ? (
                      'Try Problem Again'
                    ) : (
                      'Generate a Practice Problem'
                    )}
                  </button>
                )}
              </div>

              {isFollowUpLoading && (
                <div className="p-4 border-2 border-dashed border-blue-400 bg-blue-100/50 rounded-md">
                  <div className="flex items-center gap-3 text-blue-800 font-medium">
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              {followUpResponse && !isFollowUpLoading && (
                <div
                  ref={followUpResponseRef}
                  className="p-4 border-2 border-blue-400 bg-blue-100/50 rounded-md relative animate-fade-in">
                  <p className="font-bold text-blue-800 mb-2">
                    Tutor&apos;s Response:
                  </p>
                  <p className="text-gray-800 font-mono">
                    {followUpResponse}
                  </p>
                  <button
                    onClick={() => setFollowUpResponse('')}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-blue-200/50"
                    aria-label="Close response">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleFollowUpSubmit} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={followUpPrompt}
                    onChange={(e) => setFollowUpPrompt(e.target.value)}
                    placeholder="Ask a follow-up about this step..."
                    className="w-full p-2 pr-10 text-sm border-2 border-gray-400 bg-white text-gray-800 focus:ring-1 focus:ring-gray-400 focus:outline-none transition-all font-mono"
                    aria-label="Ask a follow-up question"
                  />
                  <button
                    type="submit"
                    disabled={isFollowUpLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-600 text-white hover:cursor-pointer hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    aria-label="Submit follow-up question">
                    <SendHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
          {isRateLimited && rateLimitResetTime ? (
            <RateLimitBanner resetsAt={rateLimitResetTime} />
          ): (steps.length === 0 && (
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (scopeError) setScopeError('');
                    // Don't clear rate limit error on input change - it should persist until reset time
                  }}
                  placeholder="Enter an algebra problem..."
                  className="w-full p-3 sm:p-4 pr-12 sm:pr-14 !text-sm sm:text-base border-2 border-black bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all font-mono"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading || isRateLimited}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-none bg-black text-white hover:cursor-pointer hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  {isLoading ? (
                    <LoaderCircle
                      className="w-5 sm:w-6 h-5 sm:h-6 animate-spin"
                      aria-label="Loading"
                    />
                  ) : (
                    <SendHorizontal
                      className="w-5 sm:w-6 h-5 sm:h-6"
                      aria-label="Submit problem"
                    />
                  )}
                </button>
              </div>
              {scopeError && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  {scopeError}
                </p>
              )}
              {isRateLimited && rateLimitResetTime && (
                <RateLimitBanner resetsAt={rateLimitResetTime} />
              )}
            </form>
          ))}
          
        </main>
        {/* Graph Modal */}
        {showGraphModal && steps.length > 0 && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setShowGraphModal(false)}>
            <div
              className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4 sm:p-6 relative"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Graph of{' '}
                  <span className="font-mono bg-gray-100 p-1 rounded" ref={(el) => {
                    if (el && window.MathJax?.typesetPromise) {
                      el.innerHTML = steps[currentStep].equation;
                      window.MathJax.typesetPromise([el]).catch((err: Error) => {
                        console.error('MathJax typesetting error in graph title:', err);
                        el.innerText = steps[currentStep].equation.replace(/\$\$/g, '');
                      });
                    } else {
                      if (el) el.innerText = steps[currentStep].equation.replace(/\$\$/g, '');
                    }
                  }}>
                  </span>
                </h3>
                <button
                  onClick={() => setShowGraphModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close graph">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <GraphCanvas equation={steps[currentStep].equation} />
            </div>
          </div>
        )}
        {/* Quiz Drawer */}
        <div
          ref={quizDrawerRef}
          className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-40 transition-transform duration-300 ease-in-out w-full max-w-md ${
            showQuizDrawer ? 'translate-x-0' : 'translate-x-full'
          }`}>
          {quizData && (
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold font-mega text-gray-800">
                  Practice Problem
                </h3>
                <button
                  onClick={handleCloseQuizDrawer}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto pr-2">
                <p className="font-mono text-gray-700 mb-6">
                  {quizData.question}
                </p>
                <div className="space-y-3">
                  {quizData.options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect =
                      feedback && isSelected && feedback.correct;
                    const isIncorrect =
                      feedback && isSelected && !feedback.correct;
                    let buttonClass =
                      'w-full text-left p-3 border-2 rounded-md transition-all font-mono ';
                    if (isSelected) {
                      buttonClass += isCorrect
                        ? 'bg-green-100 border-green-400 text-green-900'
                        : '';
                      buttonClass += isIncorrect
                        ? 'bg-red-100 border-red-400 text-red-900'
                        : '';
                    } else {
                      buttonClass +=
                        'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400';
                    }
                    if (feedback) {
                      buttonClass += ' cursor-not-allowed';
                    }
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option, index)}
                        disabled={feedback !== null}
                        className={buttonClass}>
                        {option.answer}
                      </button>
                    );
                  })}
                </div>
                {feedback && (
                  <div
                    className={`mt-6 p-3 rounded-md animate-fade-in text-sm ${
                      feedback.correct
                        ? 'bg-green-100 text-green-900'
                        : 'bg-red-100 text-red-900'
                    }`}>
                    <p className="font-semibold">{feedback.message}</p>
                  </div>
                )}
                {feedback && !feedback.correct && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSelectedAnswer(null);
                        setFeedback(null);
                      }}
                      className="w-full p-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Overlay for drawer */}
        {showQuizDrawer && (
          <div
            onClick={handleCloseQuizDrawer}
            className="fixed inset-0 bg-black/30 z-30 animate-fade-in"
          />
        )}
        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-700">
                  An Error Occurred
                </h3>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="text-gray-400 hover:text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="font-medium text-gray-600">
                {parseError(errorMessage)}
              </p>
            </div>
          </div>
        )}
        {/* Email Signup Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white p-3 z-20 border-t-2 border-black">
          <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-center sm:text-left text-gray-800">
              <span className="font-semibold">Olympiad</span> is developing a
              personalize AI math tutor that uses a whiteboard. Get early
              access.
            </p>
            <div className="flex items-center" style={{minHeight: '40px'}}>
              {emailSubmissionStatus === 'success' ? (
                <p className="text-green-600 font-semibold">
                  Thanks! We&apos;ll be in touch.
                </p>
              ) : emailSubmissionStatus === 'error' ? (
                <p className="text-red-600 font-semibold">
                  Submission failed. Please try again.
                </p>
              ) : (
                <form
                  onSubmit={handleEmailSubmit}
                  className="flex items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="p-2 h-10 text-sm rounded-none border-2 border-black bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200 w-48 sm:w-64 font-mono relative focus:z-10"
                    disabled={emailSubmissionStatus === 'loading'}
                  />
                  <button
                    type="submit"
                    disabled={emailSubmissionStatus === 'loading'}
                    className="p-2 h-10 bg-black text-white font-semibold rounded-none border-2 border-black ml-[-2px] hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-wait flex items-center justify-center w-28 cursor-pointer">
                    {emailSubmissionStatus === 'loading' ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : (
                      'Get Access'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
