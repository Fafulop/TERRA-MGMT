import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { areasService, AreaWithSubareas, AreaFormData, SubareaFormData, Subarea } from '../services/areas';
import AreaContentDisplay from '../components/AreaContentDisplay';

const Areas: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  
  // State management
  const [areas, setAreas] = useState<AreaWithSubareas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showSubareaModal, setShowSubareaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaWithSubareas | null>(null);
  const [editingSubarea, setEditingSubarea] = useState<Subarea | null>(null);
  const [, setSelectedAreaForSubarea] = useState<number | null>(null);
  
  // Form states
  const [areaForm, setAreaForm] = useState<AreaFormData>({ name: '', description: '' });
  const [subareaForm, setSubareaForm] = useState<SubareaFormData>({ area_id: 0, name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Expansion states
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set());
  const [expandedSubareas, setExpandedSubareas] = useState<Set<string>>(new Set());

  // Auth check
  if (!user || !token) {
    navigate('/login');
    return null;
  }

  // Load areas on component mount
  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
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

  // Area management functions
  const handleCreateArea = () => {
    setEditingArea(null);
    setAreaForm({ name: '', description: '' });
    setShowAreaModal(true);
  };

  const handleEditArea = (area: AreaWithSubareas) => {
    setEditingArea(area);
    setAreaForm({ name: area.name, description: area.description || '' });
    setShowAreaModal(true);
  };

  const handleSubmitArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaForm.name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingArea) {
        await areasService.updateArea(editingArea.id, areaForm, token);
      } else {
        await areasService.createArea(areaForm, token);
      }
      await loadAreas();
      setShowAreaModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save area');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArea = async (areaId: number) => {
    if (!confirm('Are you sure you want to delete this area? This will also delete all its subareas.')) return;

    try {
      await areasService.deleteArea(areaId, token);
      await loadAreas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete area');
    }
  };

  // Subarea management functions
  const handleCreateSubarea = (areaId: number) => {
    setEditingSubarea(null);
    setSelectedAreaForSubarea(areaId);
    setSubareaForm({ area_id: areaId, name: '', description: '' });
    setShowSubareaModal(true);
  };

  const handleEditSubarea = (subarea: Subarea) => {
    setEditingSubarea(subarea);
    setSelectedAreaForSubarea(subarea.area_id);
    setSubareaForm({ area_id: subarea.area_id, name: subarea.name, description: subarea.description || '' });
    setShowSubareaModal(true);
  };

  const handleSubmitSubarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subareaForm.name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingSubarea) {
        await areasService.updateSubarea(editingSubarea.id, subareaForm, token);
      } else {
        await areasService.createSubarea(subareaForm, token);
      }
      await loadAreas();
      setShowSubareaModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubarea = async (subareaId: number) => {
    if (!confirm('Are you sure you want to delete this subarea?')) return;

    try {
      await areasService.deleteSubarea(subareaId, token);
      await loadAreas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subarea');
    }
  };

  // Toggle expansion functions
  const toggleAreaExpansion = (areaId: number) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  const toggleSubareaExpansion = (areaName: string, subareaName: string) => {
    const key = `${areaName}:${subareaName}`;
    const newExpanded = new Set(expandedSubareas);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubareas(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Areas Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.username}!</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Areas & Subareas Dashboard</h2>
              <p className="text-gray-600">Manage organizational taxonomy and view all related content across modules</p>
              <p className="text-sm text-indigo-600 mt-1">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Click the arrow icons to expand and view all tasks, cotizaciones, contacts, ledger entries, and documents
              </p>
            </div>
            <button
              onClick={handleCreateArea}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Area
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading areas...</p>
              </div>
            </div>
          )}

          {/* Areas Grid */}
          {!loading && (
            <div className="space-y-6">
              {areas.length === 0 ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No areas found</h3>
                      <p className="text-gray-500 mb-4">Get started by creating your first organizational area.</p>
                      <button
                        onClick={handleCreateArea}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Your First Area
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                areas.map((area) => (
                  <div key={area.id} className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      {/* Area Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                            <button
                              onClick={() => toggleAreaExpansion(area.id)}
                              className="text-indigo-600 hover:text-indigo-700 p-1 transition-transform duration-200"
                              title={expandedAreas.has(area.id) ? "Hide content" : "Show all content"}
                            >
                              <svg 
                                className={`w-5 h-5 transform ${expandedAreas.has(area.id) ? 'rotate-90' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                          {area.description && (
                            <p className="text-gray-600 mt-1">{area.description}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            {area.subareas.length} subarea{area.subareas.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCreateSubarea(area.id)}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Add subarea"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditArea(area)}
                            className="text-indigo-600 hover:text-indigo-700 p-1"
                            title="Edit area"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteArea(area.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Delete area"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Area Content Display */}
                      <AreaContentDisplay 
                        areaName={area.name}
                        isExpanded={expandedAreas.has(area.id)}
                      />

                      {/* Subareas */}
                      {area.subareas.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Subareas</h4>
                          <div className="space-y-3">
                            {area.subareas.map((subarea) => {
                              const subareaKey = `${area.name}:${subarea.name}`;
                              const isSubareaExpanded = expandedSubareas.has(subareaKey);
                              
                              return (
                                <div key={subarea.id} className="bg-gray-50 rounded-lg">
                                  <div className="p-3 flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <p className="font-medium text-gray-900">{subarea.name}</p>
                                        <button
                                          onClick={() => toggleSubareaExpansion(area.name, subarea.name)}
                                          className="text-indigo-600 hover:text-indigo-700 p-1 transition-transform duration-200"
                                          title={isSubareaExpanded ? "Hide subarea content" : "Show subarea content"}
                                        >
                                          <svg 
                                            className={`w-4 h-4 transform ${isSubareaExpanded ? 'rotate-90' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        </button>
                                      </div>
                                      {subarea.description && (
                                        <p className="text-sm text-gray-600 mt-1">{subarea.description}</p>
                                      )}
                                    </div>
                                    <div className="flex space-x-1 ml-2">
                                      <button
                                        onClick={() => handleEditSubarea(subarea)}
                                        className="text-indigo-600 hover:text-indigo-700 p-1"
                                        title="Edit subarea"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubarea(subarea.id)}
                                        className="text-red-600 hover:text-red-700 p-1"
                                        title="Delete subarea"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Subarea Content Display */}
                                  <AreaContentDisplay 
                                    areaName={area.name}
                                    subareaName={subarea.name}
                                    isExpanded={isSubareaExpanded}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </main>

      {/* Area Modal */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingArea ? 'Edit Area' : 'Create New Area'}
              </h3>
              <form onSubmit={handleSubmitArea}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Name *
                  </label>
                  <input
                    type="text"
                    value={areaForm.name}
                    onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter area name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={areaForm.description}
                    onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter area description"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAreaModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={isSubmitting || !areaForm.name.trim()}
                  >
                    {isSubmitting ? 'Saving...' : (editingArea ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subarea Modal */}
      {showSubareaModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingSubarea ? 'Edit Subarea' : 'Create New Subarea'}
              </h3>
              <form onSubmit={handleSubmitSubarea}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subarea Name *
                  </label>
                  <input
                    type="text"
                    value={subareaForm.name}
                    onChange={(e) => setSubareaForm({ ...subareaForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter subarea name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={subareaForm.description}
                    onChange={(e) => setSubareaForm({ ...subareaForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter subarea description"
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSubareaModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={isSubmitting || !subareaForm.name.trim()}
                  >
                    {isSubmitting ? 'Saving...' : (editingSubarea ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Areas;