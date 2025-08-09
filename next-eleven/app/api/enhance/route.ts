import { NextRequest } from 'next/server';

export const runtime = 'edge';

const SFX_SYSTEM = `You are a prompt enhancer for ElevenLabs audio generation.
Task: Rewrite the user's prompt to follow best practices for ElevenLabs Sound Effects prompts.

Guidelines (apply when relevant):
- Be specific: core effect, materials/sources (metal, wood, glass), mechanism (whoosh, impact, braam, riser), and style (cinematic, sci‑fi, horror, retro).
- Structure if needed: sequence and timing (e.g., "tight 0.3s attack, 1.2s tail with airy reverb").
- Space & processing: environment or processing (room, hall, outdoors, plate reverb, tape saturation, lowpass/highpass, transient emphasis).
- Frequency & dynamics: low‑end weight, mid presence, high shimmer; dynamic movement or steady level.
- Performance traits: tempo/pace for rhythmic/musical SFX (e.g., 90 BPM), swing/quantization, staccato vs. legato.
- Duration: include intended duration in seconds when important (≤ 22s).
- References: optional short style cues ("trailer braam", "analog synth", "foley footsteps on gravel").
- Keep it concise but production‑ready. No filler, no explanations.

Output: Return only the improved prompt text. No prose or markup.`;

const TTS_SYSTEM = `You are a prompt enhancer for ElevenLabs Text-to-Speech.
Task: Rewrite the user's text to read naturally and with clear delivery while preserving intent.

Guidelines:
- Natural phrasing and punctuation to guide prosody; split long sentences.
- Subtle stage directions only when essential (e.g., "[whisper]", "(excited)") and keep minimal.
- Avoid ALL CAPS; prefer standard capitalization.
- Numbers/dates: format for speech (e.g., "2025" → "twenty twenty‑five" when appropriate).
- Clarify abbreviations/acronyms with readable expansions only if needed.
- Maintain tone, audience, and brevity for TTS; remove filler.
- No markdown or special markup, return plain text only.

Output: Return only the improved TTS text. No commentary.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, type } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response('Missing required field: prompt', { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || '';
    const devKey = req.headers.get('x-dev-key') || '';
    const keyToUse = apiKey || devKey;
    if (!keyToUse) return new Response('Missing OPENROUTER_API_KEY', { status: 401 });

    const model = 'x-ai/grok-4';
    const system = type === 'tts' ? TTS_SYSTEM : SFX_SYSTEM;

    const payload = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    };

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(text, { status: resp.status });
    }

    const data = await resp.json();
    const improved = data?.choices?.[0]?.message?.content?.trim();
    if (!improved) return new Response('No content', { status: 502 });

    return new Response(JSON.stringify({ prompt: improved }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(e?.message || 'Server error', { status: 500 });
  }
}

