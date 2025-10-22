import { useState } from 'react';
import type { ProjectFormData } from '../../types';
import AreaSubareaSelector from '../AreaSubareaSelector';

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ProjectFormData>;
  isLoading?: boolean;
}

export default function ProjectForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    area: initialData?.area || '',
    subarea: initialData?.subarea || '',
    visibility: initialData?.visibility || 'shared',
    status: initialData?.status || 'planning',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.area) {
      alert('Please fill in required fields');
      return;
    }
    onSubmit(formData);
  };

  const handleAreaChange = (area: string) => {
    setFormData({ ...formData, area });
  };

  const handleSubareaChange = (subarea: string) => {
    setFormData({ ...formData, subarea });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter project name"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter project description"
          rows={3}
        />
      </div>

      {/* Area & Subarea Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Area & Subarea <span className="text-red-500">*</span>
        </label>
        <AreaSubareaSelector
          selectedArea={formData.area}
          selectedSubarea={formData.subarea || ''}
          onAreaChange={handleAreaChange}
          onSubareaChange={handleSubareaChange}
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Visibility
        </label>
        <select
          value={formData.visibility}
          onChange={(e) =>
            setFormData({ ...formData, visibility: e.target.value as 'shared' | 'private' })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="shared">Shared (visible to all users)</option>
          <option value="private">Private (only visible to me)</option>
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData({
              ...formData,
              status: e.target.value as 'planning' | 'active' | 'completed' | 'on_hold',
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Project' : 'Create Project'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
