/**
 * Application configuration with environment variable support
 * All values have fallbacks to maintain backward compatibility
 */

export const config = {
  // API Keys (server-side only)
  openAiKey: process.env.OPEN_AI_KEY,
  koeiromapApiKey: process.env.KOEIROMAP_API_KEY,

  // Base Configuration
  basePath: process.env.BASE_PATH || "",

  // API Endpoints
  api: {
    openAiUrl: process.env.NEXT_PUBLIC_OPENAI_API_URL || "https://api.openai.com/v1/chat/completions",
    koeiromapUrl: process.env.NEXT_PUBLIC_KOEIROMAP_API_URL || "https://api.rinna.co.jp/koeiromap/v1.0/infer",
    koeiromapCttseUrl: process.env.NEXT_PUBLIC_KOEIROMAP_CTTSE_URL || "https://api.rinna.co.jp/models/cttse/koeiro",
  },

  // Rate Limits & Timeouts
  limits: {
    speechSynthesisRateLimitMs: parseInt(process.env.NEXT_PUBLIC_SPEECH_SYNTHESIS_RATE_LIMIT_MS || "1000"),
    vrmUploadMaxSizeMb: parseInt(process.env.NEXT_PUBLIC_VRM_UPLOAD_MAX_SIZE_MB || "50"),
    vrmFilesKeepCount: parseInt(process.env.NEXT_PUBLIC_VRM_FILES_KEEP_COUNT || "5"),
  },

  // Animation Configuration
  animation: {
    saccadeMinInterval: parseFloat(process.env.NEXT_PUBLIC_SACCADE_MIN_INTERVAL || "0.5"),
    saccadeProc: parseFloat(process.env.NEXT_PUBLIC_SACCADE_PROC || "0.05"),
    saccadeRadius: parseFloat(process.env.NEXT_PUBLIC_SACCADE_RADIUS || "5.0"),
    blinkCloseMax: parseFloat(process.env.NEXT_PUBLIC_BLINK_CLOSE_MAX || "0.12"),
    blinkOpenMax: parseFloat(process.env.NEXT_PUBLIC_BLINK_OPEN_MAX || "5"),
  },

  // Lighting Configuration
  lighting: {
    directionalLightIntensity: parseFloat(process.env.NEXT_PUBLIC_DIRECTIONAL_LIGHT_INTENSITY || "0.6"),
    ambientLightIntensity: parseFloat(process.env.NEXT_PUBLIC_AMBIENT_LIGHT_INTENSITY || "0.4"),
  },

  // UI Configuration
  ui: {
    settingsSliderMax: parseInt(process.env.NEXT_PUBLIC_SETTINGS_SLIDER_MAX || "10"),
  },

  // Audio Configuration
  audio: {
    lipSyncTimeDomainDataLength: parseInt(process.env.NEXT_PUBLIC_LIPSYNC_TIME_DOMAIN_DATA_LENGTH || "2048"),
  },

  // External Resources
  external: {
    ogpImageUrl: process.env.NEXT_PUBLIC_OGP_IMAGE_URL || "https://pixiv.github.io/ChatVRM/ogp.png",
    githubRepoUrl: process.env.NEXT_PUBLIC_GITHUB_REPO_URL || "https://github.com/pixiv/ChatVRM",
  },
};

// Type-safe configuration getter
export const getConfig = <K extends keyof typeof config>(key: K): typeof config[K] => {
  return config[key];
};