import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { commentService } from '../services/tasks';
import { CommentFormData } from '../types';

interface CommentFormProps {
  taskId: number;
  onCommentAdded?: () => void;
}

const CommentForm = ({ taskId, onCommentAdded }: CommentFormProps) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CommentFormData>({
    comment: ''
  });

  const createCommentMutation = useMutation({
    mutationFn: (commentData: CommentFormData) => 
      commentService.createTaskComment(taskId, commentData, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      setFormData({ comment: '' });
      onCommentAdded?.();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.comment.trim()) {
      createCommentMutation.mutate(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (formData.comment.trim()) {
        createCommentMutation.mutate(formData);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Add a follow-up comment
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            required
            value={formData.comment}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            placeholder="Share updates, ask questions, or provide additional context..."
          />
          <div className="mt-1 text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+Enter</kbd> to submit quickly
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {formData.comment.trim().length} characters
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ comment: '' })}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!formData.comment.trim() || createCommentMutation.isPending}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={createCommentMutation.isPending || !formData.comment.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createCommentMutation.isPending ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </div>
              ) : (
                'Post Comment'
              )}
            </button>
          </div>
        </div>

        {createCommentMutation.error && (
          <div className="text-red-600 text-sm">
            Error: {createCommentMutation.error.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default CommentForm;