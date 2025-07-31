'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/contexts/ToastContext';
import { GlassType } from '@/types/cocktail';
import { getAdminGlassTypes, addGlassType, updateGlassType, deleteGlassType, generateId } from '@/utils/adminDataUtils';

export default function AdminGlassTypesPage() {
  const { showSuccess, showError } = useToast();
  const [glassTypes, setGlassTypes] = useState<GlassType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGlassType, setEditingGlassType] = useState<GlassType | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    capacity: '',
    iconUrl: ''
  });

  const loadGlassTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading glass types...');
      const allGlassTypes = await getAdminGlassTypes();
      console.log('Glass types loaded:', allGlassTypes.length);
      setGlassTypes(allGlassTypes);
    } catch (error) {
      console.error('Error loading glass types:', error);
      showError('Loading Error', 'Failed to load glass types');
      // Set empty array on error to stop loading
      setGlassTypes([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadGlassTypes();
  }, [loadGlassTypes]);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      capacity: '',
      iconUrl: ''
    });
    setEditingGlassType(null);
    setShowAddForm(false);
  };

  const handleEdit = (glassType: GlassType) => {
    setFormData({
      id: glassType.id,
      name: glassType.name,
      description: glassType.description || '',
      capacity: glassType.capacity || '',
      iconUrl: glassType.iconUrl || ''
    });
    setEditingGlassType(glassType);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Validation Error', 'Glass type name is required');
      return;
    }

    const glassTypeData: GlassType = {
      id: formData.id || generateId(),
      name: formData.name.trim(),
      description: formData.description.trim() || '',
      capacity: formData.capacity.trim() || undefined,
      iconUrl: formData.iconUrl.trim() || undefined
    };

    try {
      const success = editingGlassType
        ? await updateGlassType(editingGlassType.id, glassTypeData)
        : await addGlassType(glassTypeData);

      if (success) {
        await loadGlassTypes();
        resetForm();
        showSuccess(
          `Glass Type ${editingGlassType ? 'Updated' : 'Added'}`,
          `${glassTypeData.name} has been ${editingGlassType ? 'updated' : 'added'} successfully!`
        );
      } else {
        showError(
          `${editingGlassType ? 'Update' : 'Add'} Failed`,
          `Failed to ${editingGlassType ? 'update' : 'add'} glass type. Please try again.`
        );
      }
    } catch (error) {
      console.error('Error submitting glass type:', error);
      showError(
        'Submission Error',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };

  const handleDelete = async (glassType: GlassType) => {
    if (window.confirm(`Are you sure you want to delete "${glassType.name}"? This action cannot be undone.`)) {
      try {
        const success = await deleteGlassType(glassType.id);
        if (success) {
          await loadGlassTypes();
          showSuccess('Glass Type Deleted', `${glassType.name} has been deleted successfully.`);
        } else {
          showError('Delete Failed', `Failed to delete ${glassType.name}. Please try again.`);
        }
      } catch (error) {
        console.error('Error deleting glass type:', error);
        showError(
          'Delete Error',
          error instanceof Error ? error.message : 'An unexpected error occurred while deleting the glass type'
        );
      }
    }
  };

  // Filter glass types based on search
  const filteredGlassTypes = glassTypes.filter(glassType =>
    glassType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (glassType.description && glassType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Glass Types</h1>
            <p className="text-gray-600">Manage cocktail glass types and their properties</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add Glass Type</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search glass types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingGlassType ? 'Edit Glass Type' : 'Add New Glass Type'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g., 8 oz, 250ml"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the glass type and its typical uses..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/glass-image.jpg"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  {editingGlassType ? 'Update Glass Type' : 'Add Glass Type'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Glass Types List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Glass Types ({filteredGlassTypes.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredGlassTypes.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                {searchTerm ? 'No glass types match your search.' : 'No glass types found.'}
              </div>
            ) : (
              filteredGlassTypes.map((glassType) => (
                <div key={glassType.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        {glassType.iconUrl && (
                          <Image
                            src={glassType.iconUrl}
                            alt={glassType.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {glassType.name}
                          </h3>
                          {glassType.capacity && (
                            <p className="text-sm text-blue-600">
                              Capacity: {glassType.capacity}
                            </p>
                          )}
                          {glassType.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {glassType.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(glassType)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(glassType)}
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  );
}
