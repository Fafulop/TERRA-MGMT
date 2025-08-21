import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { commentService } from '../services/tasks';
import { Comment, CommentFormData } from '../types';
import AttachmentList from './AttachmentList';
import AttachmentUpload from './AttachmentUpload';

interface CommentListProps {
  taskId: number;
}

const CommentList = ({ taskId }: CommentListProps) => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<CommentFormData>({ comment: '' });
  const [showAttachmentsFor, setShowAttachmentsFor] = useState<number | null>(null);
  const [addingAttachmentTo, setAddingAttachmentTo] = useState<number | null>(null);

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => commentService.getTaskComments(taskId, token!),
    enabled: !!token,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: false
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, commentData }: { commentId: number; commentData: CommentFormData }) =>
      commentService.updateTaskComment(taskId, commentId, commentData, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
      setEditingCommentId(null);
      setEditFormData({ comment: '' });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      commentService.deleteTaskComment(taskId, commentId, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    }
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDisplayName = (comment: Comment) => {
    const { author } = comment;
    if (author.firstName || author.lastName) {
      return `${author.firstName || ''} ${author.lastName || ''}`.trim();
    }
    return author.username;
  };

  const handleEditStart = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditFormData({ comment: comment.comment });
  };

  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditFormData({ comment: '' });
  };

  const handleAddAttachment = (commentId: number) => {
    setAddingAttachmentTo(commentId);
  };

  const handleAttachmentAdded = () => {
    setAddingAttachmentTo(null);
    // Refresh the comment attachments
    queryClient.invalidateQueries({ queryKey: ['comment-attachments'] });
  };

  const handleEditSubmit = (commentId: number) => {
    if (editFormData.comment.trim()) {
      updateCommentMutation.mutate({ commentId, commentData: editFormData });
    }
  };

  const handleDelete = (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="w-32 h-4 bg-gray-300 rounded"></div>
              <div className="w-24 h-3 bg-gray-300 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-gray-300 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading comments: {error.message}</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-lg font-medium text-gray-900 mb-1">No comments yet</p>
        <p className="text-gray-500">Be the first to add a follow-up comment to this task.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {getDisplayName(comment).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {getDisplayName(comment)}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{formatDateTime(comment.createdAt)}</span>
                  {comment.updatedAt !== comment.createdAt && (
                    <>
                      <span>•</span>
                      <span>edited {formatDateTime(comment.updatedAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {user?.username === comment.author.username && (
                <>
                  <button
                    onClick={() => handleEditStart(comment)}
                    className="text-gray-400 hover:text-blue-600"
                    title="Edit comment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleteCommentMutation.isPending}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete comment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={() => handleAddAttachment(comment.id)}
                className="text-gray-400 hover:text-green-600"
                title="Add attachment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z" />
                </svg>
              </button>
            </div>
          </div>

          {editingCommentId === comment.id ? (
            <div className="space-y-3">
              <textarea
                value={editFormData.comment}
                onChange={(e) => setEditFormData({ comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditSubmit(comment.id)}
                  disabled={updateCommentMutation.isPending || !editFormData.comment.trim()}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleEditCancel}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="prose max-w-none">
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {comment.comment}
                </p>
              </div>
              
              {/* Comment Attachments */}
              <div className="border-t border-gray-100 pt-3">
                <AttachmentList commentId={comment.id} />
              </div>

              {/* Add Attachment Interface */}
              {addingAttachmentTo === comment.id && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-medium text-blue-900">Add Attachment to Comment</h5>
                      <button
                        onClick={() => setAddingAttachmentTo(null)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <AttachmentUpload 
                      commentId={comment.id} 
                      onAttachmentAdded={handleAttachmentAdded}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {updateCommentMutation.error && editingCommentId === comment.id && (
            <div className="mt-2 text-red-600 text-sm">
              Error: {updateCommentMutation.error.message}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentList;