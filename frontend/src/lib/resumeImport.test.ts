import { describe, expect, it, vi } from "vitest";
import { importResumeFile, MAX_RESUME_FILE_SIZE, parseResumeText } from "./resumeImport";

const SAMPLE = `Alex Morgan
alex@example.com | +1 (416) 555-0142 | Toronto, ON
alexmorgan.dev | linkedin.com/in/alexmorgan

EDUCATION
University of Toronto | BSc Computer Science | Toronto, ON | 2022 – 2026
- Dean's List
- Relevant coursework: Algorithms, Databases

Professional Experience:
Software Developer Intern | Acme Technologies | Remote | May 2025 – Aug 2025
• Built APIs serving 10,000 requests per day.
• Reduced load times by 32%.

Developer | Example Inc. | Edmonton, AB | 2024 – 2025
- Shipped an accessible dashboard.

Technical Skills
Languages: TypeScript, Python
Tools | Git, Docker

Selected Projects
Campus Connect | React, Node.js, PostgreSQL | 2025
- Connected 200 students with campus events.`;

function file(text: string, name = "resume.txt", type = "text/plain") {
    return new File([text], name, { type });
}

describe("parseResumeText", () => {
    it("extracts contact fields and all four supported sections from actual text", () => {
        const result = parseResumeText(SAMPLE);
        expect(result.contact).toEqual({
            fullName: "Alex Morgan",
            email: "alex@example.com",
            phone: "+1 (416) 555-0142",
            location: "Toronto, ON",
            website: "alexmorgan.dev",
            linkedin: "linkedin.com/in/alexmorgan",
        });
        expect(result.sections.education[0]).toMatchObject({
            title: "University of Toronto",
            subtitle: "BSc Computer Science",
            location: "Toronto, ON",
            period: "2022 – 2026",
            details: "Dean's List\nRelevant coursework: Algorithms, Databases",
            visible: true,
        });
        expect(result.sections.experience).toHaveLength(2);
        expect(result.sections.experience[0]).toMatchObject({
            title: "Software Developer Intern",
            subtitle: "Acme Technologies",
            location: "Remote",
            period: "May 2025 – Aug 2025",
            details: "Built APIs serving 10,000 requests per day.\nReduced load times by 32%.",
        });
        expect(result.sections.skills.map((entry) => [entry.title, entry.details])).toEqual([
            ["Languages", "TypeScript, Python"],
            ["Tools", "Git, Docker"],
        ]);
        expect(result.sections.projects[0]).toMatchObject({
            title: "Campus Connect",
            subtitle: "React, Node.js, PostgreSQL",
            period: "2025",
            details: "Connected 200 students with campus events.",
        });
        expect(result.unparsedLines).toEqual([]);
        expect(result.warnings[0]).toContain("Best-effort");
    });

    it("handles UTF-8 names, a BOM, CRLF, markdown headings, and heading aliases", () => {
        const result = parseResumeText(
            "\uFEFFÉmilie O’Connor\r\nemilie@example.ca\r\n## Academic background:\r\nUniversity of Alberta\r\nBSc Computing Science | 2022 – 2026\r\n\r\n# Skills & Technologies\r\nPython, C++",
        );
        expect(result.contact.fullName).toBe("Émilie O’Connor");
        expect(result.sections.education[0]).toMatchObject({ title: "University of Alberta", subtitle: "BSc Computing Science", period: "2022 – 2026" });
        expect(result.sections.skills[0].details).toBe("Python, C++");
    });

    it("extracts explicit contact labels without filling absent fields with demo data", () => {
        const result = parseResumeText(
            "Full name: Taylor\nLocation: Ottawa\nEmail: taylor@example.com\nPhone: 613-555-0199\nWebsite: https://taylor.dev\nLinkedIn: https://linkedin.com/in/taylor\nEducation\nExample University",
        );
        expect(result.contact).toEqual({
            fullName: "Taylor",
            location: "Ottawa",
            email: "taylor@example.com",
            phone: "613-555-0199",
            website: "https://taylor.dev",
            linkedin: "https://linkedin.com/in/taylor",
        });
        const minimal = parseResumeText("Skills\nPython");
        expect(Object.values(minimal.contact).every((value) => value === "")).toBe(true);
        expect(minimal.sections.education).toEqual([]);
        expect(minimal.warnings.join(" ")).toContain("name was not detected");
    });

    it("supports explicit entry metadata and preserves achievement lines", () => {
        const result = parseResumeText(
            "Experience\nRole: Software Engineer\nCompany: Acme\nLocation: Remote\nDates: Jan 2024 – Present\n1. Built accessible components.\n2. Wrote integration tests.",
        );
        expect(result.sections.experience[0]).toMatchObject({
            title: "Software Engineer",
            subtitle: "Acme",
            location: "Remote",
            period: "Jan 2024 – Present",
            details: "Built accessible components.\nWrote integration tests.",
        });
    });

    it("does not mistake a comma-separated technology pair for a location", () => {
        const result = parseResumeText("Projects\nPortfolio | React, TypeScript | 2025\n- Built an accessible portfolio.");
        expect(result.sections.projects[0]).toMatchObject({ subtitle: "React, TypeScript", location: "", period: "2025" });
    });

    it("recognizes a new pipe-delimited entry after bullets without a blank line", () => {
        const result = parseResumeText("Projects\nFirst | React | 2024\n- Built one tool.\nSecond | Python | 2025\n- Built another tool.");
        expect(result.sections.projects.map((entry) => entry.title)).toEqual(["First", "Second"]);
    });

    it("keeps repeated supported sections instead of overwriting them", () => {
        const result = parseResumeText("Education\nFirst School\n\nEducation\nSecond School");
        expect(result.sections.education.map((entry) => entry.title)).toEqual(["First School", "Second School"]);
    });

    it("preserves unrecognized text and unsupported sections for an explicit review", () => {
        const result = parseResumeText(
            "Alex Morgan\nSoftware engineer with 5 years of experience.\nSummary\nI build useful tools.\nEducation\nExample University\nAwards\nCommunity Builder Award\nProjects\nA useful tool",
        );
        expect(result.unparsedLines).toEqual(
            expect.arrayContaining(["Software engineer with 5 years of experience.", "Summary", "I build useful tools.", "Awards", "Community Builder Award"]),
        );
        expect(result.sections.education[0].details).not.toContain("Award");
        expect(result.sections.projects[0].title).toBe("A useful tool");
        expect(result.warnings.join(" ")).toContain("Some text could not be placed");
    });

    it("does not fabricate structured entries when no headings exist", () => {
        const result = parseResumeText("I built 3 applications using React and worked at a local startup.");
        expect(Object.values(result.sections).flat()).toEqual([]);
        expect(result.unparsedLines).toEqual(["I built 3 applications using React and worked at a local startup."]);
        expect(result.warnings.join(" ")).toContain("No supported section headings");
    });

    it("keeps duplicate labeled contact fields for review", () => {
        const result = parseResumeText("Name: Alex Morgan\nEmail: first@example.com\nEmail: second@example.com");
        expect(result.contact.email).toBe("first@example.com");
        expect(result.unparsedLines).toContain("Email: second@example.com");
    });

    it("preserves an additional unlabeled email instead of treating its domain as a website", () => {
        const result = parseResumeText("Alex Morgan\nfirst@example.com\nsecond@other.com");
        expect(result.contact.email).toBe("first@example.com");
        expect(result.contact.website).toBe("");
        expect(result.unparsedLines).toContain("second@other.com");
    });

    it("treats prototype property names as text, not parser keys", () => {
        const result = parseResumeText("constructor: Example\n__proto__\ntoString\nSkills\nJavaScript");
        expect(result.unparsedLines).toContain("constructor: Example");
        expect(result.unparsedLines).toContain("__proto__");
        expect(Object.keys(result.contact)).toHaveLength(6);
        expect(result.sections.skills).toHaveLength(1);
    });

    it("creates distinct editable entry IDs on each import", () => {
        const first = Object.values(parseResumeText(SAMPLE).sections).flat();
        const second = Object.values(parseResumeText(SAMPLE).sections).flat();
        expect(new Set([...first, ...second].map((entry) => entry.id)).size).toBe(first.length + second.length);
        expect([...first, ...second].every((entry) => entry.visible)).toBe(true);
    });

    it("leaves bullet-only content editable without inventing a job or school title", () => {
        const result = parseResumeText("Experience\n- Delivered a useful feature.\n- Wrote its documentation.");
        expect(result.sections.experience[0]).toMatchObject({ title: "", subtitle: "", details: "Delivered a useful feature.\nWrote its documentation." });
    });

    it("caps structured entries and preserves excess content for review", () => {
        const result = parseResumeText(`Skills\n${Array.from({ length: 105 }, (_, index) => `Group ${index}: Tool ${index}`).join("\n")}`);
        expect(result.sections.skills).toHaveLength(100);
        expect(result.unparsedLines).toContain("Group 104: Tool 104");
        expect(result.warnings.join(" ")).toContain("keep the editor responsive");
    });

    it.each(["", " \n\t ", "\uFEFF\r\n"])("rejects empty or whitespace-only text", (text) => {
        expect(() => parseResumeText(text)).toThrow("empty");
    });

    it.each(["%PDF-1.7\nNot plain text", "PK\u0003\u0004binary document"])("rejects binary documents renamed as text", (text) => {
        expect(() => parseResumeText(text)).toThrow("PDF/DOCX extraction requires Django");
    });

    it("rejects binary control characters", () => {
        expect(() => parseResumeText("Alex\u0000Morgan")).toThrow("plain-text resume");
    });

    it("enforces the limit in bytes, including multibyte text", () => {
        expect(() => parseResumeText("a".repeat(MAX_RESUME_FILE_SIZE + 1))).toThrow("2 MB");
        expect(() => parseResumeText("é".repeat(MAX_RESUME_FILE_SIZE / 2 + 1))).toThrow("2 MB");
    });

    it("accepts the exact size boundary without scanning a huge paragraph as contact data", () => {
        const text = "a".repeat(MAX_RESUME_FILE_SIZE);
        expect(parseResumeText(text).unparsedLines).toEqual([text]);
    });
});

