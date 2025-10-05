import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useInstances } from "@/features/instances/instanceContext";
import { Meta } from "@/components/meta";
import { SYSTEM_PROMPT } from "@/features/constants/systemPromptConstants";
import {
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from "@/features/constants/koeiroParam";
import { VrmLibrary } from "@/components/vrmLibrary";
import { VrmModelInfo } from "@/features/constants/vrmModels";
import { analytics, usePageView } from "@/lib/analytics";

const STEP_NAMES = ['basic', 'api', 'model', 'voice', 'personality'];

export default function CreateInstancePage() {
  const router = useRouter();
  const { createInstance } = useInstances();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track wizard start
  usePageView('create');
  useEffect(() => {
    analytics.track('wizard_start', { source: 'create_page' });
  }, []);

  const [step, setStep] = useState(1);
  const [previousStep, setPreviousStep] = useState(1);
  const [vrmTab, setVrmTab] = useState<'library' | 'upload'>('library');
  const [showVrmLibrary, setShowVrmLibrary] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    language: 'en' as 'en' | 'ja',

    // API Keys
    openAiKey: '',
    koeiromapKey: '',

    // VRM Model
    vrmName: 'Default VRM',
    vrmFile: null as File | null,
    vrmUrl: '' as string,

    // Voice Settings
    voicePreset: 'cute',
    speakerX: PRESET_A.speakerX,
    speakerY: PRESET_A.speakerY,

    // Personality
    systemPrompt: '',
    useDefaultPrompt: true,
  });

  const handleNext = () => {
    if (step < 5) {
      // Track step completion
      analytics.track('wizard_step_complete', {
        step: step,
        stepName: STEP_NAMES[step - 1],
        formData: {
          hasName: !!formData.name,
          hasApiKeys: !!formData.openAiKey || !!formData.koeiromapKey,
          hasVrmModel: !!formData.vrmUrl || !!formData.vrmFile,
          voicePreset: formData.voicePreset,
        }
      });

      setPreviousStep(step);
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setPreviousStep(step);
      setStep(step - 1);
    }
  };

  // Track abandonments (when user navigates away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (step < 5) {
        analytics.track('wizard_step_abandon', {
          step: step,
          stepName: STEP_NAMES[step - 1],
          progress: (step / 5) * 100
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  const handleVoicePresetChange = (preset: string) => {
    let params = PRESET_A;
    switch (preset) {
      case 'cute':
        params = PRESET_A;
        break;
      case 'energetic':
        params = PRESET_B;
        break;
      case 'cool':
        params = PRESET_C;
        break;
      case 'mature':
        params = PRESET_D;
        break;
    }
    setFormData({
      ...formData,
      voicePreset: preset,
      speakerX: params.speakerX,
      speakerY: params.speakerY,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.vrm')) {
      setFormData({
        ...formData,
        vrmFile: file,
        vrmName: file.name,
        vrmUrl: '', // Clear library URL when uploading
      });
    }
  };

  const handleVrmLibrarySelect = (url: string, modelInfo: VrmModelInfo) => {
    setFormData({
      ...formData,
      vrmUrl: url,
      vrmName: modelInfo.name,
      vrmFile: null, // Clear uploaded file when selecting from library
    });
    setShowVrmLibrary(false);
  };

  const handleSubmit = async () => {
    // Track final step completion
    analytics.track('wizard_step_complete', {
      step: 5,
      stepName: 'personality',
      complete: true
    });

    const instance = await createInstance({
      name: formData.name || 'New Character',
      description: formData.description,
      apiKeys: {
        openAI: formData.openAiKey,
        koeiromap: formData.koeiromapKey,
      },
      vrmModel: {
        name: formData.vrmName,
        url: formData.vrmUrl || undefined,
        file: formData.vrmFile || undefined,
      },
      voice: {
        speakerX: formData.speakerX,
        speakerY: formData.speakerY,
        preset: formData.voicePreset,
      },
      personality: {
        systemPrompt: formData.useDefaultPrompt ? SYSTEM_PROMPT : formData.systemPrompt,
        language: formData.language,
      },
    });

    if (instance) {
      // Track successful instance creation
      analytics.track('instance_created', {
        source: 'wizard',
        hasApiKeys: !!formData.openAiKey || !!formData.koeiromapKey,
        hasCustomVrm: !!formData.vrmFile,
        hasCustomPrompt: !formData.useDefaultPrompt,
        language: formData.language,
      });

      router.push('/instances');
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return true; // API keys are optional
      case 3:
        return true; // VRM is optional (uses default)
      case 4:
        return true; // Voice settings have defaults
      case 5:
        return !formData.useDefaultPrompt ? formData.systemPrompt.trim().length > 0 : true;
      default:
        return false;
    }
  };

  return (
    <div className="font-M_PLUS_2 bg-gray-50 min-h-screen">
      <Meta />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Create New Instance</h1>
            <button
              onClick={() => router.push('/instances')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  s <= step ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 5 && (
                <div
                  className={`w-20 h-1 ${
                    s < step ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Instance Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Friendly Assistant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief description of this character..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'ja' })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: API Keys */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-6">API Configuration</h2>
              <p className="text-gray-600 mb-4">
                API keys are optional but required for chat and voice features.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
                  <input
                    type="password"
                    value={formData.openAiKey}
                    onChange={(e) => setFormData({ ...formData, openAiKey: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get your key from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Koeiromap API Key</label>
                  <input
                    type="password"
                    value={formData.koeiromapKey}
                    onChange={(e) => setFormData({ ...formData, koeiromapKey: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Koeiromap API key..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For voice synthesis features
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: VRM Model */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-6">3D Character Model</h2>

              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6 border-b">
                <button
                  onClick={() => setVrmTab('library')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    vrmTab === 'library'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📚 Library
                </button>
                <button
                  onClick={() => setVrmTab('upload')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    vrmTab === 'upload'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📤 Upload
                </button>
              </div>

              {/* Library Tab */}
              {vrmTab === 'library' && (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">
                    Choose from pre-installed VRM models
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {formData.vrmUrl ? (
                      <div>
                        <p className="text-green-600 mb-2">✓ {formData.vrmName}</p>
                        <button
                          onClick={() => setShowVrmLibrary(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Change Model
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500 mb-4">
                          Browse available VRM models
                        </p>
                        <button
                          onClick={() => setShowVrmLibrary(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Open VRM Library
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Tab */}
              {vrmTab === 'upload' && (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">
                    Upload your own VRM file
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {formData.vrmFile ? (
                      <div>
                        <p className="text-green-600 mb-2">✓ {formData.vrmName}</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Change Model
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500 mb-4">
                          Upload a VRM file (max 50MB)
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Choose VRM File
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vrm"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Selected Model Info */}
              {(formData.vrmUrl || formData.vrmFile) && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Selected:</strong> {formData.vrmName}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Voice Settings */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Voice Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Voice Preset</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['cute', 'energetic', 'cool', 'mature'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleVoicePresetChange(preset)}
                        className={`px-4 py-2 rounded-lg capitalize ${
                          formData.voicePreset === preset
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fine-tune Voice Parameters
                  </label>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm">X: {formData.speakerX}</span>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.1"
                        value={formData.speakerX}
                        onChange={(e) =>
                          setFormData({ ...formData, speakerX: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <span className="text-sm">Y: {formData.speakerY}</span>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        step="0.1"
                        value={formData.speakerY}
                        onChange={(e) =>
                          setFormData({ ...formData, speakerY: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Personality */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Personality Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={formData.useDefaultPrompt}
                      onChange={(e) =>
                        setFormData({ ...formData, useDefaultPrompt: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Use default personality</span>
                  </label>
                  {!formData.useDefaultPrompt && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        System Prompt (Character Personality)
                      </label>
                      <textarea
                        value={formData.systemPrompt}
                        onChange={(e) =>
                          setFormData({ ...formData, systemPrompt: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={8}
                        placeholder="Define your character's personality, behavior, and conversation style..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className={`px-6 py-2 rounded-lg ${
                step === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              Previous
            </button>
            {step < 5 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`px-6 py-2 rounded-lg ${
                  isStepValid()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid()}
                className={`px-6 py-2 rounded-lg ${
                  isStepValid()
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Create Instance
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VRM Library Modal */}
      {showVrmLibrary && (
        <VrmLibrary
          onVrmSelect={handleVrmLibrarySelect}
          onClose={() => setShowVrmLibrary(false)}
          selectedUrl={formData.vrmUrl}
        />
      )}
    </div>
  );
}