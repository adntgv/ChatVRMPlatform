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

After package installation is complete, start the development web server with the following command.
```bash
npm run dev
```

After running, access the following URL to check the functionality.

[http://localhost:3000](http://localhost:3000) 


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
