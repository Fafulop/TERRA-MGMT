import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { areasService, AreaWithSubareas } from '../services/areas';

interface AreaSubareaSelectorProps {
  selectedArea?: string;
  selectedSubarea?: string;
  onAreaChange: (areaName: string) => void;
  onSubareaChange: (subareaName: string) => void;
  disabled?: boolean;
  required?: boolean;
  showLabels?: boolean;
  className?: string;
  areaPlaceholder?: string;
  subareaPlaceholder?: string;
}

const AreaSubareaSelector: React.FC<AreaSubareaSelectorProps> = ({
  selectedArea = '',
  selectedSubarea = '',
  onAreaChange,
  onSubareaChange,
  disabled = false,
  required = false,
  showLabels = true,
  className = '',
  areaPlaceholder = 'Select area...',
  subareaPlaceholder = 'Select subarea...'
}) => {
  const { user, token } = useAuth();
  const [areas, setAreas] = useState<AreaWithSubareas[]>([]);
  const [availableSubareas, setAvailableSubareas] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load areas on component mount
  useEffect(() => {
    loadAreas();
  }, []);

  // Update available subareas when area selection changes
  useEffect(() => {
    if (selectedArea) {
      const area = areas.find(a => a.name === selectedArea);
      if (area) {
        setAvailableSubareas(area.subareas.map(sub => ({ id: sub.id, name: sub.name })));
        
        // If current subarea is not available in the new area, reset it
        if (selectedSubarea && !area.subareas.some(sub => sub.name === selectedSubarea)) {
          onSubareaChange('');
        }
      } else {
        setAvailableSubareas([]);
        onSubareaChange('');
      }
    } else {
      setAvailableSubareas([]);
      onSubareaChange('');
    }
  }, [selectedArea, areas, selectedSubarea, onSubareaChange]);

  const loadAreas = async () => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      const fetchedAreas = await areasService.getAreas(token);
      setAreas(fetchedAreas);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load areas');
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const areaName = e.target.value;
    onAreaChange(areaName);
  };

  const handleSubareaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subareaName = e.target.value;
    onSubareaChange(subareaName);
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
        <div>
          {showLabels && (
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area {required && '*'}
            </label>
          )}
          <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
        </div>
        <div>
          {showLabels && (
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subarea {required && '*'}
            </label>
          )}
          <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-md ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-800">Error loading areas: {error}</span>
          <button
            onClick={loadAreas}
            className="ml-auto text-red-600 hover:text-red-800 text-sm underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Area Selection */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area {required && '*'}
          </label>
        )}
        <select
          value={selectedArea}
          onChange={handleAreaChange}
          disabled={disabled}
          required={required}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        >
          <option value="">{areaPlaceholder}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.name}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subarea Selection */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subarea {required && '*'}
          </label>
        )}
        <select
          value={selectedSubarea}
          onChange={handleSubareaChange}
          disabled={disabled || !selectedArea || availableSubareas.length === 0}
          required={required}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled || !selectedArea || availableSubareas.length === 0 
              ? 'bg-gray-100 cursor-not-allowed' 
              : 'bg-white'
          }`}
        >
          <option value="">{subareaPlaceholder}</option>
          {availableSubareas.map((subarea) => (
            <option key={subarea.id} value={subarea.name}>
              {subarea.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AreaSubareaSelector;