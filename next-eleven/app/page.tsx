"use client";
import { useMemo, useRef, useState } from 'react';

export default function HomePage() {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);

  // SFX
  const [sfxPrompt, setSfxPrompt] = useState('Cinematic braam with deep sub-bass and metallic resonance');
  const [sfxDuration, setSfxDuration] = useState<string>('');
  const [sfxInfluence, setSfxInfluence] = useState<number>(0.7);
  const [sfxStatus, setSfxStatus] = useState('');
  const [enhanceStatus, setEnhanceStatus] = useState('');
  const sfxAudioRef = useRef<HTMLAudioElement>(null);
  const sfxDownloadHref = useRef<string>('');

  // TTS
  const [ttsText, setTtsText] = useState('Hello from ElevenLabs!');
  const [voiceId, setVoiceId] = useState('JBFqnCBsd6RMkjVDRZzb');
  const [modelId, setModelId] = useState('eleven_flash_v2_5');
  const [outputFormat, setOutputFormat] = useState('mp3_44100_128');
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [speakerBoost, setSpeakerBoost] = useState<string>('');
  const [ttsStatus, setTtsStatus] = useState('');
  const [ttsEnhanceStatus, setTtsEnhanceStatus] = useState('');

  const ttsAudioRef = useRef<HTMLAudioElement>(null);
  const ttsDownloadHref = useRef<string>('');

  const acceptForTTS = useMemo(() => (outputFormat.startsWith('mp3') ? 'audio/mpeg' : 'audio/wav'), [outputFormat]);

  async function callApi(path: string, body: any, accept?: string) {
    setSfxStatus('');
    setTtsStatus('');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accept) headers['Accept'] = accept;
    if (hasKey && apiKeyInput) headers['x-dev-key'] = apiKeyInput; // dev-only override

    const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${text}`);
    }
    return new Uint8Array(await res.arrayBuffer());
  }

  async function onEnhancePrompt() {
    try {
      setEnhanceStatus('Enhancing...');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (hasKey && apiKeyInput) headers['x-dev-key'] = apiKeyInput;
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: sfxPrompt }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${text}`);
      }
      const data = await res.json();
      if (data?.prompt) setSfxPrompt(data.prompt);
      setEnhanceStatus('Enhanced');
    } catch (e: any) {
      setEnhanceStatus(e?.message || 'Error enhancing prompt');
    }
  }

  async function onEnhanceTTS() {
    try {
      setTtsEnhanceStatus('Enhancing...');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (hasKey && apiKeyInput) headers['x-dev-key'] = apiKeyInput;
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: ttsText, type: 'tts' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${text}`);
      }
      const data = await res.json();
      if (data?.prompt) setTtsText(data.prompt);
      setTtsEnhanceStatus('Enhanced');
    } catch (e: any) {
      setTtsEnhanceStatus(e?.message || 'Error enhancing text');
    }
  }

  async function onSuggestDuration() {
    try {
      const m = sfxPrompt.match(/\b(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)\b/i);
      const el = document.getElementById('durationStatus');
      if (m) {
        const val = Math.min(22, Math.max(0.1, parseFloat(m[1])));
        setSfxDuration(String(val));
        if (el) el.textContent = `Set duration to ${val}s`;
      } else {
        if (el) el.textContent = 'No duration found in prompt';
      }
    } catch {}
  }

  async function onGenSfx() {
    try {
      setSfxStatus('Generating...');
      const payload: any = { text: sfxPrompt };
      if (sfxDuration) payload.duration = Number(sfxDuration);
      if (Number.isFinite(sfxInfluence)) payload.prompt_influence = sfxInfluence;

      const audioU8 = await callApi('/api/sfx', payload, 'audio/mpeg');
      const url = URL.createObjectURL(new Blob([audioU8], { type: 'audio/mpeg' }));
      if (sfxAudioRef.current) {
        sfxAudioRef.current.src = url;
        sfxAudioRef.current.play();
      }
      sfxDownloadHref.current = url;
      setSfxStatus('Done');
    } catch (e: any) {
      setSfxStatus(e?.message || String(e));
    }
  }

  async function onGenTts() {
    try {
      setTtsStatus('Generating...');
      const vs: any = {};
      if (Number.isFinite(stability)) vs.stability = stability;
      if (Number.isFinite(similarity)) vs.similarity_boost = similarity;
      if (speakerBoost === 'true') vs.speaker_boost = true; else if (speakerBoost === 'false') vs.speaker_boost = false;

      const body = { text: ttsText, voice_id: voiceId, model_id: modelId, output_format: outputFormat, voice_settings: Object.keys(vs).length ? vs : undefined };
      const audioU8 = await callApi('/api/tts', body, acceptForTTS);
      const url = URL.createObjectURL(new Blob([audioU8], { type: acceptForTTS }));
      if (ttsAudioRef.current) {
        ttsAudioRef.current.src = url;
        ttsAudioRef.current.play();
      }
      ttsDownloadHref.current = url;
      setTtsStatus('Done');
    } catch (e: any) {
      setTtsStatus(e?.message || String(e));
    }
  }

  return (
    <main>
      <header className="site-header">
        <div className="brand">
          <svg className="logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M4 8.5C4 6 6 4 8.5 4h7C18 4 20 6 20 8.5v7c0 2.5-2 4.5-4.5 4.5h-7C6 20 4 18 4 15.5v-7Z" stroke="#5cc8ff" strokeWidth="1.2"/>
            <path d="M8 12h8" stroke="#7df0c4" strokeWidth="1.2"/>
            <path d="M12 8v8" stroke="#7df0c4" strokeWidth="1.2"/>
          </svg>
          <h1>ElevenLabs Sound Generator</h1>
        </div>
      </header>

          <div className="tooltip" aria-label="Prompt tips" title="Prompt tips">
            i
            <div className="tip">
              <h4>Prompt tips</h4>
              <ul>
                <li>Keep ≤ 22s. Stitch multiple clips for longer sequences.</li>
                <li>Be specific: materials, mechanism, environment/processing.</li>
                <li>Include timing (attack/tail) if important.</li>
                <li>Use prompt influence to control creativity.</li>
              </ul>
            </div>
          </div>

      <section className="helper">
          <div className="actions">
            <button type="button" className="btn secondary" onClick={onSuggestDuration} title="Set duration from prompt">Set duration</button>
            <span className="status" id="durationStatus"></span>
          </div>

        <div className="actions">
          <label htmlFor="apiKey">Dev key override (optional)</label>
          <input id="apiKey" type="password" placeholder="For local dev only" value={apiKeyInput} onChange={(e)=>setApiKeyInput(e.target.value)} />
          <button type="button" className="btn" onClick={()=>setHasKey(Boolean(apiKeyInput))}>Use Key</button>
          <span className="small">{hasKey ? 'Key set for this session (header x-dev-key).' : ''}</span>
        </div>
        <p className="small">Deploy to Vercel and set ELEVENLABS_API_KEY as an Environment Variable. Never commit your key.</p>
      </section>

      <nav className="tabs">
        <a href="#sfx">Sound Effects</a>
        <a href="#tts">Text to Speech</a>
      </nav>

      <section id="sfx" className="panel">
        <h2>Text to Sound Effects</h2>
        <div className="grid">
          <label htmlFor="sfxPrompt">Prompt</label>
          <div className="actions">
            <textarea id="sfxPrompt" placeholder="Describe the effect with materials, mechanism, timing…" value={sfxPrompt} onChange={(e)=>setSfxPrompt(e.target.value)} rows={3} />
            <button type="button" className="btn secondary" onClick={onEnhancePrompt} title="Enhance prompt">Enhance</button>
            <span className={`status${enhanceStatus.startsWith('Error') ? ' error' : ''}`}>{enhanceStatus}</span>
          </div>

          <div className="row-3">
            <div>
              <label>Duration (sec)</label>
              <input value={sfxDuration} onChange={(e)=>setSfxDuration(e.target.value)} placeholder="e.g., 5" />
            </div>
            <div className="range-row">
              <label htmlFor="sfxInfluence">Prompt influence</label>
              <input id="sfxInfluence" aria-label="Prompt influence" type="range" min={0} max={1} step={0.05} value={sfxInfluence} onChange={(e)=>setSfxInfluence(Number(e.target.value))} />
              <div className="small">{sfxInfluence.toFixed(2)}</div>
            </div>
          </div>

          <div className="actions">
            <button type="button" className="btn primary" onClick={onGenSfx}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M10 17l5-5-5-5v10z" fill="#05301f"/>
              </svg>
              Generate SFX
            </button>
            <span className={`status${sfxStatus.startsWith('Error') ? ' error' : ''}`}>{sfxStatus}</span>
          </div>

          <div className="player">
            <audio ref={sfxAudioRef} controls />
            {sfxDownloadHref.current && (
              <a className="btn secondary" href={sfxDownloadHref.current} download="sfx.mp3">Download</a>
            )}
          </div>
        </div>
      </section>

      <section id="tts" className="panel">
        <h2>Text to Speech</h2>
        <div className="grid">
          <label htmlFor="ttsText">Text</label>
          <div className="actions">
            <textarea id="ttsText" placeholder="Write concise, natural dialogue or narration…" value={ttsText} onChange={(e)=>setTtsText(e.target.value)} rows={4} />
            <button type="button" className="btn secondary" onClick={onEnhanceTTS} title="Improve TTS text">Improve</button>
            <span className={`status${ttsEnhanceStatus.startsWith('Error') ? ' error' : ''}`}>{ttsEnhanceStatus}</span>
          </div>

          <div className="row-3">
            <div>
              <label htmlFor="voiceId">Voice ID</label>
              <input id="voiceId" placeholder="e.g., JBFqnCBsd6RMkjVDRZzb" value={voiceId} onChange={(e)=>setVoiceId(e.target.value)} />
            </div>
            <div>
              <label htmlFor="modelId">Model</label>
              <select id="modelId" aria-label="Model" value={modelId} onChange={(e)=>setModelId(e.target.value)}>
                <option value="eleven_flash_v2_5">eleven_flash_v2_5 (fast)</option>
                <option value="eleven_turbo_v2_5">eleven_turbo_v2_5</option>
                <option value="eleven_multilingual_v2">eleven_multilingual_v2</option>
              </select>
            </div>
            <div>
              <label htmlFor="outputFormat">Output format</label>
              <select id="outputFormat" aria-label="Output format" value={outputFormat} onChange={(e)=>setOutputFormat(e.target.value)}>
                <option value="mp3_44100_128">mp3_44100_128</option>
                <option value="mp3_44100_192">mp3_44100_192</option>
                <option value="wav_44100">wav_44100</option>
              </select>
            </div>
          </div>

          <details>
            <summary>Voice settings (optional)</summary>
            <div className="row-3">
              <div className="range-row">
                <label>Stability</label>
                <input type="range" min={0} max={1} step={0.05} value={stability} onChange={(e)=>setStability(Number(e.target.value))} />
                <div className="small">{stability.toFixed(2)}</div>
              </div>
              <div className="range-row">
                <label>Similarity boost</label>
                <input type="range" min={0} max={1} step={0.05} value={similarity} onChange={(e)=>setSimilarity(Number(e.target.value))} />
                <div className="small">{similarity.toFixed(2)}</div>
              </div>
              <div>
                <label>Speaker boost</label>
                <select value={speakerBoost} onChange={(e)=>setSpeakerBoost(e.target.value)}>
                  <option value="">(leave default)</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            </div>
          </details>

          <div className="actions">
            <button type="button" className="btn primary" onClick={onGenTts}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M10 17l5-5-5-5v10z" fill="#05301f"/>
              </svg>
              Generate TTS
            </button>
            <span className={`status${ttsStatus.startsWith('Error') ? ' error' : ''}`}>{ttsStatus}</span>
          </div>

          <div className="player">
            <audio ref={ttsAudioRef} controls />
            {ttsDownloadHref.current && (
              <a className="btn secondary" href={ttsDownloadHref.current} download={outputFormat.startsWith('mp3') ? 'tts.mp3' : 'tts.wav'}>Download</a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

