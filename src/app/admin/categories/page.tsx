'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/cocktail';
import { getAdminCategories, addCategory, updateCategory, deleteCategory, generateId } from '@/utils/adminDataUtils';
import { useToast } from '@/contexts/ToastContext';

export default function AdminCategoriesPage() {
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    color: '',
    iconEmoji: ''
  });

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading categories...');
      const allCategories = await getAdminCategories();
      console.log('Categories loaded:', allCategories.length);
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      showError('Loading Error', 'Failed to load categories');
      // Set empty array on error to stop loading
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      color: '',
      iconEmoji: ''
    });
    setEditingCategory(null);
    setShowAddForm(false);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || '',
      color: category.color || '',
      iconEmoji: category.iconEmoji || ''
    });
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Validation Error', 'Category name is required');
      return;
    }

    try {
      const categoryData: Category = {
        id: editingCategory ? editingCategory.id : (formData.id || generateId('cat')),
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color || undefined,
        iconEmoji: formData.iconEmoji || undefined
      };

      let success = false;
      if (editingCategory) {
        success = await updateCategory(editingCategory.id, categoryData);
        if (success) {
          showSuccess('Success', 'Category updated successfully');
        } else {
          showError('Update Error', 'Failed to update category');
        }
      } else {
        success = await addCategory(categoryData);
        if (success) {
          showSuccess('Success', 'Category added successfully');
        } else {
          showError('Add Error', 'Failed to add category');
        }
      }

      if (success) {
        resetForm();
        await loadCategories();
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showError('Save Error', 'Failed to save category');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteCategory(categoryId);
      if (success) {
        showSuccess('Success', 'Category deleted successfully');
        await loadCategories();
      } else {
        showError('Delete Error', 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Delete Error', 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Manage cocktail categories and their properties</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add Category</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search categories..."
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
              {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                    Icon Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.iconEmoji}
                    onChange={(e) => setFormData({ ...formData, iconEmoji: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="🍸"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color (Hex)
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              Categories ({filteredCategories.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredCategories.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                {searchTerm ? 'No categories match your search.' : 'No categories found.'}
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        {category.iconEmoji && (
                          <span className="text-2xl">{category.iconEmoji}</span>
                        )}
                        {category.color && (
                          <div
                            className="w-6 h-6 rounded-full border border-gray-300"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {category.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            ID: {category.id}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
