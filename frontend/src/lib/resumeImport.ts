import { RESUME_SECTIONS, type Contact, type ResumeEntry, type ResumeSection } from "../types";

export const MAX_RESUME_FILE_SIZE = 2 * 1024 * 1024;
export const RESUME_IMPORT_LIMITATIONS =
    "Text import uses simple rules, not AI. Use Education, Experience, Skills, and Projects headings, blank lines between entries, and one achievement per line. Check every field before saving. PDF/DOCX extraction requires Django.";

export interface ResumeImportResult {
    contact: Contact;
    sections: Record<ResumeSection, ResumeEntry[]>;
    warnings: string[];
    unparsedLines: string[];
}

const MAX_ENTRIES_PER_SECTION = 100;
const HEADINGS: Record<string, ResumeSection> = {
    education: "education",
    "academic background": "education",
    "academic history": "education",
    experience: "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "employment history": "experience",
    employment: "experience",
    skills: "skills",
    "technical skills": "skills",
    "core skills": "skills",
    "skills and technologies": "skills",
    projects: "projects",
    "personal projects": "projects",
    "selected projects": "projects",
    "academic projects": "projects",
};
const OTHER_HEADINGS =
    /^(summary|professional summary|profile|objective|certifications?|awards?|publications?|references?|interests?|volunteer(?:ing| experience)?|activities|languages)$/i;
const BULLET = /^\s*(?:[-*•▪◦‣]|\d+[.)])\s+/;
const EMAIL = /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/i;
const PHONE = /\+?\d[\d ().-]{7,}\d/;
const URL = /(?:https?:\/\/|www\.)[^\s|<>]+|(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|app|me|ca|edu)(?:\/[^\s|<>]*)?/gi;
const CONTACT_LABELS: Record<string, keyof Contact> = {
    name: "fullName",
    "full name": "fullName",
    email: "email",
    "e-mail": "email",
    phone: "phone",
    mobile: "phone",
    tel: "phone",
    location: "location",
    address: "location",
    website: "website",
    portfolio: "website",
    linkedin: "linkedin",
};

function headingKey(line: string) {
    return line
        .trim()
        .replace(/^#{1,6}\s*/, "")
        .replace(/[:\s]+$/, "")
        .replace(/\s*&\s*/g, " and ")
        .toLowerCase();
}

function emptyEntry(): ResumeEntry {
    return { id: crypto.randomUUID(), title: "", subtitle: "", location: "", period: "", details: "", visible: true };
}

function isPeriod(value: string) {
    return (
        (/\b(?:19|20)\d{2}\b/.test(value) &&
            /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+|(?:0?[1-9]|1[0-2])[/.])?(?:19|20)\d{2}(?:\b|\/)/i.test(value)) ||
        /^(present|current|ongoing)$/i.test(value)
    );
}