describe("importResumeFile", () => {
    it("reads the supplied UTF-8 file, case-insensitively, without network requests", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch");
        try {
            const result = await importResumeFile(file(SAMPLE, "MY-RESUME.TXT"));
            expect(result.contact.fullName).toBe("Alex Morgan");
            expect(result.sections.experience[0].subtitle).toBe("Acme Technologies");
            expect(fetchSpy).not.toHaveBeenCalled();
        } finally {
            fetchSpy.mockRestore();
        }
    });

    it.each(["resume.pdf", "resume.PDF", "resume.doc", "resume.docx", "resume.odt"])("honestly rejects unsupported document %s", async (name) => {
        await expect(importResumeFile(file(SAMPLE, name))).rejects.toThrow("PDF/DOCX extraction requires Django");
    });

    it.each(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"])(
        "checks unsupported MIME type %s even when the extension is .txt",
        async (type) => {
            await expect(importResumeFile(file(SAMPLE, "resume.txt", type))).rejects.toThrow("PDF/DOCX extraction requires Django");
        },
    );

    it.each(["resume.png", "resume.md", "resume", "resume.txt.exe"])("rejects unsupported extension %s", async (name) => {
        await expect(importResumeFile(file(SAMPLE, name))).rejects.toThrow("Choose a .txt file");
    });

    it("rejects an oversized file before reading it", async () => {
        const oversized = file("a".repeat(MAX_RESUME_FILE_SIZE + 1));
        const readSpy = vi.spyOn(oversized, "arrayBuffer");
        await expect(importResumeFile(oversized)).rejects.toThrow("2 MB");
        expect(readSpy).not.toHaveBeenCalled();
    });

    it("rejects invalid UTF-8 instead of silently replacing characters", async () => {
        const invalid = new File([new Uint8Array([0xc3, 0x28])], "resume.txt");
        await expect(importResumeFile(invalid)).rejects.toThrow("UTF-8");
    });

    it("reports file read failures helpfully", async () => {
        const unreadable = file(SAMPLE);
        vi.spyOn(unreadable, "arrayBuffer").mockRejectedValue(new Error("read failure"));
        await expect(importResumeFile(unreadable)).rejects.toThrow("could not be read");
    });
});
