'use client';

interface StepperProps {
  steps: { key: number; label: string }[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="relative">
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-gray-200" />
      <div className="relative flex justify-between">
        {steps.map((step, index) => (
          <div key={step.key} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                index + 1 < currentStep
                  ? 'bg-primary-600 text-white border-2 border-primary-600'
                  : index + 1 === currentStep
                  ? 'bg-white text-primary-600 border-3 border-primary-600 shadow-lg shadow-primary-600/20'
                  : 'bg-gray-200 text-gray-400 border-2 border-gray-200'
              }`}
            >
              {index + 1 < currentStep ? '✓' : step.key}
            </div>
            <span
              className={`mt-2 text-xs font-medium text-center w-20 ${
                index + 1 <= currentStep ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}