# ElevenLabs SFX + TTS (Next.js / Vercel)

Minimal Next.js (App Router) app to generate Sound Effects and Text-to-Speech via ElevenLabs, with serverless API routes that proxy requests so your ELEVENLABS_API_KEY stays private.

## Quickstart (Local)

1. cd next-eleven
2. npm install
3. Create .env.local with:

```
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

4. npm run dev
5. Open http://localhost:3000

Optional: For local testing without env vars, you can paste a dev-only key in the UI. It will be sent as `x-dev-key` header to the API routes. Do not use this in production.

## Deploy to Vercel

- Push this folder to a Git repo and import to Vercel
- Set Project → Settings → Environment Variables:
  - ELEVENLABS_API_KEY = your key
- Deploy

## API routes

- POST /api/sfx
  - Body: `{ text: string, duration?: number, prompt_influence?: number }`
  - Returns: audio/mpeg

- POST /api/tts
  - Body: `{ text: string, voice_id: string, model_id?: string, output_format?: string, voice_settings?: {...} }`
  - Returns: audio/mpeg or audio/wav depending on `output_format`

## Notes

- For longer content, stitch multiple outputs.
- Consider using ElevenLabs WebSocket APIs for real-time TTS.
- Keep your key server-side; never expose it in client bundles.

