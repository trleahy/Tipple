'use client';

import { useState, useEffect } from 'react';
import { getAdminIngredients, addIngredient, updateIngredient, deleteIngredient, generateId } from '@/utils/adminDataUtils';
import { useToast } from '@/contexts/ToastContext';
import { Ingredient, IngredientCategory } from '@/types/cocktail';

export default function AdminIngredientsPage() {
  const { showSuccess, showError } = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: IngredientCategory.OTHER,
    alcoholic: false,
    description: '',
    abv: 0
  });

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    setIsLoading(true);
    try {
      const allIngredients = await getAdminIngredients();
      setIngredients(allIngredients);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      setIngredients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: generateId('ingredient'),
      name: '',
      category: IngredientCategory.OTHER,
      alcoholic: false,
      description: '',
      abv: 0
    });
    setEditingIngredient(null);
    setShowAddForm(false);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setFormData({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      alcoholic: ingredient.alcoholic,
      description: ingredient.description || '',
      abv: ingredient.abv || 0
    });
    setEditingIngredient(ingredient);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Validation Error', 'Ingredient name is required');
      return;
    }

    const ingredientData: Ingredient = {
      id: formData.id,
      name: formData.name.trim(),
      category: formData.category,
      alcoholic: formData.alcoholic,
      description: formData.description.trim() || undefined,
      abv: formData.alcoholic ? formData.abv : undefined
    };

    let success;
    if (editingIngredient) {
      success = await updateIngredient(editingIngredient.id, ingredientData);
    } else {
      success = await addIngredient(ingredientData);
    }

    if (success) {
      console.log(`Ingredient ${editingIngredient ? 'updated' : 'added'} successfully:`, ingredientData);
      await loadIngredients(); // Wait for reload to complete
      resetForm();
      showSuccess(
        `Ingredient ${editingIngredient ? 'Updated' : 'Added'}`,
        `${ingredientData.name} has been ${editingIngredient ? 'updated' : 'added'} successfully!`
      );
    } else {
      console.error(`Failed to ${editingIngredient ? 'update' : 'add'} ingredient:`, ingredientData);
      showError(
        `${editingIngredient ? 'Update' : 'Add'} Failed`,
        `Error ${editingIngredient ? 'updating' : 'adding'} ingredient. Please try again.`
      );
    }
  };

  const handleDelete = async (ingredient: Ingredient) => {
    if (window.confirm(`Are you sure you want to delete "${ingredient.name}"? This action cannot be undone.`)) {
      try {
        console.log('Attempting to delete ingredient:', ingredient.id, ingredient.name);
        const success = await deleteIngredient(ingredient.id);
        if (success) {
          console.log('Delete successful, reloading ingredients');
          await loadIngredients();
          showSuccess('Ingredient Deleted', `${ingredient.name} has been deleted successfully.`);
        } else {
          console.error('Delete failed - function returned false');
          showError('Delete Failed', 'Error deleting ingredient. Please check the console for details and try again.');
        }
      } catch (error) {
        console.error('Delete operation threw an error:', error);
        showError('Delete Error', 'Error deleting ingredient. Please check the console for details and try again.');
      }
    }
  };

  // Filter ingredients
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ingredient.description && ingredient.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.values(IngredientCategory);
  const categoryStats = categories.map(category => ({
    category,
    count: ingredients.filter(ing => ing.category === category).length
  }));

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⏳</div>
        <div className="text-xl font-semibold text-gray-900">Loading ingredients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Ingredients</h1>
            <p className="text-gray-600">Add, edit, or remove ingredients used in cocktails</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Add New Ingredient
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{ingredients.length}</div>
            <div className="text-sm text-gray-600">Total Ingredients</div>
          </div>
          {categoryStats.slice(0, 5).map(({ category, count }) => (
            <div key={category} className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{category.replace('_', ' ')}</div>
            </div>
          ))}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingIngredient ? 'Edit Ingredient' : 'Add New Ingredient'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID {editingIngredient && '(Read-only)'}
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => !editingIngredient && setFormData(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly={!!editingIngredient}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as IngredientCategory }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.values(IngredientCategory).map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ABV (%) {formData.alcoholic ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.abv}
                    onChange={(e) => setFormData(prev => ({ ...prev, abv: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.alcoholic}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.alcoholic}
                    onChange={(e) => setFormData(prev => ({ ...prev, alcoholic: e.target.checked, abv: e.target.checked ? prev.abv : 0 }))}
                    className="mr-2"
                  />
                  Contains alcohol
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the ingredient..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingIngredient ? 'Update' : 'Add'} Ingredient
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Ingredients
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {Object.values(IngredientCategory).map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ingredients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Ingredients ({filteredIngredients.length})
            </h2>
          </div>
          
          {filteredIngredients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🧪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No ingredients found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first ingredient.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ABV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIngredients.map((ingredient) => (
                    <tr key={ingredient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                          {ingredient.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {ingredient.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {ingredient.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ingredient.alcoholic ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {ingredient.alcoholic ? 'Alcoholic' : 'Non-alcoholic'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ingredient.abv ? `${ingredient.abv}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(ingredient)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ingredient)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}
