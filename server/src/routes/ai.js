const express = require('express');
const Groq = require('groq-sdk');

const router = new express.Router();

const PRIMARY_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];

const SYSTEM_PROMPT = `You are "RescueLink AI", an empathetic, highly trained emergency voice first-aid assistant for road accident bystanders in India.
Your mission is to keep the responder calm and give clear, life-saving, step-by-step instructions.

Guidelines:
1. Always reassure the helper: Remind them they are fully protected under India's Good Samaritan Law (2016) and cannot be detained or prosecuted.
2. Be concise, direct, and numbered: In an emergency, every second counts.
3. Use plain, simple language that anyone can follow without medical training.
4. Highlight critical cautions (e.g. "Do NOT remove helmet if neck injury is suspected", "Do NOT move victim unless fire/explosion danger").
5. Keep your response under 200 words so it can be spoken quickly and clearly.`;

async function createGroqStream(groq, messages) {
  let lastError = null;
  for (const model of PRIMARY_MODELS) {
    try {
      const stream = await groq.chat.completions.create({
        model,
        messages,
        stream: true,
        max_tokens: 600,
        temperature: 0.2
      });
      return stream;
    } catch (err) {
      console.warn(`Groq model ${model} failed, trying next fallback:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All Groq models failed');
}

// ── 1. Structured First-Aid Assessment Guide ──────────────────
router.post('/guide', async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'PASTE_YOUR_GROQ_KEY_HERE') {
      return res.status(500).json({ error: 'Groq API Key not configured' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    let symptomsText = Array.isArray(symptoms)
      ? symptoms.map(s => (typeof s === 'string' ? `- ${s}` : `- ${s.question || s.q}: ${s.answer || s.a}`)).join('\n')
      : 'Road accident reported.';

    const userPrompt = `A bystander at a road accident scene has provided the following victim assessment:
${symptomsText}

Provide immediate, numbered first-aid steps the bystander should execute RIGHT NOW while emergency responders are en route. Reassure the bystander and keep it clear and actionable.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await createGroqStream(groq, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ]);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        // Strip out any <think> tags if present in some models
        const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '');
        if (cleanContent) {
          res.write(`data: ${JSON.stringify({ text: cleanContent })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Groq /guide Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// ── 2. Real-time Conversational Voice Chat ────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { messages = [], query } = req.body;

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'PASTE_YOUR_GROQ_KEY_HERE') {
      return res.status(500).json({ error: 'Groq API Key not configured' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const conversation = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    if (query) {
      conversation.push({ role: 'user', content: query });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await createGroqStream(groq, conversation);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '');
        if (cleanContent) {
          res.write(`data: ${JSON.stringify({ text: cleanContent })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Groq /chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
