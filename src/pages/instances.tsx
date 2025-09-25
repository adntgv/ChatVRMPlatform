import { useEffect, useState, useRef } from "react";
import { useInstances } from "@/features/instances/instanceContext";
import { Instance } from "@/features/instances/types";
import { Meta } from "@/components/meta";
import { useRouter } from "next/router";

export default function InstancesPage() {
  const router = useRouter();
  const {
    instances,
    activeInstance,
    createFromTemplate,
    deleteInstance,
    duplicateInstance,
    setActiveInstance,
    exportInstance,
    importInstance,
    templates
  } = useInstances();

  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const instanceList = Object.values(instances);

  const handleCreateNew = () => {
    router.push('/create');
  };

  const handleViewInstance = (instance: Instance) => {
    setActiveInstance(instance.id);
    router.push(`/viewer/${instance.id}`);
  };

  const handleEditInstance = (instance: Instance) => {
    router.push(`/edit/${instance.id}`);
  };

  const handleDeleteInstance = (instance: Instance) => {
    if (confirm(`Are you sure you want to delete "${instance.name}"?`)) {
      deleteInstance(instance.id);
    }
  };

  const handleDuplicateInstance = (instance: Instance) => {
    const duplicate = duplicateInstance(instance.id);
    if (duplicate) {
      alert(`Created duplicate: ${duplicate.name}`);
    }
  };

  const handleExportInstance = (instance: Instance) => {
    exportInstance(instance.id);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await importInstance(file);
    event.target.value = '';
  };

  const handleCreateFromTemplate = (templateId: string) => {
    const instance = createFromTemplate(templateId);
    if (instance) {
      setShowTemplates(false);
      router.push(`/edit/${instance.id}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="font-M_PLUS_2 bg-gray-50 min-h-screen">
      <Meta />

      {/* Responsive Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Instance Manager</h1>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg touch-button transition-colors"
              >
                Import
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg touch-button transition-colors"
              >
                Templates
              </button>
              <button
                onClick={handleCreateNew}
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg touch-button transition-colors"
              >
                Create New
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {instanceList.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-8">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Instances Yet</h2>
            <p className="text-gray-500 mb-6">Create your first character instance to get started</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create New Instance
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Start from Template
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {instanceList.map((instance) => (
              <div
                key={instance.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${
                  activeInstance?.id === instance.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">
                        {instance.name}
                      </h3>
                      {instance.description && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{instance.description}</p>
                      )}
                    </div>
                    {activeInstance?.id === instance.id && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Language:</span>
                      <span className="capitalize">{instance.personality.language}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Messages:</span>
                      <span>{instance.chatHistory.length}</span>
                    </div>
                    <div className="hidden sm:flex items-center">
                      <span className="font-medium mr-2">Created:</span>
                      <span>{formatDate(instance.createdAt)}</span>
                    </div>
                    {instance.lastUsed && (
                      <div className="hidden sm:flex items-center">
                        <span className="font-medium mr-2">Last Used:</span>
                        <span>{formatDate(instance.lastUsed)}</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile: Primary actions only */}
                  <div className="flex sm:hidden gap-2">
                    <button
                      onClick={() => handleViewInstance(instance)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium touch-button transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleEditInstance(instance)}
                      className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded font-medium touch-button transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteInstance(instance)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded touch-button transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  {/* Desktop: All actions */}
                  <div className="hidden sm:flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewInstance(instance)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleEditInstance(instance)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicateInstance(instance)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleExportInstance(instance)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => handleDeleteInstance(instance)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Choose a Template</h2>
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCreateFromTemplate(template.id)}
                >
                  <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                  <p className="text-gray-600">{template.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTemplates(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}