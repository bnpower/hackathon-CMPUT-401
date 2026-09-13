export const MAX_RESUME_FILE_SIZE = 2 * 1024 * 1024;
export const RESUME_IMPORT_LIMITATIONS =
  "Text import uses simple rules, not AI. Use clear section headings and check every field before saving. PDF/DOCX extraction requires Django.";

export function parseResumeText(text) {
  if (new TextEncoder().encode(text).byteLength > MAX_RESUME_FILE_SIZE) {
    throw new Error("This file is too large. Choose a text resume of 2 MB or less.");
  }
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (!normalized.trim()) {
    throw new Error("This text file is empty. Choose a resume with some text to import.");
  }
  if (/^\s*(%PDF-|PK\u0003\u0004)/.test(normalized)) {
    throw new Error(
      "PDF/DOCX extraction requires Django. Export your resume as plain text (.txt) instead; renaming the file does not convert it.",
    );
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) {
    throw new Error("This does not look like a plain-text resume. Export a UTF-8 .txt file and try again.");
  }
  return {
    content: normalized.trim(),
    warnings: [
      "Best-effort text import: check names, dates, section boundaries, and bullet points before using this resume.",
    ],
  };
}

export async function importResumeFile(file) {
  if (file.size > MAX_RESUME_FILE_SIZE) {
    throw new Error("This file is too large. Choose a text resume of 2 MB or less.");
  }
  if (/\.(pdf|docx?|odt)$/i.test(file.name) || /pdf|word|officedocument|opendocument/i.test(file.type)) {
    throw new Error(
      "PDF/DOCX extraction requires Django. For now, export your resume as a UTF-8 plain-text (.txt) file and import that. You can also upload original PDF/DOCX files separately.",
    );
  }
  if (!/\.txt$/i.test(file.name)) {
    throw new Error("Choose a .txt file. Only plain-text resumes can be imported into the editor.");
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new Error("This file could not be read as UTF-8 text. Re-export it as a UTF-8 .txt file and try again.");
  }
  return parseResumeText(text);
}
