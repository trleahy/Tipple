'use client';

import { useState, useEffect } from 'react';
import {
  getAdminCocktails,
  getAdminIngredients,
  getAdminGlassTypes,
  saveAdminCocktails,
  saveAdminIngredients,
  saveAdminGlassTypes,
  resetToDefaults
} from '@/utils/adminDataUtils';

export default function ImportExportPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [importData, setImportData] = useState('');
  const [exportType, setExportType] = useState<'all' | 'cocktails' | 'ingredients' | 'glass-types'>('all');
  const [stats, setStats] = useState({ cocktails: 0, ingredients: 0, glassTypes: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [cocktails, ingredients, glassTypes] = await Promise.all([
          getAdminCocktails(),
          getAdminIngredients(),
          getAdminGlassTypes()
        ]);
        setStats({
          cocktails: cocktails.length,
          ingredients: ingredients.length,
          glassTypes: glassTypes.length
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        setStats({ cocktails: 0, ingredients: 0, glassTypes: 0 });
      }
    };
    loadStats();
  }, []);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      let data: Record<string, unknown> = {};

      switch (exportType) {
        case 'cocktails':
          data = { cocktails: await getAdminCocktails() };
          break;
        case 'ingredients':
          data = { ingredients: await getAdminIngredients() };
          break;
        case 'glass-types':
          data = { glassTypes: await getAdminGlassTypes() };
          break;
        case 'all':
        default:
          const [cocktails, ingredients, glassTypes] = await Promise.all([
            getAdminCocktails(),
            getAdminIngredients(),
            getAdminGlassTypes()
          ]);
          data = {
            cocktails,
            ingredients,
            glassTypes,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
          };
          break;
      }

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `cocktailflow-${exportType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Please paste JSON data to import');
      return;
    }

    setIsLoading(true);
    
    try {
      const data = JSON.parse(importData);
      
      // Validate the data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON data format');
      }

      let importCount = 0;
      
      // Import cocktails
      if (data.cocktails && Array.isArray(data.cocktails)) {
        saveAdminCocktails(data.cocktails);
        importCount += data.cocktails.length;
        console.log(`Imported ${data.cocktails.length} cocktails`);
      }
      
      // Import ingredients
      if (data.ingredients && Array.isArray(data.ingredients)) {
        saveAdminIngredients(data.ingredients);
        importCount += data.ingredients.length;
        console.log(`Imported ${data.ingredients.length} ingredients`);
      }
      
      // Import glass types
      if (data.glassTypes && Array.isArray(data.glassTypes)) {
        saveAdminGlassTypes(data.glassTypes);
        importCount += data.glassTypes.length;
        console.log(`Imported ${data.glassTypes.length} glass types`);
      }

      if (importCount === 0) {
        throw new Error('No valid data found to import');
      }

      setImportData('');
      alert(`Successfully imported data! ${importCount} items processed.`);
      
    } catch (error) {
      console.error('Import error:', error);
      alert(`Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all data to defaults? This will permanently delete all custom cocktails, ingredients, and modifications. This action cannot be undone.')) {
      try {
        resetToDefaults();
        alert('Data reset to defaults successfully! Please refresh the page to see changes.');
      } catch (error) {
        console.error('Reset error:', error);
        alert('Error resetting data. Please try again.');
      }
    }
  };

  const generateSampleData = () => {
    const sampleData = {
      cocktails: [
        {
          id: 'sample-cocktail',
          name: 'Sample Cocktail',
          description: 'A sample cocktail for testing import functionality',
          instructions: ['Add ingredients to shaker', 'Shake with ice', 'Strain into glass'],
          ingredients: [
            {
              ingredient: { id: 'vodka', name: 'Vodka', category: 'spirit', alcoholic: true },
              amount: '2 oz'
            }
          ],
          glassType: { id: 'martini', name: 'Martini Glass', description: 'V-shaped glass' },
          category: 'modern',
          tags: ['Sample', 'Test'],
          difficulty: 'easy',
          prepTime: 3,
          servings: 1
        }
      ],
      ingredients: [
        {
          id: 'sample-ingredient',
          name: 'Sample Ingredient',
          category: 'other',
          alcoholic: false,
          description: 'A sample ingredient for testing'
        }
      ]
    };
    
    setImportData(JSON.stringify(sampleData, null, 2));
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import & Export Data</h1>
          <p className="text-gray-600">Backup your data or import new cocktail collections</p>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
          <p className="text-gray-600 mb-4">
            Download your cocktail data as JSON files for backup or sharing.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Type
              </label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as 'all' | 'cocktails' | 'ingredients' | 'glass-types')}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Data (Recommended)</option>
                <option value="cocktails">Cocktails Only</option>
                <option value="ingredients">Ingredients Only</option>
                <option value="glass-types">Glass Types Only</option>
              </select>
            </div>
            
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>📥</span>
              Export Data
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h2>
          <p className="text-gray-600 mb-4">
            Import cocktail data from JSON files. This will add to or replace existing data.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JSON Data
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your JSON data here..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleImport}
                disabled={isLoading || !importData.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>📤</span>
                {isLoading ? 'Importing...' : 'Import Data'}
              </button>
              
              <button
                onClick={generateSampleData}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <span>📝</span>
                Load Sample Data
              </button>
              
              <button
                onClick={() => setImportData('')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Current Data</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Cocktails: {stats.cocktails}</div>
                  <div>Ingredients: {stats.ingredients}</div>
                  <div>Glass Types: {stats.glassTypes}</div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Storage</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Type: Browser LocalStorage</div>
                  <div>Persistent: Yes</div>
                  <div>Shareable: Via Export/Import</div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Backup</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Recommended: Weekly</div>
                  <div>Format: JSON</div>
                  <div>Size: ~50KB typical</div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Reset to Defaults</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete all custom data and restore the original cocktail database.
              </p>
              <button
                onClick={handleResetToDefaults}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <span>⚠️</span>
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Exporting Data</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Choose the type of data you want to export</li>
                <li>Click &quot;Export Data&quot; to download a JSON file</li>
                <li>Store the file safely as a backup</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Importing Data</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Open your JSON backup file in a text editor</li>
                <li>Copy the entire contents and paste into the text area</li>
                <li>Click &quot;Import Data&quot; to add the data to your collection</li>
                <li>Existing data with the same IDs will be replaced</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Data Format</h3>
              <p>
                The JSON format includes cocktails, ingredients, and glass types. 
                You can manually edit the JSON to customize data before importing.
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
