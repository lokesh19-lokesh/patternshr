import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          An unexpected error occurred in the application.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="rounded-md bg-red-50 p-4 mb-6 overflow-auto max-h-48">
            <p className="text-sm text-red-700 font-mono">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <button
              onClick={resetErrorBoundary}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export const GlobalErrorBoundary: React.FC<GlobalErrorBoundaryProps> = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Clear local state or cached data if needed when resetting
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};
