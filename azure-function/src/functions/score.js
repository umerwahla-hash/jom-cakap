// Jom Cakap pronunciation helper.
// Receives a short 16 kHz mono WAV recording from the app plus the sentence the child
// was meant to say, asks Azure Speech for a pronunciation assessment, and returns a
// child-friendly summary: {stars, words:[{w,status,score}], heard, scores}.
// The Speech key stays here, in the Function App's settings, never in the public app.
const { app } = require('@azure/functions');

const KEY = process.env.SPEECH_KEY;
const REGION = process.env.SPEECH_REGION || 'southeastasia';

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, ' ').trim();

function wordStatus(score, errorType) {
  if (errorType === 'Omission') return 'miss';
  if (errorType === 'Mispronunciation') return score >= 60 ? 'near' : 'miss';
  if (score >= 80) return 'ok';
  if (score >= 60) return 'near';
  return 'miss';
}

app.http('score', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'function',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204 };
    if (!KEY) return { status: 500, jsonBody: { error: 'SPEECH_KEY is not set in the Function App settings' } };

    const text = String(request.query.get('text') || '').slice(0, 300).trim();
    const lang = /^[a-z]{2}-[A-Z]{2}$/.test(request.query.get('lang') || '') ? request.query.get('lang') : 'ms-MY';
    if (!text) return { status: 400, jsonBody: { error: 'Missing ?text=' } };

    const audio = Buffer.from(await request.arrayBuffer());
    if (audio.length < 1000) return { status: 400, jsonBody: { error: 'Recording is empty' } };
    if (audio.length > 1_200_000) return { status: 413, jsonBody: { error: 'Recording is too long (max about 30 seconds)' } };

    const pa = Buffer.from(JSON.stringify({
      ReferenceText: text,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      Dimension: 'Comprehensive',
      EnableMiscue: true
    })).toString('base64');

    const url = `https://${REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${lang}&format=detailed`;
    let r;
    try {
      r = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': KEY,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          'Pronunciation-Assessment': pa,
          'Accept': 'application/json'
        },
        body: audio
      });
    } catch (e) {
      context.error('Speech request failed', e);
      return { status: 502, jsonBody: { error: 'Could not reach Azure Speech' } };
    }
    const bodyText = await r.text();
    if (!r.ok) {
      context.warn(`Speech ${r.status}: ${bodyText.slice(0, 300)}`);
      return { status: 502, jsonBody: { error: `Azure Speech returned ${r.status}`, detail: bodyText.slice(0, 300) } };
    }
    let j;
    try { j = JSON.parse(bodyText); } catch { return { status: 502, jsonBody: { error: 'Unreadable reply from Azure Speech' } }; }

    const target = norm(text).split(/\s+/).filter(Boolean);
    if (j.RecognitionStatus && j.RecognitionStatus !== 'Success') {
      // e.g. NoMatch / InitialSilenceTimeout: nothing usable was heard
      return { status: 200, jsonBody: { stars: 0, heard: '', words: target.map(w => ({ w, status: 'miss', score: 0 })), scores: null, status: j.RecognitionStatus } };
    }
    const best = (j.NBest && j.NBest[0]) || {};
    const P = best.PronunciationAssessment || best; // newer replies nest scores; older ones are flat
    const scores = {
      pron: +(P.PronScore ?? 0),
      accuracy: +(P.AccuracyScore ?? 0),
      fluency: +(P.FluencyScore ?? 0),
      completeness: +(P.CompletenessScore ?? 0)
    };

    // Map Azure's words back onto the target words, in order (insertions are extra words he added).
    const az = (best.Words || []).filter(w => {
      const pw = w.PronunciationAssessment || w;
      return pw.ErrorType !== 'Insertion';
    }).map(w => {
      const pw = w.PronunciationAssessment || w;
      return { w: norm(w.Word), score: +(pw.AccuracyScore ?? 0), err: pw.ErrorType || 'None' };
    });
    const words = target.map((w, i) => {
      const m = az.find(x => x.w === w && !x.used) || az[i];
      if (m) m.used = true;
      const score = m ? m.score : 0;
      return { w, score: Math.round(score), status: m ? wordStatus(score, m.err) : 'miss' };
    });

    const overall = scores.pron || scores.accuracy;
    const stars = overall >= 85 ? 3 : overall >= 70 ? 2 : overall >= 50 ? 1 : 0;
    return {
      status: 200,
      jsonBody: { stars, heard: best.Display || best.Lexical || j.DisplayText || '', words, scores }
    };
  }
});
