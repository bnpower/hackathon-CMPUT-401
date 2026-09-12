import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    Check,
    CheckCircle2,
    ChevronRight,
    Eye,
    EyeOff,
    FileText,
    GraduationCap,
    Info,
    Layers3,
    LockKeyhole,
    Pencil,
    Plus,
    Printer,
    Save,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    Upload,
    X,
} from "lucide-react";
import { CompanyLogo, EmptyState, Modal } from "../components/UI";
import { importResumeFile, RESUME_IMPORT_LIMITATIONS, type ResumeImportResult } from "../lib/resumeImport";
import { useApp } from "../store";
import { RESUME_SECTIONS, type Contact, type Job, type Resume, type ResumeEntry, type ResumeSection } from "../types";
import "./resumes.css";

export interface ResumesProps {
    selectedResumeId?: string | null;
    onSelectResume: (id: string | null) => void;
    onApplyCustom?: (jobId: string, resumeId: string) => void;
}

type ImportReview = { fileName: string; result: ResumeImportResult };
type StagedResume = { resume: Resume; review?: ImportReview };
const SECTION_META = {
    education: {
        title: "Education",
        singular: "education",
        icon: GraduationCap,
        titleLabel: "School or university",
        subtitleLabel: "Degree / program",
        hint: "Your education, qualifications, and academic highlights.",
        detailsLabel: "Highlights",
        placeholder: "Relevant coursework, honors, or academic achievements",
    },
    experience: {
        title: "Experience",
        singular: "experience",
        icon: BriefcaseBusiness,
        titleLabel: "Job title",
        subtitleLabel: "Company / organization",
        hint: "Show what you did, how you did it, and the impact you made.",
        detailsLabel: "Achievements",
        placeholder: "Built a feature that helped…\nImproved a process by…",
    },
    skills: {
        title: "Skills",
        singular: "skill group",
        icon: Layers3,
        titleLabel: "Skill group",
        subtitleLabel: "Additional context",
        hint: "Group relevant skills so they are easy to scan.",
        detailsLabel: "Skills in this group",
        placeholder: "TypeScript, React, Python, PostgreSQL",
    },
    projects: {
        title: "Projects",
        singular: "project",
        icon: FileText,
        titleLabel: "Project name",
        subtitleLabel: "Technologies / role",
        hint: "A little proof of what you can build.",
        detailsLabel: "Project highlights",
        placeholder: "What you built, the problem it solved, and the result",
    },
};
const CONTACT_FIELDS: { key: keyof Contact; label: string; type?: string; placeholder: string; autoComplete: string }[] = [
    { key: "fullName", label: "Full name", placeholder: "Alex Morgan", autoComplete: "name" },
    { key: "email", label: "Email address", type: "email", placeholder: "alex@example.com", autoComplete: "email" },
    { key: "phone", label: "Phone number", type: "tel", placeholder: "+1 (416) 555-0142", autoComplete: "tel" },
    { key: "location", label: "Location", placeholder: "Toronto, ON", autoComplete: "address-level2" },
    { key: "website", label: "Website / portfolio", placeholder: "yourportfolio.dev", autoComplete: "url" },
    { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/yourname", autoComplete: "off" },
];

function cloneResume(resume: Resume): Resume {
    return structuredClone(resume);
}
function newEntry(): ResumeEntry {
    return { id: crypto.randomUUID(), title: "", subtitle: "", location: "", period: "", details: "", visible: true };
}
function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Not saved yet"
        : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}
function visibleCount(resume: Resume) {
    return RESUME_SECTIONS.reduce((total, section) => total + resume.sections[section].filter((entry) => entry.visible).length, 0);
}
function hasContent(entry: ResumeEntry) {
    return [entry.title, entry.subtitle, entry.location, entry.period, entry.details].some((value) => value.trim());
}
function detailLines(details: string) {
    return details
        .split("\n")
        .map((line) => line.replace(/^\s*(?:[-*•▪◦]|\d+[.)])\s+/, "").trim())
        .filter(Boolean);
}

