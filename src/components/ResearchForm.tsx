import { useState } from 'react';

interface ResearchFormProps {
  onSubmit: (question: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function ResearchForm({ onSubmit, isSubmitting = false }: ResearchFormProps) {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError('Please enter a research question');
      return;
    }

    if (trimmedQuestion.length < 10) {
      setError('Question must be at least 10 characters long');
      return;
    }

    try {
      await onSubmit(trimmedQuestion);
      setQuestion(''); // Clear form on success
    } catch (err) {
      setError('Failed to submit research question. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="research-question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Research Question
        </label>
        <textarea
          id="research-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your complex research question here..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 resize-none"
          disabled={isSubmitting}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Ask complex questions that require deep research and analysis. The AI will work asynchronously to provide comprehensive answers.
        </p>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </span>
        ) : (
          'Start Research'
        )}
      </button>
    </form>
  );
}