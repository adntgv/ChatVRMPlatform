import { useEffect } from "react";
import { useRouter } from "next/router";
import { useInstances } from "@/features/instances/instanceContext";
import { Meta } from "@/components/meta";
import { GitHubLink } from "@/components/githubLink";

export default function HomePage() {
  const router = useRouter();
  const { instances, activeInstance, setActiveInstance, templates, createFromTemplate } = useInstances();

  const instanceList = Object.values(instances);

  const handleQuickStart = (instanceId: string) => {
    setActiveInstance(instanceId);
    router.push(`/viewer/${instanceId}`);
  };

  const handleManageInstances = () => {
    router.push('/instances');
  };

  const handleCreateNew = () => {
    router.push('/create');
  };

  const handleUseTemplate = (templateId: string) => {
    const instance = createFromTemplate(templateId);
    if (instance) {
      router.push(`/viewer/${instance.id}`);
    }
  };

  // Auto-redirect if only one instance exists
  useEffect(() => {
    if (instanceList.length === 1 && !activeInstance) {
      const singleInstance = instanceList[0];
      setActiveInstance(singleInstance.id);
      router.push(`/viewer/${singleInstance.id}`);
    }
  }, []);

  return (
    <div className="font-M_PLUS_2 min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Meta />

      {/* Hero Section - Responsive */}
      <div className="container mx-auto px-4 pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-3 sm:mb-4">
            ChatVRM Platform
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 px-4 sm:px-0">
            Create and interact with multiple 3D AI characters
          </p>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div className="container mx-auto px-4 pb-8 sm:pb-12 md:pb-16">
        {instanceList.length === 0 ? (
          // No instances - Show welcome screen
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
              <div className="mb-6 sm:mb-8">
                <div className="text-gray-300 mb-3 sm:mb-4">
                  <svg className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
                  Welcome to ChatVRM Platform
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-4 sm:px-0">
                  Get started by creating your first AI character instance
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button
                  onClick={handleCreateNew}
                  className="p-4 sm:p-5 md:p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl transition-all transform hover:scale-105 touch-button"
                >
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">✨</div>
                  <div className="font-bold text-base sm:text-lg mb-1">Custom Instance</div>
                  <div className="text-xs sm:text-sm opacity-90">Create from scratch</div>
                </button>
                <button
                  onClick={handleManageInstances}
                  className="p-4 sm:p-5 md:p-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl transition-all transform hover:scale-105 touch-button"
                >
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📚</div>
                  <div className="font-bold text-base sm:text-lg mb-1">Browse Templates</div>
                  <div className="text-xs sm:text-sm opacity-90">Start with a template</div>
                </button>
              </div>

              <div className="border-t pt-4 sm:pt-6">
                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Quick Start Templates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {templates.slice(0, 3).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleUseTemplate(template.id)}
                      className="p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-left transition-colors touch-button"
                    >
                      <div className="font-medium text-xs sm:text-sm mb-1 text-gray-800">{template.name}</div>
                      <div className="text-xs text-gray-600 line-clamp-2">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Has instances - Show quick access
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Your Instances</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCreateNew}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm sm:text-base touch-button transition-colors"
                  >
                    New Instance
                  </button>
                  <button
                    onClick={handleManageInstances}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm sm:text-base touch-button transition-colors"
                  >
                    Manage All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {instanceList.slice(0, 6).map((instance) => (
                  <div
                    key={instance.id}
                    className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer touch-target ${
                      activeInstance?.id === instance.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleQuickStart(instance.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-sm sm:text-base text-gray-800 line-clamp-1">{instance.name}</h3>
                      {activeInstance?.id === instance.id && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    {instance.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{instance.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{instance.chatHistory.length} messages</span>
                      <span className="capitalize">{instance.personality.language}</span>
                    </div>
                  </div>
                ))}
              </div>

              {instanceList.length > 6 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleManageInstances}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all {instanceList.length} instances →
                  </button>
                </div>
              )}
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <div className="text-3xl mb-3">🎭</div>
                <h3 className="font-bold mb-2">Multiple Characters</h3>
                <p className="text-sm text-gray-600">
                  Create unlimited character instances with unique personalities
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <div className="text-3xl mb-3">🔊</div>
                <h3 className="font-bold mb-2">Voice Synthesis</h3>
                <p className="text-sm text-gray-600">
                  Customize voice parameters for each character
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-6 text-center">
                <div className="text-3xl mb-3">💾</div>
                <h3 className="font-bold mb-2">Save & Share</h3>
                <p className="text-sm text-gray-600">
                  Export and import character configurations easily
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <GitHubLink />
    </div>
  );
}