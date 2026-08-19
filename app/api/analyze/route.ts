import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MIN_LEN = 40;
const MAX_LEN = 20000;
const RATE_LIMIT_PER_HOUR = 8;

// In-memory, per-instance rate limit. Good enough for a single-region
// serverless deployment with modest traffic; resets on cold start, which
// only makes the limit more forgiving, never less.
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const recent = (requestLog.get(ip) ?? []).filter((t) => t > hourAgo);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_PER_HOUR;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    fit_score: {
      type: Type.INTEGER,
      description: "Overall fit between the resume and the job description, 0-100.",
    },
    fit_summary: {
      type: Type.STRING,
      description: "One or two honest sentences on overall fit - not generic encouragement.",
    },
    matched_skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific requirements from the job description the resume genuinely demonstrates, most relevant first.",
    },
    gaps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          why_it_matters: { type: Type.STRING },
        },
        required: ["skill", "why_it_matters"],
      },
      description: "Requirements from the job description the resume does not clearly demonstrate, most important first.",
    },
    interview_questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["technical", "behavioral"] },
          what_a_strong_answer_covers: { type: Type.STRING },
        },
        required: ["question", "category", "what_a_strong_answer_covers"],
      },
      description: "6-8 interview questions this specific candidate is likely to face for this specific role, mixing technical and behavioral.",
    },
    resume_suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-4 concrete, specific rewrite suggestions tied to this job description's actual keywords - never generic resume advice.",
    },
  },
  required: ["fit_score", "fit_summary", "matched_skills", "gaps", "interview_questions", "resume_suggestions"],
};

const SYSTEM_INSTRUCTION = `You are an honest technical hiring reviewer. You are given one resume and one \
job description. Your job is to assess fit and prepare the candidate for a real interview - not to \
flatter them and not to be needlessly harsh.

Rules:
- Ground every claim in the actual text provided. Never invent a skill, employer, or experience that \
isn't in the resume.
- fit_score should reflect a genuine assessment. A strong resume for an unrelated role should score low. \
A resume missing one or two things but otherwise strong should not be dragged down to a mediocre score.
- gaps must be real gaps relative to the job description, not nitpicks. If the resume is a strong match, \
return fewer gaps rather than inventing weak ones.
- interview_questions must be specific to this job description and this resume - reference the \
candidate's actual background where relevant, not a generic question bank.
- resume_suggestions must reference the job description's actual language/keywords, not generic advice \
like "use action verbs."`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Analysis isn't configured yet - GEMINI_API_KEY is missing on the server." },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests from this connection. Try again in a bit." },
      { status: 429 }
    );
  }

  let body: { resumeText?: string; jobDescription?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resumeText = (body.resumeText ?? "").trim();
  const jobDescription = (body.jobDescription ?? "").trim();

  if (resumeText.length < MIN_LEN || jobDescription.length < MIN_LEN) {
    return NextResponse.json(
      { error: "Both the resume and job description need to be substantial enough to analyze - a sentence or two isn't enough." },
      { status: 400 }
    );
  }
  if (resumeText.length > MAX_LEN || jobDescription.length > MAX_LEN) {
    return NextResponse.json(
      { error: `That's too long - keep each field under ${MAX_LEN.toLocaleString()} characters.` },
      { status: 400 }
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
      contents: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: "The analysis didn't return a result - try again." }, { status: 502 });
    }

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Gemini analysis failed:", err);
    return NextResponse.json({ error: "Analysis failed - please try again in a moment." }, { status: 502 });
  }
}
