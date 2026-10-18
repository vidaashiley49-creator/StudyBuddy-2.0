import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_MODEL = 'gemini-3.8-flash';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    model: DEFAULT_MODEL,
    hasKey: Boolean(apiKey),
  });
});

// Download ZIP endpoint
app.get('/api/download-zip', (req, res) => {
  const zipPath = path.resolve(__dirname, 'public', 'studybuddy-ai-source.zip');
  res.download(zipPath, 'studybuddy-ai-source.zip', (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Failed to download zip file.' });
    }
  });
});

// Helper for cleaning JSON string if needed
function parseJsonSafely(raw: string) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned);
  }
}

// 1. AI Tutor Streaming Endpoint
app.post('/api/tutor', async (req, res) => {
  try {
    const {
      messages = [],
      subject = 'General',
      level = 'SHS',
      country = 'Ghana',
      curriculum = '',
      language = 'English',
      actionPrompt = '',
    } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Gemini API key is not configured in server environment.',
      });
    }

    const systemInstruction = `You are StudyBuddy AI, an exceptionally supportive, pedagogically sound, and patient personal study tutor.
You are tutoring a ${level} level student based in ${country}${curriculum ? ` following the ${curriculum} curriculum` : ''}.
Current subject: ${subject}.
Primary language: ${language}.

Teaching Guidelines:
- Teach for genuine deep understanding, not rote memorization.
- Explain concepts step-by-step using clear, engaging language suitable for a ${level} learner.
- Use bullet points, bold keywords, and numbered steps where appropriate to ensure high readability.
- For Math, Physics, and Chemistry: write clear mathematical expressions using LaTeX syntax (inline $...$ and block $$...$$), and detail every algebraic or conceptual step.
- Connect concepts to memorable everyday analogies and relevant real-world contexts in ${country}.
- If the student makes an error, gently clarify the misconception without making them feel discouraged.
- When finishing an explanation, provide one quick "Check Yourself" question or thought-starter to test understanding.
- Never fabricate dates, quotes, statistics, or historical facts. If unsure or if a topic is outside the curriculum, state so transparently.`;

    // Construct conversation contents
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of messages) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    if (actionPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: actionPrompt }],
      });
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: 'No messages provided.' });
    }

    // Set SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const streamResponse = await ai.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of streamResponse) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Tutor error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || 'Error communicating with AI tutor.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message || 'Streaming failed.' })}\n\n`);
      res.end();
    }
  }
});

// 2. Smart Quiz Generator Endpoint
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const {
      subject = 'Mathematics',
      topic = 'General Revision',
      difficulty = 'medium',
      count = 10,
      types = ['mcq'],
      level = 'SHS',
      country = 'Ghana',
      curriculum = '',
    } = req.body;

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    const typeDescriptions = types
      .map((t: string) => {
        if (t === 'mcq') return 'multiple choice (4 options: A, B, C, D)';
        if (t === 'tf') return 'true/false with options ["True", "False"]';
        return 'short answer with concise model answer';
      })
      .join(', ');

    const prompt = `Generate exactly ${count} educational quiz questions for a ${level} student in ${country}${curriculum ? ` studying under ${curriculum}` : ''}.
Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Question Types to include: ${typeDescriptions}.

Instructions:
1. Ensure questions strictly test conceptual mastery and curriculum depth for ${level}.
2. For multiple choice (mcq), provide 4 distinct plausible options in the "options" array. The "answer" must match one of the options verbatim.
3. For true/false (tf), provide options ["True", "False"] and set "answer" to "True" or "False".
4. For short answer (short), omit or leave options empty and provide an accurate concise "answer".
5. For EVERY question, write a thorough 2-3 sentence "explanation" detailing why the answer is correct and explaining the underlying concept clearly.
6. Make every question unique, challenging, and strictly factually correct.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['type', 'question', 'answer', 'explanation'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const parsed = parseJsonSafely(response.text || '{}');
    const questions = (parsed.questions || []).map((q: any, idx: number) => ({
      id: q.id || `q_${Date.now()}_${idx}`,
      type: q.type || 'mcq',
      question: q.question,
      options: q.options || [],
      answer: q.answer,
      explanation: q.explanation || '',
    }));

    res.json({
      title: parsed.title || `${subject}: ${topic} Quiz`,
      questions,
    });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate quiz.' });
  }
});

// 3. Flashcards Generator Endpoint
app.post('/api/flashcards/generate', async (req, res) => {
  try {
    const {
      subject = 'General',
      topic = '',
      notesText = '',
      count = 15,
      level = 'SHS',
    } = req.body;

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    const prompt = `Create exactly ${count} high-yield revision flashcards for a ${level} student.
Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}
${notesText ? `Source Material/Notes:\n"""\n${notesText.slice(0, 10000)}\n"""` : ''}