function isLocation(value: string) {
    return (
        /^(remote|hybrid|on-site)$/i.test(value) ||
        /^[\p{L} .’'-]+,\s*[A-Z]{2}$/u.test(value) ||
        /^[\p{L} .’'-]+,\s*(?:Canada|United States|United Kingdom|Ontario|Alberta|British Columbia|Quebec|Québec)$/iu.test(value)
    );
}

/** Keeps ambiguous text for human review instead of inventing missing resume facts. */
function parseContact(lines: string[], contact: Contact, unparsedLines: string[]) {
    for (const line of lines.filter((line) => line.trim())) {
        for (const raw of line.split(/\s*[|•]\s*/)) {
            let value = raw.trim();
            if (!value) continue;
            // Long paragraphs are not contact fields; avoid expensive regex scans on large files.
            if (value.length > 2000) {
                unparsedLines.push(value);
                continue;
            }
            const labeled = value.match(/^([\w -]+):\s*(.+)$/);
            const label = labeled?.[1].toLowerCase().trim();
            const field = label && Object.hasOwn(CONTACT_LABELS, label) ? CONTACT_LABELS[label] : undefined;
            if (field) {
                if (!contact[field]) contact[field] = labeled![2].trim();
                else unparsedLines.push(value);
                continue;
            }
            const email = value.includes("@") ? value.match(EMAIL)?.[0] : undefined;
            if (email && contact.email) {
                unparsedLines.push(value);
                continue;
            }
            if (email) {
                contact.email = email;
                value = value.replace(email, "").trim();
            }
            const phone = value.match(PHONE)?.[0];
            if (phone && phone.replace(/\D/g, "").length >= 10 && phone.replace(/\D/g, "").length <= 15 && !contact.phone) {
                contact.phone = phone;
                value = value.replace(phone, "").trim();
            }
            for (const match of value.matchAll(URL)) {
                const url = match[0].replace(/[.,;]+$/, "");
                const key = /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\//i.test(url) ? "linkedin" : "website";
                if (!contact[key]) {
                    contact[key] = url;
                    value = value.replace(match[0], "").trim();
                }
            }
            value = value.replace(/^[\s,;·–—-]+|[\s,;·–—-]+$/g, "");
            if (!value || /^(contact|contact information|resume|résumé)$/i.test(value)) continue;
            if (!contact.location && isLocation(value)) {
                contact.location = value;
            } else if (
                !contact.fullName &&
                /^[\p{L}][\p{L} .’'-]+$/u.test(value) &&
                value.split(/\s+/).length >= 2 &&
                value.split(/\s+/).length <= 5 &&
                !/^(?:summary|objective|experienced|seeking|software|senior|junior|frontend|backend|fullstack)\b/i.test(value)
            ) {
                contact.fullName = value;
            } else {
                unparsedLines.push(value);
            }
        }
    }
}

function addMetadata(entry: ResumeEntry, text: string) {
    const labeled = text.match(/^(location|dates?|period|company|organization|institution|degree|technologies|role|title):\s*(.+)$/i);
    if (labeled) {
        const label = labeled[1].toLowerCase();
        const key = label === "location" ? "location" : /^(dates?|period)$/.test(label) ? "period" : /^(role|title)$/.test(label) ? "title" : "subtitle";
        if (!entry[key]) {
            entry[key] = labeled[2];
            return;
        }
    }
    if (isPeriod(text) && !entry.period) entry.period = text;
    else if (isLocation(text) && !entry.location) entry.location = text;
    else if (!entry.subtitle) entry.subtitle = text;
    else entry.details += `${entry.details ? "\n" : ""}${text}`;
}

function parseEntries(lines: string[], section: ResumeSection, result: ResumeImportResult): ResumeEntry[] {
    function limitGroups(groups: string[][]) {
        if (groups.length > MAX_ENTRIES_PER_SECTION) {
            result.unparsedLines.push(`${section.toUpperCase()} — additional entries`);
            groups.slice(MAX_ENTRIES_PER_SECTION).forEach((group) => group.forEach((line) => result.unparsedLines.push(line)));
            result.warnings.push(
                `Only the first ${MAX_ENTRIES_PER_SECTION} ${section} entries were structured to keep the editor responsive. Additional text is available for review.`,
            );
        }
        return groups.slice(0, MAX_ENTRIES_PER_SECTION);
    }
    if (section === "skills") {
        return limitGroups(lines.filter((line) => line.trim()).map((line) => [line])).map(([line]) => {
            const entry = emptyEntry();
            const text = line.replace(BULLET, "").trim();
            const separator = text.search(/[:|]/);
            entry.title = separator > 0 ? text.slice(0, separator).trim() : "Skills";
            entry.details = separator > 0 ? text.slice(separator + 1).trim() : text;
            return entry;
        });
    }
    const groups: string[][] = [];
    let group: string[] = [];
    function flush() {
        if (group.length) groups.push(group);
        group = [];
    }
    for (const raw of lines) {
        const line = raw.trim();
        if (!line) {
            flush();
            continue;
        }
        // A pipe-delimited heading after achievements usually starts another job/project.
        if (!BULLET.test(line) && line.includes("|") && group.some((item) => BULLET.test(item))) flush();
        group.push(line);
    }
    flush();
    return limitGroups(groups).map((block) => {
        const entry = emptyEntry();
        const [first, ...rest] = block;
        if (BULLET.test(first)) {
            entry.details = block.map((line) => line.replace(BULLET, "")).join("\n");
            return entry;
        }
        const [title, ...metadata] = first.split(/\s*\|\s*/);
        entry.title = title.replace(/^(?:title|role|institution|project):\s*/i, "");
        metadata.filter(Boolean).forEach((text) => addMetadata(entry, text));
        let inDetails = false;
        rest.forEach((line, index) => {
            if (BULLET.test(line) || inDetails) {
                entry.details += `${entry.details ? "\n" : ""}${line.replace(BULLET, "")}`;
                inDetails = true;
            } else if (index === 0 || /^(location|dates?|period|company|organization|degree|technologies):/i.test(line)) {
                line.split(/\s*\|\s*/)
                    .filter(Boolean)
                    .forEach((text) => addMetadata(entry, text));
            } else {
                entry.details += `${entry.details ? "\n" : ""}${line}`;
                inDetails = true;
            }
        });
        return entry;
    });
}

export function parseResumeText(text: string): ResumeImportResult {
    if (new TextEncoder().encode(text).byteLength > MAX_RESUME_FILE_SIZE) throw new Error("This file is too large. Choose a text resume of 2 MB or less.");
    const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    if (!normalized.trim()) throw new Error("This text file is empty. Choose a resume with some text to import.");
    if (/^\s*(%PDF-|PK\u0003\u0004)/.test(normalized))
        throw new Error("PDF/DOCX extraction requires Django. Export your resume as plain text (.txt) instead; renaming the file does not convert it.");
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized))
        throw new Error("This does not look like a plain-text resume. Export a UTF-8 .txt file and try again.");

    const result: ResumeImportResult = {
        contact: { fullName: "", email: "", phone: "", location: "", website: "", linkedin: "" },
        sections: { education: [], experience: [], skills: [], projects: [] },
        warnings: ["Best-effort text extraction: check names, dates, entry boundaries, and bullet points. Formatting and facts are not verified."],
        unparsedLines: [],
    };
    const sectionLines: Record<ResumeSection, string[]> = { education: [], experience: [], skills: [], projects: [] };
    const header: string[] = [];
    let current: ResumeSection | "unparsed" | null = null;
    for (const line of normalized.split("\n")) {
        const key = headingKey(line);
        if (Object.hasOwn(HEADINGS, key)) {
            current = HEADINGS[key];
            sectionLines[current].push("");
        } else if (OTHER_HEADINGS.test(key)) {
            current = "unparsed";
            result.unparsedLines.push(line);
        } else if (current === "unparsed") {
            if (line.trim()) result.unparsedLines.push(line);
        } else if (current) {
            sectionLines[current].push(line);
        } else {
            header.push(line);
        }
    }
    parseContact(header, result.contact, result.unparsedLines);
    RESUME_SECTIONS.forEach((section) => {
        result.sections[section] = parseEntries(sectionLines[section], section, result);
    });
    if (!result.contact.fullName) result.warnings.push("Your name was not detected. Add it in Contact details.");
    if (!result.contact.email) result.warnings.push("No email address was detected. Check your contact details.");
    if (!RESUME_SECTIONS.some((section) => result.sections[section].length))
        result.warnings.push("No supported section headings were found. Add entries manually or place the remaining text into a section.");
    if (result.unparsedLines.length)
        result.warnings.push("Some text could not be placed. Review the remaining text and choose where it belongs, or explicitly leave it out.");
    return result;
}

/** Browser-only adapter. Never sends the file to a service or pretends to parse binary documents. */
export async function importResumeFile(file: File): Promise<ResumeImportResult> {
    if (file.size > MAX_RESUME_FILE_SIZE) throw new Error("This file is too large. Choose a text resume of 2 MB or less.");
    if (/\.(pdf|docx?|odt)$/i.test(file.name) || /pdf|word|officedocument|opendocument/i.test(file.type)) {
        throw new Error(
            "PDF/DOCX extraction requires Django. For now, export your resume as a UTF-8 plain-text (.txt) file and import that. You can also edit your resume manually.",
        );
    }
    if (!/\.txt$/i.test(file.name)) throw new Error("Choose a .txt file. Only plain-text resumes can be imported in this browser version.");
    let text: string;
    try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
    } catch {
        throw new Error("This file could not be read as UTF-8 text. Re-export it as a UTF-8 .txt file and try again.");
    }
    return parseResumeText(text);
}
