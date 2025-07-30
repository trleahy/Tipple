'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Cocktail, CocktailIngredient, CocktailCategory, Difficulty, Ingredient, GlassType } from '@/types/cocktail';
import { getAdminIngredients, getAdminGlassTypes, addCocktail, updateCocktail, generateId } from '@/utils/adminDataUtils';
import { useToast } from '@/contexts/ToastContext';

interface CocktailFormProps {
  cocktail?: Cocktail;
  isEditing?: boolean;
}

const CocktailForm = ({ cocktail, isEditing = false }: CocktailFormProps) => {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [availableGlassTypes, setAvailableGlassTypes] = useState<GlassType[]>([]);

  const [formData, setFormData] = useState({
    id: cocktail?.id || '',
    name: cocktail?.name || '',
    description: cocktail?.description || '',
    instructions: cocktail?.instructions || [''],
    ingredients: cocktail?.ingredients || [],
    glassTypeId: cocktail?.glassType.id || '',
    category: cocktail?.category || CocktailCategory.CLASSIC,
    tags: (cocktail?.tags || []).join(', ') || '',
    difficulty: cocktail?.difficulty || Difficulty.EASY,
    prepTime: cocktail?.prepTime || 5,
    servings: cocktail?.servings || 1,
    garnish: cocktail?.garnish || '',
    history: cocktail?.history || ''
  });

  const [newIngredient, setNewIngredient] = useState({
    ingredientId: '',
    amount: '',
    optional: false,
    garnish: false
  });

  useEffect(() => {
    if (!isEditing) {
      setFormData(prev => ({ ...prev, id: generateId('cocktail') }));
    }
  }, [isEditing]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ingredients, glassTypes] = await Promise.all([
          getAdminIngredients(),
          getAdminGlassTypes()
        ]);
        setAvailableIngredients(ingredients);
        setAvailableGlassTypes(glassTypes);
      } catch (error) {
        console.error('Error loading form data:', error);
        setAvailableIngredients([]);
        setAvailableGlassTypes([]);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setFormData(prev => ({ ...prev, instructions: [...prev.instructions, ''] }));
  };

  const removeInstruction = (index: number) => {
    if (formData.instructions.length > 1) {
      const newInstructions = formData.instructions.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, instructions: newInstructions }));
    }
  };

  const addIngredientToList = () => {
    if (!newIngredient.ingredientId || !newIngredient.amount) return;

    const ingredient = availableIngredients.find(ing => ing.id === newIngredient.ingredientId);
    if (!ingredient) return;

    const cocktailIngredient: CocktailIngredient = {
      ingredient,
      amount: newIngredient.amount,
      optional: newIngredient.optional,
      garnish: newIngredient.garnish
    };

    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, cocktailIngredient]
    }));

    setNewIngredient({
      ingredientId: '',
      amount: '',
      optional: false,
      garnish: false
    });
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Cocktail name is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (formData.ingredients.length === 0) {
        throw new Error('At least one ingredient is required');
      }
      if (!formData.glassTypeId) {
        throw new Error('Glass type is required');
      }
      if (formData.instructions.some(inst => !inst.trim())) {
        throw new Error('All instruction steps must be filled');
      }

      const glassType = availableGlassTypes.find(gt => gt.id === formData.glassTypeId);
      if (!glassType) {
        throw new Error('Invalid glass type selected');
      }

      const cocktailData: Cocktail = {
        id: formData.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.filter(inst => inst.trim()),
        ingredients: formData.ingredients,
        glassType,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        difficulty: formData.difficulty,
        prepTime: formData.prepTime,
        servings: formData.servings,
        garnish: formData.garnish.trim() || undefined,
        history: formData.history.trim() || undefined
      };

      let success;
      console.log(`Attempting to ${isEditing ? 'update' : 'add'} cocktail:`, cocktailData.id, cocktailData.name);

      if (isEditing) {
        success = await updateCocktail(cocktail!.id, cocktailData);
      } else {
        success = await addCocktail(cocktailData);
      }

      if (success) {
        console.log(`Cocktail ${isEditing ? 'updated' : 'added'} successfully`);
        showSuccess(
          `Cocktail ${isEditing ? 'Updated' : 'Created'}`,
          `${cocktailData.name} has been ${isEditing ? 'updated' : 'created'} successfully!`
        );
        router.push('/admin/cocktails');
      } else {
        console.error(`Failed to ${isEditing ? 'update' : 'add'} cocktail - function returned false`);
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} cocktail. Please check the console for details.`);
      }
    } catch (error) {
      console.error('Error submitting cocktail:', error);
      showError(
        'Error Saving Cocktail',
        error instanceof Error ? error.message : 'An error occurred. Please check the console for details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cocktail Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID {isEditing && '(Read-only)'}
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => !isEditing && handleInputChange('id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly={isEditing}
              required
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Properties */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.values(CocktailCategory).map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => handleInputChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.values(Difficulty).map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Glass Type *
            </label>
            <select
              value={formData.glassTypeId}
              onChange={(e) => handleInputChange('glassTypeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select glass type</option>
              {availableGlassTypes.map(glass => (
                <option key={glass.id} value={glass.id}>
                  {glass.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prep Time (minutes) *
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={formData.prepTime}
              onChange={(e) => handleInputChange('prepTime', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="Classic, IBA Official, Summer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servings
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.servings}
              onChange={(e) => handleInputChange('servings', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h2>

        {/* Add Ingredient */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Add Ingredient</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={newIngredient.ingredientId}
              onChange={(e) => setNewIngredient(prev => ({ ...prev, ingredientId: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select ingredient</option>
              {availableIngredients.map(ingredient => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={newIngredient.amount}
              onChange={(e) => setNewIngredient(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="e.g., 2 oz, 1 dash"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newIngredient.optional}
                  onChange={(e) => setNewIngredient(prev => ({ ...prev, optional: e.target.checked }))}
                  className="mr-2"
                />
                Optional
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newIngredient.garnish}
                  onChange={(e) => setNewIngredient(prev => ({ ...prev, garnish: e.target.checked }))}
                  className="mr-2"
                />
                Garnish
              </label>
            </div>

            <button
              type="button"
              onClick={addIngredientToList}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Ingredients List */}
        <div className="space-y-2">
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="font-medium">{ingredient.ingredient.name}</span>
                <span className="text-gray-600">{ingredient.amount}</span>
                {ingredient.optional && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Optional</span>
                )}
                {ingredient.garnish && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Garnish</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
          {formData.ingredients.length === 0 && (
            <p className="text-gray-500 text-center py-4">No ingredients added yet</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
        <div className="space-y-3">
          {formData.instructions.map((instruction, index) => (
            <div key={index} className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-1">
                {index + 1}
              </span>
              <textarea
                value={instruction}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                placeholder={`Step ${index + 1} instructions...`}
                rows={2}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {formData.instructions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="text-red-600 hover:text-red-800 mt-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addInstruction}
          className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Add Step
        </button>
      </div>

      {/* Optional Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Optional Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Garnish Description
            </label>
            <input
              type="text"
              value={formData.garnish}
              onChange={(e) => handleInputChange('garnish', e.target.value)}
              placeholder="e.g., Lime wheel and fresh mint sprig"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              History/Background
            </label>
            <textarea
              value={formData.history}
              onChange={(e) => handleInputChange('history', e.target.value)}
              rows={3}
              placeholder="Historical information about this cocktail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : (isEditing ? 'Update Cocktail' : 'Create Cocktail')}
        </button>
      </div>
    </form>
  );
};

export default CocktailForm;
