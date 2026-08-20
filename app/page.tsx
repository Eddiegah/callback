"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "./components/Logo";
import ScoreRing from "./components/ScoreRing";

interface Gap {
  skill: string;
  why_it_matters: string;
}

interface InterviewQuestion {
  question: string;
  category: "technical" | "behavioral";
  what_a_strong_answer_covers: string;
}

interface AnalysisResult {
  fit_score: number;
  fit_summary: string;
  matched_skills: string[];
  gaps: Gap[];
  interview_questions: InterviewQuestion[];
  resume_suggestions: string[];
}

const LOADING_MESSAGES = [
  "Reading between the lines...",
  "Cross-checking your experience...",
  "Finding the real gaps...",
  "Drafting interview questions...",
];

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 1800);
    return () => clearInterval(id);
  }, [loading]);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsingPdf(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't read that PDF.");
      setResumeText(data.text);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that PDF.");
    } finally {
      setParsingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setLoadingMsgIdx(0);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  const canAnalyze = resumeText.trim().length >= 40 && jobDescription.trim().length >= 40 && !loading;

  return (
    <main className="relative flex-1 overflow-hidden">
      {/* ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-600/25 blur-[120px]" />
        <div className="absolute -right-32 top-20 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.08)_1px,transparent_0)] bg-[size:28px_28px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <header className="animate-slide-up text-center">
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <Logo className="h-9 w-9" />
            <span className="text-xl font-semibold tracking-tight text-slate-100">Callback</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            free &middot; no signup &middot; nothing saved
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400 sm:text-5xl">
            Know your gaps<br className="hidden sm:block" /> before the interview does.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-sm text-slate-400 sm:text-base">
            Paste your resume and a job description. Get an honest fit score, the real gaps, and interview
            questions built specifically for this role &mdash; not a generic question bank.
          </p>
        </header>

        {!result && (
          <div className="mt-10 grid animate-slide-up gap-5 stagger-1 sm:grid-cols-2">
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur transition-colors focus-within:border-indigo-500/50 hover:border-slate-700">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200">Your resume</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsingPdf}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition hover:text-indigo-300 disabled:opacity-50"
                >
                  {parsingPdf ? (
                    <>
                      <Spinner /> Reading...
                    </>
                  ) : (
                    "Upload PDF"
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
              </div>
              {fileName && !parsingPdf && (
                <p className="mb-2 truncate text-xs text-emerald-400">&#10003; {fileName}</p>
              )}
              <textarea
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setFileName(null);
                }}
                placeholder="Paste your resume text, or upload a PDF above..."
                className="h-60 w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-100 placeholder-slate-600 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur transition-colors focus-within:border-indigo-500/50 hover:border-slate-700">
              <label className="mb-2 block text-sm font-semibold text-slate-200">Job description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting..."
                className="h-60 w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-100 placeholder-slate-600 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-5 animate-slide-up rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">
            {error}
          </p>
        )}

        {!result && (
          <div className="mt-7 flex flex-col items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-9 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <span className="flex items-center gap-2">
                {loading && <Spinner />}
                {loading ? LOADING_MESSAGES[loadingMsgIdx] : "Analyze my fit"}
              </span>
            </button>
            {!canAnalyze && !loading && (resumeText || jobDescription) && (
              <p className="text-xs text-slate-600">A bit more detail needed in both fields to run a real analysis.</p>
            )}
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-6">
            <div className="flex animate-slide-up flex-col items-center gap-5 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-900/30 p-8 text-center backdrop-blur">
              <ScoreRing score={result.fit_score} />
              <p className="max-w-lg text-sm leading-relaxed text-slate-300">{result.fit_summary}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="animate-slide-up stagger-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur">
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <span>&#10003;</span> What matches
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {result.matched_skills.map((s, i) => (
                    <li key={i} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="animate-slide-up stagger-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur">
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                  <span>&#9888;</span> The real gaps
                </h2>
                <ul className="space-y-2.5">
                  {result.gaps.map((g, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium text-amber-300">{g.skill}</span>
                      <span className="text-slate-400"> &mdash; {g.why_it_matters}</span>
                    </li>
                  ))}
                  {result.gaps.length === 0 && <li className="text-sm text-slate-500">No significant gaps found.</li>}
                </ul>
              </div>
            </div>

            <div className="animate-slide-up stagger-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                <span>&#128172;</span> Interview questions to expect
              </h2>
              <ul className="space-y-4">
                {result.interview_questions.map((q, i) => (
                  <li key={i} className="rounded-lg border-l-2 border-indigo-500/40 bg-slate-950/30 py-2 pl-4 pr-3 transition hover:border-indigo-400/70">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-100">{q.question}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          q.category === "technical"
                            ? "bg-indigo-400/10 text-indigo-300"
                            : "bg-fuchsia-400/10 text-fuchsia-300"
                        }`}
                      >
                        {q.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{q.what_a_strong_answer_covers}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="animate-slide-up stagger-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                <span>&#9998;</span> Resume suggestions
              </h2>
              <ul className="space-y-2 text-sm text-slate-300">
                {result.resume_suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-indigo-400">&rarr;</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex animate-slide-up stagger-5 justify-center">
              <button
                onClick={reset}
                className="rounded-lg border border-slate-700 px-6 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Try another
              </button>
            </div>
          </div>
        )}

        <footer className="mt-16 border-t border-slate-800/80 pt-6 text-center text-xs text-slate-600">
          <p>
            AI-generated analysis &mdash; use your judgment. This doesn&apos;t guarantee an interview or a job,
            it just gives you an honest starting point.
          </p>
          <p className="mt-2">
            Nothing you paste here is stored. Built by{" "}
            <a href="https://github.com/Eddiegah" className="text-slate-500 transition hover:text-slate-300">
              Eddiegah
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