/** This is the only element retained by the page's print stylesheet. */
export function ResumePreview({ resume }: { resume: Resume }) {
    const sections = RESUME_SECTIONS.map((section) => ({
        section,
        entries: resume.sections[section].filter((entry) => entry.visible && hasContent(entry)),
    })).filter((section) => section.entries.length);
    const contact = [resume.contact.location, resume.contact.phone, resume.contact.email, resume.contact.website, resume.contact.linkedin].filter((value) =>
        value.trim(),
    );
    return (
        <article className="resume-print-preview" aria-label="Live resume preview">
            <header className="resume-paper-header">
                <h2>{resume.contact.fullName.trim() || <span className="resume-preview-placeholder">Your name</span>}</h2>
                {contact.length > 0 && (
                    <p className="resume-paper-contact">
                        {contact.map((value, index) => (
                            <span key={index}>{value}</span>
                        ))}
                    </p>
                )}
            </header>
            {sections.map(({ section, entries }) => (
                <section className="resume-paper-section" key={section}>
                    <h3>{SECTION_META[section].title}</h3>
                    {entries.map((entry) => (
                        <div className={`resume-paper-entry${section === "skills" ? " resume-paper-skill" : ""}`} key={entry.id}>
                            {section === "skills" ? (
                                <>
                                    {entry.title && (
                                        <strong>
                                            {entry.title}
                                            {entry.details ? ": " : ""}
                                        </strong>
                                    )}
                                    <span>{detailLines(entry.details).join("; ")}</span>
                                    {[entry.subtitle, entry.location, entry.period].filter(Boolean).length > 0 && (
                                        <p>{[entry.subtitle, entry.location, entry.period].filter(Boolean).join(" · ")}</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    {(entry.title || entry.location) && (
                                        <div className="resume-paper-line">
                                            <strong>{entry.title}</strong>
                                            <span>{entry.location}</span>
                                        </div>
                                    )}
                                    {(entry.subtitle || entry.period) && (
                                        <div className="resume-paper-line resume-paper-subtitle">
                                            <em>{entry.subtitle}</em>
                                            <span>{entry.period}</span>
                                        </div>
                                    )}
                                    {detailLines(entry.details).length > 0 && (
                                        <ul>
                                            {detailLines(entry.details).map((line, index) => (
                                                <li key={index}>{line}</li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </section>
            ))}
            {!sections.length && (
                <p className="resume-preview-placeholder resume-paper-empty">Your story starts here. Add an entry on the left to see your resume take shape.</p>
            )}
        </article>
    );
}

function MiniResume({ resume }: { resume: Resume }) {
    return (
        <div className="resume-mini-paper" aria-hidden="true">
            <strong>{resume.contact.fullName || "Your name"}</strong>
            <span>{resume.contact.email || "Your next chapter"}</span>
            {RESUME_SECTIONS.filter((section) => resume.sections[section].some((entry) => entry.visible))
                .slice(0, 3)
                .map((section) => (
                    <div key={section}>
                        <b>{SECTION_META[section].title}</b>
                        <i />
                        <i />
                        <i />
                    </div>
                ))}
        </div>
    );
}

function ResumeEditor({
    resume,
    persistedResume,
    review: initialReview,
    onBack,
    onSaved,
    onApplyCustom,
}: {
    resume: Resume;
    persistedResume?: Resume;
    review?: ImportReview;
    onBack: () => void;
    onSaved: () => void;
    onApplyCustom?: ResumesProps["onApplyCustom"];
}) {
    const { state, saveResume } = useApp();
    const [draft, setDraft] = useState(() => cloneResume(resume));
    const [savedSnapshot, setSavedSnapshot] = useState(() => (persistedResume ? JSON.stringify(persistedResume) : ""));
    const [review, setReview] = useState(initialReview);
    const [remainingText, setRemainingText] = useState(initialReview?.result.unparsedLines.join("\n") ?? "");
    const [needsTextReview, setNeedsTextReview] = useState(!!initialReview?.result.unparsedLines.length);
    const applyAfterSave = useRef<{ jobId: string; resumeId: string } | null>(null);
    const [notesSection, setNotesSection] = useState<ResumeSection>("experience");
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveStatus, setSaveStatus] = useState("");
    const formId = useId();

    const dirty = JSON.stringify(draft) !== savedSnapshot || !!review;
    const isMaster = draft.id === "master";
    const job = state.jobs.find((job) => job.id === draft.jobId);
    const usedByApplications = state.applications.filter((application) => application.resumeId === draft.id).length;

    useEffect(() => {
        document.body.classList.add("resume-print-mode");
        return () => document.body.classList.remove("resume-print-mode");
    }, []);
    useEffect(() => {
        if (!dirty) return;
        const protectDraft = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        const protectRouteNavigation = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
            if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
            const destination = new URL(link.href, window.location.href);
            // Only intercept same-document app routes; ordinary page exits use beforeunload.
            if (
                destination.origin !== window.location.origin ||
                destination.pathname !== window.location.pathname ||
                destination.search !== window.location.search ||
                destination.hash === window.location.hash ||
                !/^#(?:discover|tracker|resumes|settings|job)(?:\/|$)/.test(destination.hash)
            )
                return;
            if (!window.confirm("You have unsaved resume changes. Leave this editor and discard them?")) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        };
        window.addEventListener("beforeunload", protectDraft);
        document.addEventListener("click", protectRouteNavigation, true);
        return () => {
            window.removeEventListener("beforeunload", protectDraft);
            document.removeEventListener("click", protectRouteNavigation, true);
        };
    }, [dirty]);

    useEffect(() => {
        const request = applyAfterSave.current;
        if (!request || !onApplyCustom || !state.resumes.some((item) => item.id === request.resumeId)) return;
        // Wait for context to commit so the parent's confirmation can read the saved version.
        applyAfterSave.current = null;
        onApplyCustom(request.jobId, request.resumeId);
    }, [state.resumes, onApplyCustom]);

    function changeDraft(update: (current: Resume) => Resume) {
        setDraft(update);
        setSaveStatus("");
        setSaveError("");
    }
    function updateEntry(section: ResumeSection, id: string, patch: Partial<ResumeEntry>) {
        changeDraft((current) => ({
            ...current,
            sections: { ...current.sections, [section]: current.sections[section].map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) },
        }));
    }
    function addEntry(section: ResumeSection, details = "") {
        const entry = { ...newEntry(), details };
        changeDraft((current) => ({ ...current, sections: { ...current.sections, [section]: [...current.sections[section], entry] } }));
        requestAnimationFrame(() => document.getElementById(`resume-entry-${entry.id}-title`)?.focus());
    }
    function removeEntry(section: ResumeSection, id: string) {
        changeDraft((current) => ({ ...current, sections: { ...current.sections, [section]: current.sections[section].filter((entry) => entry.id !== id) } }));
    }
    function leave() {
        if (dirty) setConfirmLeave(true);
        else onBack();
    }
    function scrollToEditorElement(id: string) {
        const target = document.getElementById(id);
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ block: "start" });
    }
    function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!draft.name.trim() || !draft.contact.fullName.trim()) {
            setSaveError("Add a resume name and your full name before saving.");
            document.getElementById(!draft.name.trim() ? "resume-document-name" : "resume-contact-fullName")?.focus();
            return;
        }
        if (needsTextReview) {
            setSaveError("Place the remaining imported text into a section, or choose “Leave out of resume”, before saving.");
            document.getElementById("resume-import-remaining")?.focus();
            return;
        }
        const saved = cloneResume(draft);
        saved.name = saved.name.trim();
        saved.contact.fullName = saved.contact.fullName.trim();
        saved.updatedAt = new Date().toISOString();
        // Persist the independent draft before asking the parent to open its application confirmation.
        saveResume(saved);
        setDraft(cloneResume(saved));
        setSavedSnapshot(JSON.stringify(saved));
        setReview(undefined);
        setSaveError("");
        setSaveStatus("All changes saved.");
        onSaved();
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        if (submitter?.getAttribute("value") === "apply" && !isMaster && job && onApplyCustom) {
            applyAfterSave.current = { jobId: job.id, resumeId: saved.id };
        }
    }

    return (
        <div className="resumes-page resume-editor-page">
            <div className="resume-editor-topline">
                <button className="btn btn-ghost resume-back" type="button" onClick={leave}>
                    <ArrowLeft size={17} aria-hidden="true" /> Resume library
                </button>
                <span className={`resume-save-state${dirty ? " is-unsaved" : ""}`} role="status">
                    {dirty ? (
                        <>
                            <span className="resume-status-dot" /> Unsaved changes
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={15} aria-hidden="true" /> All changes saved
                        </>
                    )}
                </span>
            </div>
            <header className="page-heading resume-editor-heading">
                <div>
                    <p className="eyebrow">{review ? "IMPORT REVIEW" : isMaster ? "YOUR FOUNDATION" : "MADE FOR THIS OPPORTUNITY"}</p>
                    <h1>{review ? "Make it yours." : isMaster ? "Your story. Beautifully told." : "A little more you. A perfect fit."}</h1>
                    <p className="muted">
                        {isMaster
                            ? "Build your foundation. Tailored copies stay independent of this resume."
                            : "Highlight what matters for this role. Your master resume stays untouched."}
                    </p>
                </div>
                <div className="resume-heading-actions">
                    <button className="btn btn-ghost resume-mobile-preview-link" type="button" onClick={() => scrollToEditorElement("resume-live-preview")}>
                        <Eye size={17} aria-hidden="true" /> Preview
                    </button>
                    <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => window.print()}
                        title="Print this draft or save it as a PDF. Printing does not save changes."
                    >
                        <Printer size={17} aria-hidden="true" /> Print / PDF
                    </button>
                    <button className="btn btn-primary" type="submit" form={formId}>
                        <Save size={17} aria-hidden="true" /> Save changes
                    </button>
                </div>
            </header>
            {saveError && (
                <p className="resume-error resume-editor-error" role="alert">
                    {saveError}
                </p>
            )}
            {!isMaster && (
                <div className="resume-job-context panel">
                    {job ? (
                        <>
                            <CompanyLogo job={job} size="sm" />
                            <div>
                                <strong>{job.position}</strong>
                                <span>
                                    {job.company} <span aria-hidden="true">·</span> {job.location}
                                </span>
                            </div>
                            <span className="badge">Tailored resume</span>
                        </>
                    ) : (
                        <>
                            <BriefcaseBusiness size={22} aria-hidden="true" />
                            <div>
                                <strong>Custom resume</strong>
                                <span>The linked job is no longer available. You can still edit and save this resume.</span>
                            </div>
                        </>
                    )}
                </div>
            )}
            <form id={formId} className="resume-workspace" onSubmit={handleSave}>
                <div className="resume-edit-column">
                    {review && (
                        <section className="resume-import-review panel" aria-labelledby="resume-import-review-title">
                            <div className="resume-section-title">
                                <span className="resume-section-icon">
                                    <Upload size={18} aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="resume-import-review-title">Review your import</h2>
                                    <p className="muted resume-file-name">{review.fileName} · Nothing saved yet</p>
                                </div>
                            </div>
                            <p>
                                We used simple text rules to get you started. Every field below is editable.{" "}
                                {isMaster
                                    ? "Saving will replace your master resume’s content, not its tailored copies."
                                    : "Saving creates a separate resume for this job."}
                            </p>
                            <details className="resume-import-notes" open={needsTextReview}>
                                <summary>
                                    Extraction notes <ChevronRight size={15} aria-hidden="true" />
                                </summary>
                                <ul>
                                    {review.result.warnings.map((warning) => (
                                        <li key={warning}>{warning}</li>
                                    ))}
                                </ul>
                            </details>
                            {needsTextReview && (
                                <div className="resume-unplaced-text">
                                    <label className="field" htmlFor="resume-import-remaining">
                                        <span>Text that needs a home</span>
                                        <textarea
                                            id="resume-import-remaining"
                                            className="input"
                                            rows={6}
                                            value={remainingText}
                                            onChange={(event) => setRemainingText(event.target.value)}
                                            aria-describedby="resume-unplaced-hint"
                                        />
                                    </label>
                                    <p className="muted" id="resume-unplaced-hint">
                                        Place this text in an entry, or explicitly leave it out. Import notes are not included in your saved resume.
                                    </p>
                                    <div className="resume-notes-actions">
                                        <label className="field" htmlFor="resume-notes-section">
                                            <span>Add to section</span>
                                            <select
                                                id="resume-notes-section"
                                                className="input"
                                                value={notesSection}
                                                onChange={(event) => setNotesSection(event.target.value as ResumeSection)}
                                            >
                                                {RESUME_SECTIONS.map((section) => (
                                                    <option value={section} key={section}>
                                                        {SECTION_META[section].title}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <button
                                            className="btn btn-secondary"
                                            type="button"
                                            disabled={!remainingText.trim()}
                                            onClick={() => {
                                                addEntry(notesSection, remainingText.trim());
                                                setRemainingText("");
                                                setNeedsTextReview(false);
                                            }}
                                        >
                                            <Plus size={16} aria-hidden="true" /> Add as entry
                                        </button>
                                        <button
                                            className="btn btn-ghost"
                                            type="button"
                                            onClick={() => {
                                                setRemainingText("");
                                                setNeedsTextReview(false);
                                                setSaveError("");
                                            }}
                                        >
                                            Leave out of resume
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                    <section className="resume-contact-panel panel" aria-labelledby="resume-contact-title">
                        <label className="field resume-document-name" htmlFor="resume-document-name">
                            <span>
                                Resume name <span aria-hidden="true">*</span>
                            </span>
                            <input
                                id="resume-document-name"
                                className="input"
                                value={draft.name}
                                required
                                maxLength={160}
                                onChange={(event) => changeDraft((current) => ({ ...current, name: event.target.value }))}
                            />
                            <small className="muted">Only for your library. This name does not appear on your resume.</small>
                        </label>
                        <div className="resume-section-title">
                            <span className="resume-section-icon">
                                <FileText size={19} aria-hidden="true" />
                            </span>
                            <div>
                                <h2 id="resume-contact-title">Contact details</h2>
                                <p className="muted">Make it easy to reach you. * Required fields.</p>
                            </div>
                        </div>
                        <div className="resume-fields-grid">
                            {CONTACT_FIELDS.map((field) => (
                                <label className="field" key={field.key} htmlFor={`resume-contact-${field.key}`}>
                                    <span>
                                        {field.label}
                                        {field.key === "fullName" && <span aria-hidden="true"> *</span>}
                                    </span>
                                    <input
                                        id={`resume-contact-${field.key}`}
                                        className="input"
                                        type={field.type ?? "text"}
                                        autoComplete={field.autoComplete}
                                        placeholder={field.placeholder}
                                        value={draft.contact[field.key]}
                                        required={field.key === "fullName"}
                                        onChange={(event) =>
                                            changeDraft((current) => ({ ...current, contact: { ...current.contact, [field.key]: event.target.value } }))
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                    </section>
                    <nav className="resume-section-nav" aria-label="Resume sections">
                        {RESUME_SECTIONS.map((section) => (
                            <button
                                className="btn btn-secondary"
                                type="button"
                                key={section}
                                onClick={() => scrollToEditorElement(`resume-section-${section}`)}
                            >
                                {SECTION_META[section].title}
                                <span className="muted">{draft.sections[section].length}</span>
                            </button>
                        ))}
                    </nav>
                    {RESUME_SECTIONS.map((section) => {
                        const meta = SECTION_META[section];
                        const Icon = meta.icon;
                        return (
                            <section
                                className="resume-section-panel panel"
                                id={`resume-section-${section}`}
                                tabIndex={-1}
                                key={section}
                                aria-labelledby={`resume-section-heading-${section}`}
                            >
                                <div className="resume-section-heading">
                                    <div className="resume-section-title">
                                        <span className="resume-section-icon">
                                            <Icon size={19} aria-hidden="true" />
                                        </span>
                                        <div>
                                            <h2 id={`resume-section-heading-${section}`}>{meta.title}</h2>
                                            <p className="muted">{meta.hint}</p>
                                        </div>
                                    </div>
                                    <span className="resume-entry-count">
                                        {draft.sections[section].filter((entry) => entry.visible).length}/{draft.sections[section].length} shown
                                    </span>
                                </div>
                                <div className="resume-entries">
                                    {draft.sections[section].map((entry, index) => (
                                        <article
                                            className={`resume-entry${entry.visible ? "" : " is-hidden"}`}
                                            key={entry.id}
                                            aria-label={`${meta.singular} entry ${index + 1}`}
                                        >
                                            <div className="resume-entry-toolbar">
                                                <div>
                                                    <span className="resume-entry-number">{String(index + 1).padStart(2, "0")}</span>
                                                    <strong>{entry.title || `New ${meta.singular}`}</strong>
                                                </div>
                                                <div className="resume-entry-actions">
                                                    <button
                                                        className="resume-visibility-button"
                                                        type="button"
                                                        aria-pressed={entry.visible}
                                                        aria-label={`Show ${entry.title || `${meta.singular} ${index + 1}`} in preview`}
                                                        title={entry.visible ? "Hide from preview without deleting" : "Show in preview"}
                                                        onClick={() => updateEntry(section, entry.id, { visible: !entry.visible })}
                                                    >
                                                        {entry.visible ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
                                                        <span>{entry.visible ? "Shown" : "Hidden"}</span>
                                                    </button>
                                                    <button
                                                        className="icon-button resume-danger-button"
                                                        type="button"
                                                        aria-label={`Remove ${entry.title || `${meta.singular} ${index + 1}`}`}
                                                        title="Remove entry from this draft"
                                                        onClick={() => removeEntry(section, entry.id)}
                                                    >
                                                        <Trash2 size={16} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                            {!entry.visible && <p className="resume-hidden-note">Kept in your resume, left out of the preview and print.</p>}
                                            <div className="resume-fields-grid">
                                                <label
                                                    className={`field${section === "skills" ? " resume-full-field" : ""}`}
                                                    htmlFor={`resume-entry-${entry.id}-title`}
                                                >
                                                    <span>{meta.titleLabel}</span>
                                                    <input
                                                        className="input"
                                                        id={`resume-entry-${entry.id}-title`}
                                                        value={entry.title}
                                                        onChange={(event) => updateEntry(section, entry.id, { title: event.target.value })}
                                                    />
                                                </label>
                                                {(section !== "skills" || entry.subtitle || entry.location || entry.period) && (
                                                    <>
                                                        <label className="field" htmlFor={`resume-entry-${entry.id}-subtitle`}>
                                                            <span>{meta.subtitleLabel}</span>
                                                            <input
                                                                className="input"
                                                                id={`resume-entry-${entry.id}-subtitle`}
                                                                value={entry.subtitle}
                                                                onChange={(event) => updateEntry(section, entry.id, { subtitle: event.target.value })}
                                                            />
                                                        </label>
                                                        <label className="field" htmlFor={`resume-entry-${entry.id}-location`}>
                                                            <span>Location</span>
                                                            <input
                                                                className="input"
                                                                id={`resume-entry-${entry.id}-location`}
                                                                placeholder="Toronto, ON / Remote"
                                                                value={entry.location}
                                                                onChange={(event) => updateEntry(section, entry.id, { location: event.target.value })}
                                                            />
                                                        </label>
                                                        <label className="field" htmlFor={`resume-entry-${entry.id}-period`}>
                                                            <span>Dates</span>
                                                            <input
                                                                className="input"
                                                                id={`resume-entry-${entry.id}-period`}
                                                                placeholder="Sep 2024 – Present"
                                                                value={entry.period}
                                                                onChange={(event) => updateEntry(section, entry.id, { period: event.target.value })}
                                                            />
                                                        </label>
                                                    </>
                                                )}
                                                <label className="field resume-full-field" htmlFor={`resume-entry-${entry.id}-details`}>
                                                    <span>{meta.detailsLabel}</span>
                                                    <textarea
                                                        className="input"
                                                        id={`resume-entry-${entry.id}-details`}
                                                        rows={section === "skills" ? 3 : 4}
                                                        placeholder={meta.placeholder}
                                                        value={entry.details}
                                                        onChange={(event) => updateEntry(section, entry.id, { details: event.target.value })}
                                                        aria-describedby={`resume-entry-${entry.id}-hint`}
                                                    />
                                                    <small className="muted" id={`resume-entry-${entry.id}-hint`}>
                                                        {section === "skills"
                                                            ? "Separate skills with commas."
                                                            : "One achievement per line. We’ll take care of the bullets."}
                                                    </small>
                                                </label>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                                {!draft.sections[section].length && (
                                    <p className="resume-section-empty">A blank page, a fresh start. Add your first {meta.singular}.</p>
                                )}
                                <button className="resume-add-entry" type="button" onClick={() => addEntry(section)}>
                                    <Plus size={17} aria-hidden="true" /> Add {meta.singular}
                                </button>
                            </section>
                        );
                    })}
                    {usedByApplications > 0 && (
                        <p className="resume-application-note">
                            <LockKeyhole size={15} aria-hidden="true" /> Used by {usedByApplications}{" "}
                            {usedByApplications === 1 ? "application" : "applications"}. This resume can be edited, but not deleted.
                        </p>
                    )}
                </div>
                <aside className="resume-preview-column" id="resume-live-preview" tabIndex={-1} aria-label="Preview and formatting">
                    <div className="resume-preview-toolbar">
                        <div>
                            <Eye size={17} aria-hidden="true" />
                            <strong>Live preview</strong>
                        </div>
                        <span className="badge">Harvard · Classic</span>
                    </div>
                    <div className="resume-paper-stage">
                        <ResumePreview resume={draft} />
                    </div>
                    <p className="resume-preview-caption">
                        <ShieldCheck size={15} aria-hidden="true" /> Clean typography. No distractions. Just your story.
                    </p>
                    <p className="resume-print-tip">
                        Preview includes unsaved edits. Print / PDF opens your browser’s print dialog; choose “Save as PDF” and turn off browser headers and
                        footers for a clean copy. Longer resumes flow onto additional pages.
                    </p>
                    <button className="btn btn-ghost resume-mobile-preview-link" type="button" onClick={() => scrollToEditorElement("resume-document-name")}>
                        <ArrowLeft size={15} aria-hidden="true" /> Back to editing
                    </button>
                </aside>
            </form>
            <footer className="resume-editor-footer panel">
                <div>
                    <strong>{dirty ? "Looking good? Make it official." : "Ready for your next chapter."}</strong>
                    <p className="muted">
                        {!isMaster && job && onApplyCustom
                            ? "Save & apply opens a confirmation. Nothing is sent yet."
                            : "Your changes stay in this draft until you save."}
                    </p>

                    <span className="resume-sr-only" role="status">
                        {saveStatus}
                    </span>
                </div>
                <div className="resume-heading-actions">
                    <button className="btn btn-ghost" type="button" onClick={leave}>
                        Back to library
                    </button>
                    <button className={`btn ${!isMaster && job && onApplyCustom ? "btn-secondary" : "btn-primary"}`} type="submit" form={formId}>
                        <Save size={16} aria-hidden="true" /> Save changes
                    </button>
                    {!isMaster && job && onApplyCustom && (
                        <button className="btn btn-primary" type="submit" form={formId} value="apply">
                            Save & apply <ArrowRight size={17} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </footer>
            {confirmLeave && (
                <Modal title="Leave your draft?" onClose={() => setConfirmLeave(false)}>
                    <div className="resume-modal-content">
                        <p>
                            You have unsaved changes to <strong>{draft.name || "this resume"}</strong>. Returning to the library will discard them. Your last
                            saved resume will stay as it was.
                        </p>
                        <div className="resume-modal-actions">
                            <button className="btn btn-secondary" type="button" onClick={() => setConfirmLeave(false)}>
                                Keep editing
                            </button>
                            <button className="btn btn-primary" type="button" onClick={onBack}>
                                Discard changes
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function JobPicker({ jobs, selected, onChange, id }: { jobs: Job[]; selected: string; onChange: (id: string) => void; id: string }) {
    return (
        <label className="field" htmlFor={id}>
            <span>Tailor for a job</span>
            <select className="input" id={id} value={selected} required onChange={(event) => onChange(event.target.value)}>
                <option value="" disabled>
                    Choose an opportunity
                </option>
                {jobs.map((job) => (
                    <option value={job.id} key={job.id}>
                        {job.company} · {job.position}
                    </option>
                ))}
            </select>
        </label>
    );
}

function ImportModal({
    master,
    jobs,
    onClose,
    onReview,
}: {
    master?: Resume;
    jobs: Job[];
    onClose: () => void;
    onReview: (resume: Resume, review: ImportReview) => void;
}) {
    const [destination, setDestination] = useState<"master" | "custom">(master ? "master" : "custom");
    const [jobId, setJobId] = useState("");
    const [fileName, setFileName] = useState("");
    const [result, setResult] = useState<ResumeImportResult | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const requestId = useRef(0);
    useEffect(
        () => () => {
            requestId.current += 1;
        },
        [],
    );

    async function readFile(file?: File) {
        if (!file) return;
        const request = ++requestId.current;
        setError("");
        setResult(null);
        setFileName(file.name);
        setBusy(true);
        try {
            const extracted = await importResumeFile(file);
            if (request === requestId.current) setResult(extracted);
        } catch (error) {
            if (request === requestId.current) setError(error instanceof Error ? error.message : "We could not read that file. Try a UTF-8 .txt resume.");
        } finally {
            if (request === requestId.current) setBusy(false);
        }
    }
    function selectFile(event: ChangeEvent<HTMLInputElement>) {
        void readFile(event.target.files?.[0]);
        event.target.value = "";
    }
    function startReview(event: FormEvent) {
        event.preventDefault();
        if (!result) return;
        const job = jobs.find((job) => job.id === jobId);
        if (destination === "custom" && !job) {
            setError("Choose a job for this tailored resume.");
            return;
        }
        if (destination === "master" && !master) {
            setError("The master resume is not available. Choose a job instead.");
            return;
        }
        const resume: Resume = {
            id: destination === "master" ? "master" : crypto.randomUUID(),
            name: destination === "master" ? master!.name : `${job!.company} · ${job!.position}`,
            jobId: destination === "master" ? null : job!.id,
            updatedAt: new Date().toISOString(),
            contact: structuredClone(result.contact),
            sections: structuredClone(result.sections),
        };
        onReview(resume, { fileName, result });
    }
    return (
        <Modal title="Bring your story with you" onClose={onClose} wide>
            <form className="resume-modal-content resume-import-form" onSubmit={startReview}>
                <p className="muted">Import a plain-text resume, then make it your own in the editor. Your existing resumes won’t change until you save.</p>
                <div
                    className={`resume-dropzone${dragging ? " is-dragging" : ""}${result ? " has-file" : ""}`}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
                    }}
                    onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        if (event.dataTransfer.files.length !== 1) {
                            setError("Drop one resume file at a time.");
                            return;
                        }
                        void readFile(event.dataTransfer.files[0]);
                    }}
                >
                    <span className="resume-upload-icon">
                        {result ? <CheckCircle2 size={28} aria-hidden="true" /> : <Upload size={28} aria-hidden="true" />}
                    </span>
                    <strong>{busy ? "Reading your text…" : result ? "Your text is ready to review" : "Drop your .txt resume here"}</strong>
                    <p className="muted resume-file-name">{fileName || "Plain text (.txt) · UTF-8 · Up to 2 MB"}</p>
                    <button className="btn btn-secondary" type="button" onClick={() => inputRef.current?.click()}>
                        {fileName ? "Choose another file" : "Browse files"}
                    </button>
                    <input
                        className="resume-sr-only"
                        ref={inputRef}
                        type="file"
                        accept=".txt,.pdf,.doc,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={selectFile}
                        aria-label="Upload resume file"
                        tabIndex={-1}
                    />
                    <span className="resume-sr-only" role="status">
                        {busy ? "Reading file" : result ? "Text extracted. Continue to the editable review." : ""}
                    </span>
                </div>
                {error && (
                    <p className="resume-error resume-error-box" role="alert">
                        {error}
                    </p>
                )}
                <div className="resume-import-limits">
                    <Info size={18} aria-hidden="true" />
                    <div>
                        <strong>Real text extraction. A human final pass.</strong>
                        <p>{RESUME_IMPORT_LIMITATIONS}</p>
                        <p>
                            For clearer results, use <code>Title | Organization | Location | Dates</code> for entry headings. Unrecognized text stays available
                            for review.
                        </p>
                    </div>
                </div>
                <fieldset className="resume-destination">
                    <legend>Where should it go?</legend>
                    <label className={`resume-choice${destination === "master" ? " is-selected" : ""}`}>
                        <input
                            type="radio"
                            name="resume-import-destination"
                            value="master"
                            checked={destination === "master"}
                            disabled={!master}
                            onChange={() => setDestination("master")}
                        />
                        <span>
                            <strong>My master resume</strong>
                            <small>Replace the master only after review and Save. Tailored copies stay unchanged.</small>
                        </span>
                    </label>
                    <label className={`resume-choice${destination === "custom" ? " is-selected" : ""}`}>
                        <input
                            type="radio"
                            name="resume-import-destination"
                            value="custom"
                            checked={destination === "custom"}
                            disabled={!jobs.length}
                            onChange={() => setDestination("custom")}
                        />
                        <span>
                            <strong>A new tailored resume</strong>
                            <small>Start a separate version for a specific opportunity.</small>
                        </span>
                    </label>
                </fieldset>
                {destination === "custom" && <JobPicker jobs={jobs} selected={jobId} onChange={setJobId} id="resume-import-job" />}
                <p className="resume-privacy-note">
                    <ShieldCheck size={15} aria-hidden="true" /> Read locally in your browser. No file is uploaded to a server.
                </p>
                <div className="resume-modal-actions">
                    <button className="btn btn-ghost" type="button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={busy || !result || (destination === "custom" && !jobId)}>
                        Review editable draft <ArrowRight size={17} aria-hidden="true" />
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function Resumes({ selectedResumeId, onSelectResume, onApplyCustom }: ResumesProps) {
    const { state, deleteResume, toast } = useApp();
    const [modal, setModal] = useState<"import" | "create" | null>(null);
    const [staged, setStaged] = useState<StagedResume | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Resume | null>(null);
    const [selectedJob, setSelectedJob] = useState("");
    const [search, setSearch] = useState("");
    const master = state.resumes.find((resume) => resume.id === "master");
    const persistedResume = state.resumes.find((resume) => resume.id === selectedResumeId);
    const currentStaged = staged?.resume.id === selectedResumeId ? staged : null;
    const selected = currentStaged?.resume ?? persistedResume;
    const customResumes = state.resumes.filter((resume) => resume.id !== "master").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const query = search.trim().toLowerCase();
    const filteredCustom = customResumes.filter((resume) => {
        const job = state.jobs.find((job) => job.id === resume.jobId);
        return `${resume.name} ${job?.company ?? ""} ${job?.position ?? ""}`.toLowerCase().includes(query);
    });
    const linkedJob = state.jobs.find((job) => job.id === selectedJob);

    function stageResume(resume: Resume, review?: ImportReview) {
        setStaged({ resume, review });
        setModal(null);
        onSelectResume(resume.id);
    }
    function createDraft(event: FormEvent) {
        event.preventDefault();
        if (!master || !linkedJob) return;
        const resume = cloneResume(master);
        resume.id = crypto.randomUUID();
        resume.jobId = linkedJob.id;
        resume.name = `${linkedJob.company} · ${linkedJob.position}`;
        resume.updatedAt = new Date().toISOString();
        stageResume(resume);
    }
    function confirmDelete() {
        if (!deleteTarget) return;
        if (deleteTarget.id === "master" || state.applications.some((application) => application.resumeId === deleteTarget.id))
            toast("Resumes used by an application cannot be deleted.");
        else deleteResume(deleteTarget.id);
        setDeleteTarget(null);
    }
    if (selected)
        return (
            <ResumeEditor
                key={selected.id}
                resume={selected}
                persistedResume={persistedResume}
                review={currentStaged?.review}
                onBack={() => {
                    setStaged(null);
                    onSelectResume(null);
                }}
                onSaved={() => setStaged(null)}
                onApplyCustom={onApplyCustom}
            />
        );
    if (selectedResumeId)
        return (
            <div className="resumes-page">
                <EmptyState
                    icon={<FileText size={30} />}
                    title="This resume isn’t in your library"
                    description="It may have been removed. Your other resumes are still waiting for you."
                    action={
                        <button className="btn btn-primary" type="button" onClick={() => onSelectResume(null)}>
                            <ArrowLeft size={16} aria-hidden="true" /> Back to library
                        </button>
                    }
                />
            </div>
        );

    return (
        <div className="resumes-page resume-library">
            <header className="page-heading resume-library-heading">
                <div>
                    <p className="eyebrow">YOUR STORY, YOUR WAY</p>
                    <h1>
                        A good first impression
                        <br className="resume-heading-break" /> starts here<span className="resume-heading-dot">.</span>
                    </h1>
                    <p className="muted">One strong foundation. A thoughtful version for every opportunity.</p>
                </div>
                <div className="resume-heading-actions">
                    <button className="btn btn-secondary" type="button" onClick={() => setModal("import")}>
                        <Upload size={17} aria-hidden="true" /> Import resume
                    </button>
                    <button
                        className="btn btn-primary"
                        type="button"
                        disabled={!master || !state.jobs.length}
                        onClick={() => {
                            setSelectedJob("");
                            setModal("create");
                        }}
                    >
                        <Plus size={18} aria-hidden="true" /> Create tailored resume
                    </button>
                </div>
            </header>
            {master && (
                <section className="resume-master-card" aria-labelledby="resume-master-title">
                    <div className="resume-master-content">
                        <div className="resume-master-kicker">
                            <span className="resume-master-symbol">
                                <FileText size={22} aria-hidden="true" />
                            </span>
                            <span className="badge">The original</span>
                        </div>
                        <p className="eyebrow">START WITH YOUR BEST SELF</p>
                        <h2 id="resume-master-title">Your master resume</h2>
                        <p>All your experience, in one place. Keep it up to date, then take only what you need into each tailored version.</p>
                        <div className="resume-master-meta">
                            <span>
                                <CheckCircle2 size={15} aria-hidden="true" /> {visibleCount(master)} visible entries
                            </span>
                            <span>Updated {formatDate(master.updatedAt)}</span>
                        </div>
                        <button
                            className="btn btn-primary"
                            type="button"
                            onClick={() => {
                                setStaged(null);
                                onSelectResume(master.id);
                            }}
                        >
                            <Pencil size={16} aria-hidden="true" /> Edit master resume <ArrowRight size={16} aria-hidden="true" />
                        </button>
                        <p className="resume-master-protection">
                            <ShieldCheck size={14} aria-hidden="true" /> Your original stays yours. Tailoring always starts with a copy.
                        </p>
                    </div>
                    <div className="resume-master-art">
                        <span className="resume-art-orbit resume-art-orbit-one" />
                        <span className="resume-art-orbit resume-art-orbit-two" />
                        <MiniResume resume={master} />
                        <span className="resume-art-label">
                            <Sparkles size={15} aria-hidden="true" /> A little polish. A lot of possibility.
                        </span>
                    </div>
                </section>
            )}
            <section className="resume-custom-library" aria-labelledby="resume-custom-title">
                <div className="section-heading resume-custom-heading">
                    <div>
                        <div className="resume-title-with-count">
                            <h2 id="resume-custom-title">Tailored for your next chapter</h2>
                            <span className="resume-library-count">{customResumes.length}</span>
                        </div>
                        <p className="muted">Different opportunities. The same brilliant you.</p>
                    </div>
                    <div className="resume-search">
                        <Search size={17} aria-hidden="true" />
                        <label className="resume-sr-only" htmlFor="resume-library-search">
                            Search tailored resumes by name, company, or role
                        </label>
                        <input id="resume-library-search" placeholder="Find a resume…" value={search} onChange={(event) => setSearch(event.target.value)} />
                        {search && (
                            <button className="icon-button" type="button" aria-label="Clear resume search" onClick={() => setSearch("")}>
                                <X size={15} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
                {filteredCustom.length ? (
                    <div className="resume-card-grid">
                        {filteredCustom.map((resume) => {
                            const job = state.jobs.find((job) => job.id === resume.jobId);
                            const applicationCount = state.applications.filter((application) => application.resumeId === resume.id).length;
                            return (
                                <article className="resume-library-card panel" key={resume.id}>
                                    <div className="resume-card-topline">
                                        {job ? (
                                            <CompanyLogo job={job} size="md" />
                                        ) : (
                                            <span className="resume-orphan-icon">
                                                <FileText size={22} aria-hidden="true" />
                                            </span>
                                        )}
                                        <span className={`badge${applicationCount ? " resume-used-badge" : ""}`}>
                                            {applicationCount ? (
                                                <>
                                                    <Check size={12} aria-hidden="true" /> In use
                                                </>
                                            ) : (
                                                "Tailored"
                                            )}
                                        </span>
                                    </div>
                                    <div className="resume-card-copy">
                                        <p className="resume-card-company">{job?.company ?? "Custom resume"}</p>
                                        <h3>{resume.name}</h3>
                                        <p className="muted">{job ? job.position : "Linked opportunity is no longer available"}</p>
                                    </div>
                                    <div className="resume-card-meta">
                                        <span>{visibleCount(resume)} visible entries</span>
                                        <span>Updated {formatDate(resume.updatedAt)}</span>
                                    </div>
                                    <div className="resume-card-bottom">
                                        <button
                                            className="btn btn-secondary"
                                            type="button"
                                            onClick={() => {
                                                setStaged(null);
                                                onSelectResume(resume.id);
                                            }}
                                            aria-label={`Edit ${resume.name}`}
                                        >
                                            <Pencil size={15} aria-hidden="true" /> Edit resume <ArrowRight size={15} aria-hidden="true" />
                                        </button>
                                        <button
                                            className="icon-button resume-danger-button"
                                            type="button"
                                            disabled={applicationCount > 0}
                                            aria-label={`Delete ${resume.name}`}
                                            aria-describedby={applicationCount ? `resume-protected-${resume.id}` : undefined}
                                            title={applicationCount ? "Resumes used by an application cannot be deleted" : "Delete tailored resume"}
                                            onClick={() => setDeleteTarget(resume)}
                                        >
                                            {applicationCount ? <LockKeyhole size={16} aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />}
                                        </button>
                                    </div>
                                    {applicationCount > 0 && (
                                        <p className="resume-protected-note" id={`resume-protected-${resume.id}`}>
                                            Used by {applicationCount} {applicationCount === 1 ? "application" : "applications"} · Protected from deletion
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                        <button
                            className="resume-create-card"
                            type="button"
                            disabled={!master || !state.jobs.length}
                            onClick={() => {
                                setSelectedJob("");
                                setModal("create");
                            }}
                        >
                            <span>
                                <Plus size={25} aria-hidden="true" />
                            </span>
                            <strong>Make it a perfect fit</strong>
                            <p>
                                Start a fresh copy of your master
                                <br />
                                for an opportunity you love.
                            </p>
                            <small>
                                Create tailored resume <ArrowRight size={14} aria-hidden="true" />
                            </small>
                        </button>
                    </div>
                ) : (
                    <div className="resume-empty panel">
                        <EmptyState
                            icon={query ? <Search size={28} /> : <FileText size={30} />}
                            title={query ? "No resumes found" : "Your next opportunity deserves its own resume"}
                            description={
                                query
                                    ? "Try another name, company, or role."
                                    : "Create a tailored copy of your master and choose the experience that tells the right story."
                            }
                            action={
                                query ? (
                                    <button className="btn btn-secondary" type="button" onClick={() => setSearch("")}>
                                        Clear search
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        type="button"
                                        disabled={!master || !state.jobs.length}
                                        onClick={() => {
                                            setSelectedJob("");
                                            setModal("create");
                                        }}
                                    >
                                        <Plus size={16} aria-hidden="true" /> Create your first tailored resume
                                    </button>
                                )
                            }
                        />
                    </div>
                )}
            </section>
            <aside className="resume-library-tip">
                <span>
                    <Sparkles size={20} aria-hidden="true" />
                </span>
                <div>
                    <strong>A small edit can make a big difference.</strong>
                    <p>Lead with the experience that matters for the role. Hide the rest without losing it, and let your best work do the talking.</p>
                </div>
            </aside>
            {modal === "import" && <ImportModal master={master} jobs={state.jobs} onClose={() => setModal(null)} onReview={stageResume} />}
            {modal === "create" && (
                <Modal title="Make it a perfect fit" onClose={() => setModal(null)}>
                    <form className="resume-modal-content" onSubmit={createDraft}>
                        <p className="muted">
                            Start with an independent copy of your master resume, then make it relevant to one opportunity. Nothing is saved until you’re ready.
                        </p>
                        <JobPicker jobs={state.jobs} selected={selectedJob} onChange={setSelectedJob} id="resume-create-job" />
                        {linkedJob && (
                            <div className="resume-job-context panel">
                                <CompanyLogo job={linkedJob} size="sm" />
                                <div>
                                    <strong>{linkedJob.company}</strong>
                                    <span>{linkedJob.position}</span>
                                </div>
                            </div>
                        )}
                        <p className="resume-privacy-note">
                            <ShieldCheck size={16} aria-hidden="true" /> Your master resume won’t change.
                        </p>
                        <div className="resume-modal-actions">
                            <button className="btn btn-ghost" type="button" onClick={() => setModal(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" type="submit" disabled={!linkedJob || !master}>
                                Create draft <ArrowRight size={17} aria-hidden="true" />
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            {deleteTarget && (
                <Modal title="Delete this tailored resume?" onClose={() => setDeleteTarget(null)}>
                    <div className="resume-modal-content">
                        <p>
                            <strong>{deleteTarget.name}</strong> will be removed from your library. Your master resume and other versions won’t change. This
                            can’t be undone.
                        </p>
                        <div className="resume-modal-actions">
                            <button className="btn btn-secondary" type="button" onClick={() => setDeleteTarget(null)}>
                                Keep resume
                            </button>
                            <button className="btn resume-delete-confirm" type="button" onClick={confirmDelete}>
                                <Trash2 size={16} aria-hidden="true" /> Delete resume
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
