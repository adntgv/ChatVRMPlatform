import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useInstances } from "@/features/instances/instanceContext";
import { Meta } from "@/components/meta";
import { GitHubLink } from "@/components/githubLink";
import { analytics, usePageView } from "@/lib/analytics";
import { INSTANCE_TEMPLATES } from "@/features/instances/instanceService";

export default function HomePage() {
  const router = useRouter();
  const { instances, activeInstance, setActiveInstance, templates, createFromTemplate } = useInstances();

  // Track landing page view
  usePageView('landing');

  const instanceList = Object.values(instances);

  const handleDemoClick = () => {
    analytics.track('demo_cta_click', { source: 'landing_hero' });
    router.push('/demo');
  };

  const handleBuildClick = () => {
    analytics.track('wizard_start', { source: 'landing' });
    router.push('/create');
  };

  const handleReserveClick = () => {
    analytics.track('reserve_page_view', { source: 'landing' });
    router.push('/reserve');
  };

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

  const handleUseTemplate = async (templateId: string) => {
    const instance = await createFromTemplate(templateId);
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

      {/* Banner for existing users */}
      {instanceList.length > 0 && (
        <div className="bg-blue-900 text-white py-3 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <span className="text-sm">You have {instanceList.length} assistant{instanceList.length > 1 ? 's' : ''}</span>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-white text-blue-900 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>
      )}

      {/* LANDING PAGE - Always shown for validation */}
      <>
          {/* Hero Section */}
          <div className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12 md:pt-20 pb-12 sm:pb-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Your 3D AI Assistant.<br />
                <span className="text-blue-600">Built in Minutes.</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                Create custom VRM avatars that chat, answer questions, and engage your audience 24/7
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6 px-4">
                <button
                  onClick={handleDemoClick}
                  className="w-full sm:w-auto touch-target px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base sm:text-lg font-bold rounded-lg shadow-lg transition-all transform active:scale-95 sm:hover:scale-105"
                >
                  Try Live Demo →
                </button>
                <button
                  onClick={handleBuildClick}
                  className="w-full sm:w-auto touch-target px-6 sm:px-8 py-3 sm:py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-base sm:text-lg font-bold rounded-lg shadow-lg transition-all transform active:scale-95 sm:hover:scale-105"
                >
                  Build My Own
                </button>
              </div>

              <p className="text-sm text-gray-500">No signup required for demo • Free to start</p>

              {/* Value Props / Quick Stats */}
              <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">⚡</span>
                  <span className="font-medium">5-min setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🔒</span>
                  <span className="font-medium">Your API keys</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🎨</span>
                  <span className="font-medium">Fully customizable</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">💬</span>
                  <span className="font-medium">Unlimited assistants</span>
                </div>
              </div>
            </div>
          </div>

          {/* Use Cases - Outcome Focused */}
          <div className="bg-white py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3 sm:mb-4">
                Built for Real Results
              </h2>
              <p className="text-center text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
                Choose a template or build your own custom assistant
              </p>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
                {INSTANCE_TEMPLATES.slice(0, 3).map((template) => (
                  <div
                    key={template.id}
                    className="bg-gradient-to-br from-gray-50 to-white p-5 sm:p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all"
                  >
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{template.icon}</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 min-h-[60px]">
                      {template.description}
                    </p>
                    <button
                      onClick={handleDemoClick}
                      className="text-blue-600 hover:text-blue-700 active:text-blue-800 font-bold text-sm sm:text-base touch-target"
                    >
                      Try this demo →
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <button
                  onClick={handleBuildClick}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-bold rounded-lg shadow-lg transition-all"
                >
                  Create Custom Assistant
                </button>
              </div>
            </div>
          </div>

          {/* Social Proof / Features */}
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              <div className="text-center p-5 sm:p-6 bg-white rounded-xl shadow">
                <div className="text-3xl sm:text-4xl mb-3">⚡</div>
                <h3 className="font-bold text-base sm:text-lg mb-2">5-Minute Setup</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Go from idea to live assistant in minutes, not days
                </p>
              </div>
              <div className="text-center p-5 sm:p-6 bg-white rounded-xl shadow">
                <div className="text-3xl sm:text-4xl mb-3">🎨</div>
                <h3 className="font-bold text-base sm:text-lg mb-2">Fully Customizable</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Choose VRM models, voices, and personalities
                </p>
              </div>
              <div className="text-center p-5 sm:p-6 bg-white rounded-xl shadow sm:col-span-2 md:col-span-1">
                <div className="text-3xl sm:text-4xl mb-3">🔒</div>
                <h3 className="font-bold text-base sm:text-lg mb-2">Your Data, Your Keys</h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Use your own API keys, fully private and secure
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90">
                Try a demo now or let us build your assistant for you
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <button
                  onClick={handleDemoClick}
                  className="w-full sm:w-auto touch-target px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-900 hover:bg-gray-100 active:bg-gray-200 text-base sm:text-lg font-bold rounded-lg shadow-lg transition-all"
                >
                  Try Demo Free
                </button>
                <button
                  onClick={handleReserveClick}
                  className="w-full sm:w-auto touch-target px-6 sm:px-8 py-3 sm:py-4 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-200 text-gray-900 text-base sm:text-lg font-bold rounded-lg shadow-lg transition-all"
                >
                  We&apos;ll Build It For You - $49
                </button>
              </div>
            </div>
          </div>
        </>
    </div>
  );
}