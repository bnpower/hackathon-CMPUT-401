export const MAX_RESUME_FILE_SIZE = 2 * 1024 * 1024;
export const RESUME_IMPORT_LIMITATIONS =
    "PDF/DOCX extraction uses simple rules, not AI. Use Education, Work Experience, Skills, and Projects headings with one achievement per line for the best editable import.";

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
        /^[\p{L} .’'-]+,\s*[\p{L} .’'-]+$/u.test(value) ||
        /^[\p{L} .’'-]+,\s*(Canada|Ontario|Alberta|British Columbia|Quebec|Québec)$/iu.test(value)
    );
}
function splitTrailingPeriod(value) {
    const months =
        "Jan\\.?|January|Feb\\.?|February|Mar\\.?|March|Apr\\.?|April|May|Jun\\.?|June|Jul\\.?|July|Aug\\.?|August|Sep\\.?|Sept\\.?|September|Oct\\.?|October|Nov\\.?|November|Dec\\.?|December";
    const pattern = new RegExp(`\\b((?:(?:${months})\\s+)?(?:19|20)\\d{2}(?:\\s*[–-]\\s*(?:(?:${months})\\s+)?(?:(?:19|20)\\d{2}|present|current))?)$`, "i");
    const match = value.match(pattern);
    if (!match) return { body: value.trim(), period: "" };
    return { body: value.slice(0, match.index).trim(), period: match[1].trim() };
}
function splitTrailingLocation(value) {
    if (value.includes("|")) return { body: value.trim(), location: "" };
    const match = value.match(/^(.+)\s+((?:[\p{L} .’'-]+,\s*[\p{L} .’'-]+)|Remote|Hybrid|On-site)$/u);
    if (!match || !looksLikeLocation(match[2])) return { body: value.trim(), location: "" };
    return { body: match[1].trim(), location: match[2].trim() };
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

    const periodSplit = splitTrailingPeriod(value);
    const locationSplit = entry.location ? { body: periodSplit.body, location: "" } : splitTrailingLocation(periodSplit.body);
    const body = locationSplit.body || periodSplit.body;
    if (periodSplit.period && !entry.period) entry.period = periodSplit.period;
    if (locationSplit.location && !entry.location) entry.location = locationSplit.location;

    if (!body) return;
    if (!entry.title) entry.title = body;
    else if (!entry.subtitle && !looksLikePeriod(body) && (entry.location || !looksLikeLocation(body))) entry.subtitle = body;
    else if (!entry.period && looksLikePeriod(body)) entry.period = body;
    else if (!entry.location && looksLikeLocation(body)) entry.location = body;
    else entry.details += `${entry.details ? "\n" : ""}${body}`;
}
function hasBullet(lines) {
    return lines.some((line) => BULLET.test(line));
}
function isLikelyEntryHeader(line, section) {
    const value = line.trim();
    if (!value || BULLET.test(value)) return false;
    if (HEADINGS[headingKey(value)] || OTHER_HEADINGS.test(headingKey(value))) return false;
    if (section === "projects") return /\b(?:19|20)\d{2}\b/.test(value) || value.includes("|");
    if (section === "experience")
        return /\b(?:19|20)\d{2}\b/.test(value) || /\b(?:intern|engineer|developer|designer|manager|analyst|assistant|coordinator|consultant)\b/i.test(value);
    return false;
}
function splitEntryChunks(lines, section) {
    const cleaned = lines.map((line) => line.trim()).filter(Boolean);
    if (!cleaned.length) return [];
    if (section === "skills") return cleaned.map((line) => [line]);

    const chunks = [];
    let current = [];
    for (const line of cleaned) {
        const startsNextEntry =
            current.length > 0 &&
            !BULLET.test(line) &&
            ((section === "education" && current.length >= 2) || (hasBullet(current) && isLikelyEntryHeader(line, section)));
        if (startsNextEntry) {
            chunks.push(current);
            current = [];
        }
        current.push(line);
    }
    if (current.length) chunks.push(current);
    return chunks;
}
function parseEntries(lines, section) {
    return splitEntryChunks(lines, section)
        .filter((chunk) => chunk.length)
        .map((chunk) => {
            const entry = emptyEntry();
            if (section === "skills") {
                const [label, ...rest] = chunk[0].split(":");
                if (rest.length) {
                    entry.title = label.trim() || "Skills";
                    entry.details = rest.join(":").trim();
                } else {
                    entry.title = "Skills";
                    entry.details = chunk[0].replace(BULLET, "").trim();
                }
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
    if (new TextEncoder().encode(text).byteLength > MAX_RESUME_FILE_SIZE) throw new Error("Extracted resume text is too large to import.");
    const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    if (!normalized.trim()) throw new Error("No readable text was found in this resume.");
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) throw new Error("The extracted text could not be imported safely.");

    const data = { contact: emptyContact(), sections: { education: [], experience: [], skills: [], projects: [] } };
    const warnings = ["Best-effort PDF/DOCX extraction: check names, dates, section boundaries, and bullet points before saving."];
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
