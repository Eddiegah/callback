"use client";

import { useRef, useState } from "react";

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

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400 border-emerald-400/40 bg-emerald-400/10";
  if (score >= 50) return "text-amber-400 border-amber-400/40 bg-amber-400/10";
  return "text-rose-400 border-rose-400/40 bg-rose-400/10";
}

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that PDF.");
    } finally {
      setParsingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAnalyze() {
    setLoading(true);
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
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            free &middot; no signup &middot; nothing saved
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Callback</h1>
          <p className="mt-3 text-lg text-slate-400">Know your gaps before the interview does.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Paste your resume and a job description. Get an honest fit score, the real gaps, and interview
            questions built specifically for this role &mdash; not a generic question bank.
          </p>
        </header>

        {!result && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200">Your resume</label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsingPdf}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  {parsingPdf ? "Reading PDF..." : "Upload PDF"}
                </button>
                <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text, or upload a PDF above..."
                className="h-64 w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">Job description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting..."
                className="h-64 w-full resize-none rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm text-rose-300">
            {error}
          </p>
        )}

        {!result && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="rounded-lg bg-indigo-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Analyzing..." : "Analyze my fit"}
            </button>
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-6">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full border-2 text-3xl font-bold ${scoreColor(result.fit_score)}`}>
                {result.fit_score}
              </div>
              <p className="max-w-lg text-sm text-slate-300">{result.fit_summary}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="mb-3 text-sm font-semibold text-emerald-400">What matches</h2>
                <ul className="flex flex-wrap gap-2">
                  {result.matched_skills.map((s, i) => (
                    <li key={i} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="mb-3 text-sm font-semibold text-amber-400">The real gaps</h2>
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

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-200">Interview questions to expect</h2>
              <ul className="space-y-4">
                {result.interview_questions.map((q, i) => (
                  <li key={i} className="border-l-2 border-indigo-500/40 pl-4">
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

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">Resume suggestions</h2>
              <ul className="space-y-2 text-sm text-slate-300">
                {result.resume_suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-indigo-400">&rarr;</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center">
              <button
                onClick={reset}
                className="rounded-lg border border-slate-700 px-6 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Try another
              </button>
            </div>
          </div>
        )}

        <footer className="mt-16 border-t border-slate-800 pt-6 text-center text-xs text-slate-600">
          <p>
            AI-generated analysis &mdash; use your judgment. This doesn&apos;t guarantee an interview or a job,
            it just gives you an honest starting point.
          </p>
          <p className="mt-2">
            Nothing you paste here is stored. Built by{" "}
            <a href="https://github.com/Eddiegah" className="text-slate-500 hover:text-slate-300">
              Eddiegah
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
