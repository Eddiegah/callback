import { PDFParse } from "pdf-parse";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB - plenty for a resume, keeps parsing fast

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No PDF file was uploaded." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported - paste the text instead if yours is a different format." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That PDF is too large (max 8MB)." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Couldn't extract any text from that PDF - it may be a scanned image. Paste the text directly instead." },
        { status: 422 }
      );
    }
    return NextResponse.json({ text });
  } catch (err) {
    console.error("PDF parse failed:", err);
    return NextResponse.json({ error: "Couldn't read that PDF - paste the text directly instead." }, { status: 422 });
  }
}
