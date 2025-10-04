import React, { useState } from 'react';
import { PUBLIC_VRM_MODELS, VrmModelInfo } from '@/features/constants/vrmModels';
import { TextButton } from './textButton';

interface VrmLibraryProps {
  onVrmSelect: (url: string, modelInfo: VrmModelInfo) => void;
  onClose: () => void;
  selectedUrl?: string;
}

export const VrmLibrary: React.FC<VrmLibraryProps> = ({
  onVrmSelect,
  onClose,
  selectedUrl
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<VrmModelInfo | null>(null);

  const categories = ['all', 'cute', 'professional', 'creative', 'superhero', 'animal'];

  const filteredModels = filterCategory === 'all'
    ? PUBLIC_VRM_MODELS
    : PUBLIC_VRM_MODELS.filter(model => model.category === filterCategory);

  const handleSelectModel = (model: VrmModelInfo) => {
    setSelectedModel(model);
  };

  const handleConfirmSelection = () => {
    if (selectedModel) {
      onVrmSelect(selectedModel.url, selectedModel);
      onClose();
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      cute: '🥰',
      professional: '👔',
      creative: '🎨',
      superhero: '🦸',
      animal: '🐰',
      all: '📚'
    };
    return icons[category] || '📦';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cute: 'bg-pink-100 text-pink-800',
      professional: 'bg-blue-100 text-blue-800',
      creative: 'bg-purple-100 text-purple-800',
      superhero: 'bg-red-100 text-red-800',
      animal: 'bg-green-100 text-green-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">VRM Model Library</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${filterCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{getCategoryIcon(category)}</span>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} available
          </div>
        </div>

        {/* Model Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModels.map(model => (
              <div
                key={model.id}
                onClick={() => handleSelectModel(model)}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all
                  ${selectedModel?.id === model.id || selectedUrl === model.url
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }
                `}
              >
                {/* Model Icon/Placeholder */}
                <div className="mb-3 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-6xl opacity-70">
                    {getCategoryIcon(model.category)}
                  </div>
                </div>

                {/* Model Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {model.name}
                    </h3>
                    {(selectedModel?.id === model.id || selectedUrl === model.url) && (
                      <span className="text-blue-600 text-xl">✓</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {model.description}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(model.category)}`}>
                      {model.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {model.fileName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredModels.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-gray-600 mb-2">No models found</div>
              <div className="text-sm text-gray-500">
                Try selecting a different category
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedModel ? (
              <span className="font-medium">
                Selected: <span className="text-blue-600">{selectedModel.name}</span>
              </span>
            ) : (
              <span>Select a model to continue</span>
            )}
          </div>
          <div className="flex gap-3">
            <TextButton onClick={onClose}>
              Cancel
            </TextButton>
            <button
              onClick={handleConfirmSelection}
              disabled={!selectedModel}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all
                ${selectedModel
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Select Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