Flashcard rules:
- Front ("q"): A targeted, clear question or active recall prompt (e.g. "What is the primary function of ribosomes?", "State Boyle's Law formula and condition").
- Back ("a"): A clear, comprehensive, easy-to-digest answer with key definitions, formulas, or bullet points.
- Include a brief "hint" (1 short clue) for each card to assist during tough recall.
- Avoid trivial or repetitive cards; prioritize key concepts, definitions, formulas, and common exam questions.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  q: { type: Type.STRING },
                  a: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ['q', 'a'],
              },
            },
          },
          required: ['cards'],
        },
      },
    });

    const parsed = parseJsonSafely(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate flashcards.' });
  }
});

// 4. Notes & Summaries Generator Endpoint
app.post('/api/notes/generate', async (req, res) => {
  try {
    const {
      subject = 'General',
      sourceText = '',
      level = 'SHS',
      country = 'Ghana',
      curriculum = '',
    } = req.body;

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    if (!sourceText || sourceText.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide substantive source material or topic details.' });
    }

    const prompt = `You are a master academic notes and syllabus summarizer for ${level} level students in ${country}${curriculum ? ` (${curriculum})` : ''}.
Subject: ${subject}

Source material to analyze and convert into structured revision notes:
"""
${sourceText.slice(0, 15000)}
"""

Produce an in-depth, structured revision resource containing:
1. "title": A polished, professional academic title for this topic.
2. "summary": A concise, clear executive summary of the core concept (3-5 sentences).
3. "detailedNotes": Comprehensive, well-structured revision notes using Markdown format (with headings, bold terms, bullet points, and formulas where applicable).
4. "keyPoints": An array of 6 to 10 crucial high-yield takeaway points that students must memorize.
5. "terms": An array of 6 to 12 essential technical/academic terms with their precise definitions.
6. "practiceQuestions": An array of 5 to 8 exam-style practice questions with detailed model answers.
7. "checklist": An array of 6 to 10 practical revision checklist steps to confirm mastery.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            detailedNotes: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            terms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ['term', 'definition'],
              },
            },
            practiceQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ['question', 'answer'],
              },
            },
            checklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'summary', 'detailedNotes', 'keyPoints', 'terms', 'practiceQuestions', 'checklist'],
        },
      },
    });

    const parsed = parseJsonSafely(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Notes generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate study notes.' });
  }
});

// 5. AI Study Planner Generator Endpoint
app.post('/api/planner/generate', async (req, res) => {
  try {
    const {
      dailyMinutes = 60,
      daysCount = 14,
      exams = [],
      weakTopics = [],
      focusAreas = '',
      level = 'SHS',
      country = 'Ghana',
    } = req.body;

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    const prompt = `You are an expert academic tutor and revision coach.
Design a highly effective, realistic ${daysCount}-day revision study schedule for a ${level} student in ${country}.
Daily allocated study time: ${dailyMinutes} minutes.
Upcoming Exams: ${JSON.stringify(exams)}
Identified weak topics from past quizzes: ${JSON.stringify(weakTopics)}
Student's custom focus request: "${focusAreas || 'Comprehensive syllabus balance'}"

Rules:
- Formulate a balanced, progressive timetable spanning ${daysCount} days.
- Prioritize upcoming exam deadlines and known weak topics while avoiding study burnout.
- Break each day into 2 to 4 actionable, specific tasks with realistic time estimates summing up to ~${dailyMinutes} minutes.
- Provide an overarching "overview" summarizing the revision strategy.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  dayName: { type: Type.STRING },
                  focusSubject: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  estimatedMinutes: { type: Type.INTEGER },
                },
                required: ['dayNumber', 'dayName', 'focusSubject', 'topic', 'tasks', 'estimatedMinutes'],
              },
            },
          },
          required: ['overview', 'days'],
        },
      },
    });

    const parsed = parseJsonSafely(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Planner generation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate study schedule.' });
  }
});

// Vite middleware in development vs static serving in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`StudyBuddy AI Server running on port ${PORT}`);
});
