import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useInstance, useInstances } from "@/features/instances/instanceContext";
import { Meta } from "@/components/meta";
import {
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from "@/features/constants/koeiroParam";
import { VrmLibrary } from "@/components/vrmLibrary";
import { VrmModelInfo } from "@/features/constants/vrmModels";

export default function EditInstancePage() {
  const router = useRouter();
  const { instanceId } = router.query;
  const { updateInstance } = useInstances();
  const instance = useInstance(instanceId as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [vrmTab, setVrmTab] = useState<'library' | 'upload'>('library');
  const [showVrmLibrary, setShowVrmLibrary] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'en' as 'en' | 'ja',
    openAiKey: '',
    koeiromapKey: '',
    vrmName: '',
    vrmFile: null as File | null,
    vrmUrl: '' as string,
    voicePreset: '',
    speakerX: 0,
    speakerY: 0,
    systemPrompt: '',
  });

  useEffect(() => {
    if (instance) {
      setFormData({
        name: instance.name,
        description: instance.description || '',
        language: instance.personality.language,
        openAiKey: instance.apiKeys.openAI || '',
        koeiromapKey: instance.apiKeys.koeiromap || '',
        vrmName: instance.vrmModel.name,
        vrmFile: null,
        vrmUrl: instance.vrmModel.url || '',
        voicePreset: instance.voice.preset || 'custom',
        speakerX: instance.voice.speakerX,
        speakerY: instance.voice.speakerY,
        systemPrompt: instance.personality.systemPrompt,
      });
    }
  }, [instance]);

  const handleVoicePresetChange = (preset: string) => {
    let params = { speakerX: formData.speakerX, speakerY: formData.speakerY };
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

  const handleSave = async () => {
    if (!instance || !instanceId) return;

    await updateInstance(instanceId as string, {
      name: formData.name,
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
        systemPrompt: formData.systemPrompt,
        language: formData.language,
      },
    });

    router.push('/instances');
  };

  const handleCancel = () => {
    router.push('/instances');
  };

  if (!instance) {
    return (
      <div className="font-M_PLUS_2 h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Instance Not Found</h2>
          <button
            onClick={() => router.push('/instances')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Instances
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-M_PLUS_2 bg-gray-50 min-h-screen">
      <Meta />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Edit Instance</h1>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
          {/* Basic Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Instance Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
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

          {/* API Configuration */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">API Configuration</h2>
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
              </div>
            </div>
          </div>

          {/* VRM Model */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">3D Character Model</h2>

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
                        Current: {formData.vrmName}
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
                        Current: {formData.vrmName}
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

          {/* Voice Settings */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Voice Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Voice Preset</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                <label className="block text-sm font-medium mb-2">Fine-tune Parameters</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm">X: {formData.speakerX.toFixed(1)}</span>
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
                    <span className="text-sm">Y: {formData.speakerY.toFixed(1)}</span>
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

          {/* Personality Settings */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Personality Settings</h2>
            <div>
              <label className="block text-sm font-medium mb-2">System Prompt</label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={10}
                placeholder="Define character personality and behavior..."
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Instance Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Messages:</span> {instance.chatHistory.length}
              </div>
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(instance.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {new Date(instance.updatedAt).toLocaleDateString()}
              </div>
            </div>
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