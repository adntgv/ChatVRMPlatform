# ChatVRM

ChatVRM is a project primarily aimed at technology sharing and demonstration.

This repository was archived with code as of 2024-07-18.
If you want to make changes to ChatVRM in the future, please fork the repository for development.

We also have a related project [local-chat-vrm](https://github.com/pixiv/local-chat-vrm).
local-chat-vrm is an application that can generate responses and speech synthesis in the browser. However, it only supports English responses and Japanese is not available.

---

ChatVRM is a demo application that allows easy conversation with 3D characters in a browser.

You can import VRM files to adjust voices to match characters and generate responses with emotional expressions.

ChatVRM's features primarily use the following technologies:

- User voice recognition
    - [Web Speech API(SpeechRecognition)](https://developer.mozilla.org/ja/docs/Web/API/SpeechRecognition)
- Response generation
    - [ChatGPT API](https://platform.openai.com/docs/api-reference/chat)
- Speech synthesis
    - [Koemotion/Koeiromap API](https://koemotion.rinna.co.jp/)
- 3D character display
    - [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)

## Running
To run in a local environment, clone or download this repository.

```bash
git clone git@github.com:pixiv/ChatVRM.git
```

Install the required packages.
```bash
npm install
```

After package installation is complete, configure your environment variables by copying the example file:
```bash
cp .env.example .env
```

Then edit the `.env` file to add your API keys and customize configuration as needed. See the Configuration section below for details.

Start the development web server with the following command:
```bash
npm run dev
```

After running, access the following URL to check the functionality.

[http://localhost:3000](http://localhost:3000) 


---

## Configuration

ChatVRM can be configured through environment variables. Copy `.env.example` to `.env` and customize as needed:

### API Keys
- `OPEN_AI_KEY` - Your OpenAI API key (server-side fallback)
- `KOEIROMAP_API_KEY` - Your Koeiromap API key (server-side fallback)

### Application Settings
- `BASE_PATH` - Base path for deployment (default: empty)
- `NEXT_PUBLIC_VRM_UPLOAD_MAX_SIZE_MB` - Maximum VRM file upload size in MB (default: 50)
- `NEXT_PUBLIC_SPEECH_SYNTHESIS_RATE_LIMIT_MS` - Rate limit for speech synthesis in milliseconds (default: 1000)

### Animation Settings
- `NEXT_PUBLIC_SACCADE_MIN_INTERVAL` - Minimum interval between eye saccades (default: 0.5)
- `NEXT_PUBLIC_BLINK_CLOSE_MAX` - Maximum blink close value (default: 0.12)
- `NEXT_PUBLIC_BLINK_OPEN_MAX` - Maximum blink open duration (default: 5)

### Lighting Settings
- `NEXT_PUBLIC_DIRECTIONAL_LIGHT_INTENSITY` - Directional light intensity (default: 0.6)
- `NEXT_PUBLIC_AMBIENT_LIGHT_INTENSITY` - Ambient light intensity (default: 0.4)

For a complete list of configuration options, see `.env.example`.

---

## ChatGPT API

ChatVRM uses the ChatGPT API for response generation.

For ChatGPT API specifications and terms of use, please check the following links and official site.

- [https://platform.openai.com/docs/api-reference/chat](https://platform.openai.com/docs/api-reference/chat)
- [https://openai.com/policies/api-data-usage-policies](https://openai.com/policies/api-data-usage-policies)


## Koeiromap API
ChatVRM uses Koemotion's Koeiromap API for speech synthesis of responses.

For Koeiromap API specifications and terms of use, please check the following links and official site.

- [https://koemotion.rinna.co.jp/](https://koemotion.rinna.co.jp/)
