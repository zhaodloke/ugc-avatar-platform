'use client';

import React from 'react';
import { clsx } from 'clsx';

interface WizardStep {
  id: number;
  name: string;
  description: string;
}

interface WizardLayoutProps {
  steps: WizardStep[];
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

export function WizardLayout({
  steps,
  currentStep,
  children,
  className,
}: WizardLayoutProps) {
  return (
    <div className={clsx('w-full', className)}>
      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={clsx(
                  'relative',
                  index !== steps.length - 1 && 'pr-8 sm:pr-20'
                )}
              >
                {/* Connector line */}
                {index !== steps.length - 1 && (
                  <div
                    className="absolute top-4 left-7 -ml-px mt-0.5 h-0.5 w-full sm:w-20"
                    aria-hidden="true"
                  >
                    <div
                      className={clsx(
                        'h-full',
                        step.id < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                      )}
                    />
                  </div>
                )}

                <div className="group relative flex items-start">
                  <span className="flex h-9 items-center" aria-hidden="true">
                    <span
                      className={clsx(
                        'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                        step.id < currentStep
                          ? 'bg-primary-600'
                          : step.id === currentStep
                          ? 'border-2 border-primary-600 bg-white'
                          : 'border-2 border-gray-300 bg-white'
                      )}
                    >
                      {step.id < currentStep ? (
                        <svg
                          className="h-5 w-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span
                          className={clsx(
                            'text-sm font-medium',
                            step.id === currentStep
                              ? 'text-primary-600'
                              : 'text-gray-500'
                          )}
                        >
                          {step.id}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="ml-3 flex min-w-0 flex-col">
                    <span
                      className={clsx(
                        'text-sm font-medium',
                        step.id <= currentStep ? 'text-primary-600' : 'text-gray-500'
                      )}
                    >
                      {step.name}
                    </span>
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {step.description}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}

export default WizardLayout;
