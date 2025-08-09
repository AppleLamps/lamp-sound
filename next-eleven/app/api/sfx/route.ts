import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { text, duration, prompt_influence } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response('Missing required field: text', { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY || req.headers.get('x-dev-key') || '';
    if (!apiKey) return new Response('Missing ELEVENLABS_API_KEY', { status: 401 });

    const payload: Record<string, any> = { text };
    if (typeof duration === 'number') payload.duration = duration;
    if (typeof prompt_influence === 'number') payload.prompt_influence = prompt_influence;

    const resp = await fetch('https://api.elevenlabs.io/v1/text-to-sound-effects', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
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
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return new Response(e?.message || 'Server error', { status: 500 });
  }
}

