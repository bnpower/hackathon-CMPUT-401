export const MAX_RESUME_FILE_SIZE = 2 * 1024 * 1024;
export const RESUME_IMPORT_LIMITATIONS =
    "Text and image import uses simple rules, not AI. Use Education, Work Experience, Skills, and Projects headings with one achievement per line. PNG/JPEG import uses your browser's OCR when available. PDF/DOCX extraction requires Django.";

const SECTIONS = ["education", "experience", "skills", "projects"];
const HEADINGS = {
    education: "education",
    "academic background": "education",
    "academic history": "education",
    experience: "experience",
    "work experience": "experience",
    "professional experience": "experience",
    employment: "experience",
    skills: "skills",
    "technical skills": "skills",
    projects: "projects",
    "personal projects": "projects",
    "selected projects": "projects",
};
const OTHER_HEADINGS = /^(summary|profile|objective|certifications?|awards?|activities|languages|interests)$/i;
const BULLET = /^\s*(?:[-*•▪◦‣]|\d+[.)])\s+/;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /\+?\d[\d ().-]{7,}\d/;
const URL = /(?:https?:\/\/|www\.)[^\s|<>]+|(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|app|me|ca|edu)(?:\/[^\s|<>]*)?/i;

function headingKey(line) {
    return line
        .trim()
        .replace(/^#{1,6}\s*/, "")
        .replace(/[:\s]+$/, "")
        .replace(/\s*&\s*/g, " and ")
        .toLowerCase();
}
function emptyContact() {
    return { fullName: "", email: "", phone: "", location: "", website: "", linkedin: "" };
}
function emptyEntry() {
    return { id: Date.now() + Math.random(), title: "", subtitle: "", location: "", period: "", details: "", visible: true };
}
function looksLikePeriod(value) {
    return /\b(?:19|20)\d{2}\b/.test(value) || /^(present|current|ongoing)$/i.test(value);
}
function looksLikeLocation(value) {
    return (
        /^(remote|hybrid|on-site)$/i.test(value) ||
        /^[\p{L} .’'-]+,\s*[A-Z]{2}$/u.test(value) ||
        /^[\p{L} .’'-]+,\s*(Canada|Ontario|Alberta|British Columbia|Quebec|Québec)$/iu.test(value)
    );
}
function parseContact(lines, contact, unparsedLines) {
    const useful = lines.map((line) => line.trim()).filter(Boolean);
    if (useful[0] && !EMAIL.test(useful[0]) && !PHONE.test(useful[0]) && !URL.test(useful[0]) && useful[0].length <= 100) {
        contact.fullName = useful[0];
    }
    useful.forEach((line) => {
        line.split(/\s*[|•]\s*/).forEach((part) => {
            const value = part.trim();
            if (!value) return;
            const email = value.match(EMAIL)?.[0];
            const phone = value.match(PHONE)?.[0];
            const url = value.match(URL)?.[0];
            if (email && !contact.email) contact.email = email;
            else if (phone && !contact.phone) contact.phone = phone;
            else if (url && /linkedin/i.test(url) && !contact.linkedin) contact.linkedin = url;
            else if (url && !contact.website) contact.website = url;
            else if (looksLikeLocation(value) && !contact.location) contact.location = value;
            else if (value !== contact.fullName) unparsedLines.push(value);
        });
    });
}
function addMetadata(entry, text) {
    const value = text.trim().replace(BULLET, "");
    if (!value) return;
    const labelled = value.match(/^(title|role|school|degree|company|organization|location|dates?|period|technologies):\s*(.+)$/i);
    if (labelled) {
        const label = labelled[1].toLowerCase();
        const body = labelled[2].trim();
        if (["location"].includes(label)) entry.location = body;
        else if (["date", "dates", "period"].includes(label)) entry.period = body;
        else if (["company", "organization", "degree", "technologies"].includes(label)) entry.subtitle = entry.subtitle || body;
        else entry.title = entry.title || body;
        return;
    }
    if (!entry.title) entry.title = value;
    else if (!entry.subtitle && !looksLikePeriod(value) && !looksLikeLocation(value)) entry.subtitle = value;
    else if (!entry.period && looksLikePeriod(value)) entry.period = value;
    else if (!entry.location && looksLikeLocation(value)) entry.location = value;
    else entry.details += `${entry.details ? "\n" : ""}${value}`;
}
function parseEntries(lines, section) {
    const chunks = [];
    let current = [];
    for (const line of lines) {
        if (!line.trim()) {
            if (current.length) chunks.push(current);
            current = [];
        } else current.push(line);
    }
    if (current.length) chunks.push(current);
    const source = chunks.length ? chunks : [lines.filter((line) => line.trim())];
    return source
        .filter((chunk) => chunk.length)
        .map((chunk) => {
            const entry = emptyEntry();
            if (section === "skills") {
                entry.title = chunk[0]?.replace(BULLET, "").trim() || "Skills";
                entry.details = chunk
                    .slice(chunk.length > 1 ? 1 : 0)
                    .map((line) => line.replace(BULLET, "").trim())
                    .filter(Boolean)
                    .join("\n");
                if (!entry.details && entry.title !== "Skills") entry.details = entry.title;
                if (entry.title !== "Skills" && entry.details === entry.title) entry.title = "Skills";
                return entry;
            }
            chunk.forEach((line, index) => {
                if (BULLET.test(line) || index > 1) entry.details += `${entry.details ? "\n" : ""}${line.replace(BULLET, "").trim()}`;
                else addMetadata(entry, line);
            });
            return entry;
        });
}

export function parseResumeText(text) {
    if (new TextEncoder().encode(text).byteLength > MAX_RESUME_FILE_SIZE) throw new Error("This file is too large. Choose a text resume of 2 MB or less.");
    const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    if (!normalized.trim()) throw new Error("This text file is empty. Choose a resume with some text to import.");
    if (/^\s*(%PDF-|PK\u0003\u0004)/.test(normalized))
        throw new Error("PDF/DOCX extraction requires Django. Export your resume as plain text (.txt) instead; renaming the file does not convert it.");
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized))
        throw new Error("This does not look like a plain-text resume. Export a UTF-8 .txt file and try again.");

    const data = { contact: emptyContact(), sections: { education: [], experience: [], skills: [], projects: [] } };
    const warnings = ["Best-effort text extraction: check names, dates, section boundaries, and bullet points before saving."];
    const unparsedLines = [];
    const sectionLines = { education: [], experience: [], skills: [], projects: [] };
    const header = [];
    let current = null;
    normalized.split("\n").forEach((line) => {
        const key = headingKey(line);
        if (HEADINGS[key]) current = HEADINGS[key];
        else if (OTHER_HEADINGS.test(key)) current = "unparsed";
        else if (current === "unparsed") {
            if (line.trim()) unparsedLines.push(line.trim());
        } else if (current) sectionLines[current].push(line);
        else header.push(line);
    });
    parseContact(header, data.contact, unparsedLines);
    SECTIONS.forEach((section) => {
        data.sections[section] = parseEntries(sectionLines[section], section);
    });
    if (!data.contact.fullName) warnings.push("Your name was not detected. Add it in Contact details.");
    if (!data.contact.email) warnings.push("No email address was detected. Check your contact details.");
    if (!SECTIONS.some((section) => data.sections[section].length)) warnings.push("No supported section headings were found. Add entries manually.");
    if (unparsedLines.length) warnings.push("Some text could not be placed automatically and was left out. Review the original import if needed.");
    return { data, warnings, unparsedLines };
}

function isImageResume(file) {
    return /\.(png|jpe?g)$/i.test(file.name) || /^image\/(png|jpe?g)$/i.test(file.type);
}

async function extractTextFromImage(file) {
    if (!("TextDetector" in window)) {
        throw new Error(
            "PNG/JPEG import needs browser OCR support. Try this in Chrome/Edge with the TextDetector API enabled, or export the resume as a UTF-8 .txt file and import that.",
        );
    }
    if (!("createImageBitmap" in window)) {
        throw new Error("This browser cannot read resume images for import. Export the resume as a UTF-8 .txt file and try again.");
    }

    let bitmap;
    try {
        bitmap = await createImageBitmap(file);
        const detector = new window.TextDetector();
        const detections = await detector.detect(bitmap);
        const text = detections
            .map((item) => item.rawValue || "")
            .filter(Boolean)
            .join("\n");
        if (!text.trim()) throw new Error("No readable text was found in this image. Try a sharper PNG/JPEG or import a .txt export instead.");
        return text;
    } finally {
        bitmap?.close?.();
    }
}

export async function importResumeFile(file) {
    if (file.size > MAX_RESUME_FILE_SIZE) throw new Error("This file is too large. Choose a resume file of 2 MB or less.");
    if (/\.(pdf|docx?|odt)$/i.test(file.name) || /pdf|word|officedocument|opendocument/i.test(file.type)) {
        throw new Error(
            "PDF/DOCX extraction requires Django. For now, export your resume as a UTF-8 plain-text (.txt) file and import that. You can also upload original PDF/DOCX files separately.",
        );
    }

    let text;
    if (isImageResume(file)) {
        text = await extractTextFromImage(file);
        const parsed = parseResumeText(text);
        return {
            ...parsed,
            warnings: [
                "Best-effort OCR import: check every field because image text recognition can miss names, dates, bullets, or section boundaries.",
                ...parsed.warnings,
            ],
        };
    }

    if (!/\.txt$/i.test(file.name)) throw new Error("Choose a .txt, .png, .jpg, or .jpeg file to import into the editor.");
    try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
    } catch {
        throw new Error("This file could not be read as UTF-8 text. Re-export it as a UTF-8 .txt file and try again.");
    }
    return parseResumeText(text);
}
