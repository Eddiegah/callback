<div align="center">

# 📞 Callback

**Know your gaps before the interview does.**

Paste your resume and a job description. Get an honest fit score, the real gaps, and interview questions built specifically for that role — not a generic question bank.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?style=flat&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)

</div>

---

## What this is

Job-search advice is usually generic — "use action verbs," "tailor your resume." Callback does something more specific: it reads your actual resume against an actual job description and tells you, honestly, where you stand.

- **A real fit score**, not a participation-trophy number — a resume for an unrelated role scores low, on purpose.
- **The actual gaps**, each with why it matters for *this* role — not a boilerplate list.
- **6-8 interview questions** built from your specific background and this specific job description.
- **Resume suggestions** tied to the job posting's real language, not generic advice.

No signup, nothing saved. You paste two things, get an answer, and that's the whole product.

## How it works

A single Gemini call, constrained to structured JSON output (`responseSchema`) rather than free-text parsing, so results are consistent and machine-checkable rather than templated prose that occasionally breaks. The system prompt is explicit about staying grounded in the actual text provided — it's told not to invent skills or soften a genuine mismatch into a good score.

PDF resumes are parsed server-side (`pdf-parse`); pasting text works too and is the more reliable path if your PDF is a scanned image.

## Honest limitations

This is a fast, useful second opinion — not a hiring decision. It can't see your actual interview performance, doesn't know your company's specific culture fit, and an LLM's read on "gaps" is a reasonable inference, not certainty. Treat the output as a strong starting point for prep, not a verdict.

## Running it locally

```bash
npm install
cp .env.example .env.local   # add your own GEMINI_API_KEY - free tier, no card: https://aistudio.google.com/apikey
npm run dev
```

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS, `@google/genai` for structured Gemini calls, `pdf-parse` for resume uploads. Deployed on Vercel.

## License

MIT
