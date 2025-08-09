import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { text, voice_id, model_id, output_format, voice_settings } = await req.json();
    if (!text || !voice_id) {
      return new Response('Missing required fields: text, voice_id', { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY || req.headers.get('x-dev-key') || '';
    if (!apiKey) return new Response('Missing ELEVENLABS_API_KEY', { status: 401 });

    const payload: Record<string, any> = { text };
    if (model_id) payload.model_id = model_id;
    if (output_format) payload.output_format = output_format;
    if (voice_settings && typeof voice_settings === 'object') payload.voice_settings = voice_settings;

    const accept = output_format?.startsWith('mp3') ? 'audio/mpeg' : 'audio/wav';

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice_id)}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': accept,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(text, { status: resp.status });
    }

    const buf = await resp.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': accept,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return new Response(e?.message || 'Server error', { status: 500 });
  }
}

