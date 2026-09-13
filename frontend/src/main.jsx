import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
    ArrowUpRight,
    ArrowRight,
    Search,
    BriefcaseBusiness,
    LayoutGrid,
    FileText,
    MessageSquare,
    Sparkles,
    Bookmark,
    Plus,
    X,
    MapPin,
    Clock,
    ChevronLeft,
    ChevronRight,
    Check,
    Bell,
    SlidersHorizontal,
    LogOut,
    Upload,
} from "lucide-react";
import "./styles.css";
import "./personality.css";
import ResumeUploads from "./ResumeUploads";
import { importResumeFile, RESUME_IMPORT_LIMITATIONS } from "./resumeImport";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const AUTH_STORAGE_KEY = "hire-power-auth";

function isConfiguredOAuthClientId(clientId, provider) {
    if (!clientId) return false;
    const normalized = String(clientId).trim().toLowerCase();
    if (!normalized) return false;
    return !["your-google-oauth-client-id.apps.googleusercontent.com", "your-linkedin-client-id", "replace-me", "placeholder", `${provider}-client-id`].some(
        (placeholder) => normalized.includes(placeholder),
    );
}

async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
        throw new Error(data?.detail || Object.values(data || {})?.flat?.()?.[0] || "Request failed");
    }
    return data;
}

function apiRequest(path, accessToken, options = {}) {
    return requestJson(path, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(options.headers || {}),
        },
    });
}

function storeAuth(auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function getStoredAuth() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
    } catch {
        return null;
    }
}

function userInitial(user) {
    return (user?.name || user?.email || "Y").trim().charAt(0).toUpperCase();
}

const jobLore = {
    1: [
        "About the job",
        "The logo is already in a Word document. Please work with that.",
        "Portfolio required. The founder's nephew will also be giving feedback.",
    ],
    2: [
        "About the job",
        "There are 46 console.log statements and we need to know which one is holding the site together.",
        "Please do not rewrite the entire app on your first day.",
    ],
    3: ["About the job", "Mostly asking people if they saw the message you sent them.", "Must be available for a meeting about reducing meetings."],
    4: ["About the job", "You will be going outside. We can lend you a jacket.", "Shoes required. We did not think we needed to specify this."],
    5: ["About the job", "It works on Kevin's laptop. Kevin has left the company.", "Find Kevin or fix the build. Either is fine."],
    6: ["About the job", "We liked the first version. Can you send that again?", "Must keep files named final, final2, and actually_final organized."],
    7: ["About the job", "The meeting ended 20 minutes ago and you are still talking. You're hired.", "Must be able to turn 'ok' into a 200-word email."],
    8: ["About the job", "Our entire financial model is in Sheet1 (copy) (2).", "Know what a pivot table is before the interview, preferably."],
};

const jobs = [
    {
        id: 1,
        company: "Aura Farming Inc.",
        logo: "A",
        color: "#f9ebee",
        title: "Aura Design Intern",
        location: "San Francisco, CA",
        type: "Internship",
        mode: "Remote",
        salary: "$35–45 / hr",
        tags: ["Design", "+1,000 aura"],
        posted: "2 hours ago",
    },
    {
        id: 2,
        company: "Delulu Labs",
        logo: "D",
        color: "#f3d6dd",
        title: "Frontend Vibe Engineer",
        location: "Toronto, ON",
        type: "Full-time",
        mode: "Remote",
        salary: "$85k–110k",
        tags: ["Engineering", "React"],
        posted: "4 hours ago",
    },
    {
        id: 3,
        company: "The Lore Department",
        logo: "L",
        color: "#f6e2e7",
        title: "Main Character Product Manager",
        location: "New York, NY",
        type: "Full-time",
        mode: "Hybrid",
        salary: "$90k–120k",
        tags: ["Product", "Entry level"],
        posted: "6 hours ago",
    },
    {
        id: 4,
        company: "Touch Grass Technologies",
        logo: "T",
        color: "#f1d0d8",
        title: "Touch Grass Research Intern",
        location: "Pittsburgh, PA",
        type: "Internship",
        mode: "On-site",
        salary: "$30–40 / hr",
        tags: ["Research", "Summer 2027"],
        posted: "1 day ago",
    },
    {
        id: 5,
        company: "Locked In LLC",
        logo: "L",
        color: "#f4d9e0",
        title: "Junior Lock-In Engineer",
        location: "New York, NY",
        type: "Full-time",
        mode: "Hybrid",
        salary: "$95k–125k",
        tags: ["Engineering", "Entry level"],
        posted: "1 day ago",
    },
    {
        id: 6,
        company: "Certified Yapper Studio",
        logo: "C",
        color: "#f5dbe2",
        title: "Senior Vibe Curator",
        location: "Austin, TX",
        type: "Full-time",
        mode: "Remote",
        salary: "$75k–95k",
        tags: ["Design", "Brand"],
        posted: "2 days ago",
    },
    {
        id: 7,
        company: "Side Quest HQ",
        logo: "Q",
        color: "#f9ebee",
        title: "Chief Yap Officer",
        location: "Remote",
        type: "Full-time",
        mode: "Remote",
        salary: "$65k–85k",
        tags: ["Support", "Entry level"],
        posted: "2 days ago",
    },
    {
        id: 8,
        company: "No Cap Capital",
        logo: "N",
        color: "#f9ebee",
        title: "Full-Stack Lore Intern",
        location: "Seattle, WA",
        type: "Internship",
        mode: "Hybrid",
        salary: "$40–55 / hr",
        tags: ["Engineering", "Summer 2027"],
        posted: "3 days ago",
    },
];
const initialApplications = [
    {
        id: 101,
        company: "The Lore Department",
        position: "Aura Design Intern",
        date: "2026-09-10",
        status: "Interview",
        followUp: "2026-09-16",
    },
    {
        id: 102,
        company: "Delulu Labs",
        position: "Frontend Vibe Engineer Intern",
        date: "2026-09-08",
        status: "Applied",
        followUp: "2026-09-18",
    },
    {
        id: 103,
        company: "Aura Farming Inc.",
        position: "UX Design Intern",
        date: "2026-09-06",
        status: "Applied",
        followUp: "",
    },
];
const stages = ["Applied", "Interview", "Offer", "Rejection"];
function useSaved(key, fallback) {
    const [value, setValue] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(key)) ?? fallback;
        } catch {
            return fallback;
        }
    });
    const [error, setError] = useState(false);
    function save(next) {
        setValue(next);
        try {
            localStorage.setItem(key, JSON.stringify(next));
            setError(false);
        } catch {
            setError(true);
        }
    }
    return [value, save, error];
}
function AuthShell() {
    const [auth, setAuth] = useState(() => getStoredAuth());
    const [authError, setAuthError] = useState("");
    const [checkingProvider, setCheckingProvider] = useState(false);

    useEffect(() => {
        async function completeOAuth() {
            const url = new URL(window.location.href);
            const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
            const googleToken = hash.get("id_token");
            const googleError = url.searchParams.get("error") || hash.get("error");
            const googleErrorDescription = url.searchParams.get("error_description") || hash.get("error_description");
            const linkedinCode = url.searchParams.get("code");
            const linkedinState = url.searchParams.get("state");
            const expectedLinkedinState = localStorage.getItem("hire-power-linkedin-state");

            try {
                if (googleError) {
                    throw new Error(
                        `Google sign-in was not completed: ${googleErrorDescription || googleError}. For the demo, use email/password unless a real Google OAuth client is configured.`,
                    );
                }
                if (googleToken) {
                    setCheckingProvider(true);
                    const next = await requestJson("/api/auth/google/", {
                        method: "POST",
                        body: JSON.stringify({ id_token: googleToken }),
                    });
                    storeAuth(next);
                    setAuth(next);
                    window.history.replaceState({}, document.title, url.pathname);
                } else if (linkedinCode) {
                    if (!expectedLinkedinState || linkedinState !== expectedLinkedinState) {
                        throw new Error("LinkedIn sign-in state did not match. Please try again.");
                    }
                    setCheckingProvider(true);
                    localStorage.removeItem("hire-power-linkedin-state");
                    const next = await requestJson("/api/auth/linkedin/", {
                        method: "POST",
                        body: JSON.stringify({
                            code: linkedinCode,
                            redirect_uri: `${url.origin}${url.pathname}`,
                        }),
                    });
                    storeAuth(next);
                    setAuth(next);
                    window.history.replaceState({}, document.title, url.pathname);
                }
            } catch (error) {
                setAuthError(error.message);
            } finally {
                setCheckingProvider(false);
            }
        }
        completeOAuth();
    }, []);

    async function handleEmailAuth(formData, mode) {
        const payload = Object.fromEntries(formData);
        const path = mode === "register" ? "/api/auth/register/" : "/api/auth/login/";
        const next = await requestJson(path, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        storeAuth(next);
        setAuth(next);
    }

    async function logout() {
        const refresh = auth?.refresh;
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuth(null);
        if (refresh) {
            try {
                await requestJson("/api/auth/logout/", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${auth.access}` },
                    body: JSON.stringify({ refresh }),
                });
            } catch {
                // The local session has already been cleared.
            }
        }
    }

    if (checkingProvider) {
        return <div className="auth-status">Finishing secure sign-in…</div>;
    }

    if (!auth?.access || !auth?.user) {
        return <AuthPage onEmailAuth={handleEmailAuth} authError={authError} />;
    }

    return <App auth={auth} user={auth.user} onLogout={logout} />;
}

function AuthPage({ onEmailAuth, authError }) {
    const [mode, setMode] = useState("login");
    const [error, setError] = useState(authError);
    const [busy, setBusy] = useState(false);

    useEffect(() => setError(authError), [authError]);

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            await onEmailAuth(new FormData(e.currentTarget), mode);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    function signInWithGoogle() {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!isConfiguredOAuthClientId(clientId, "google")) {
            setError(
                "Google SSO is available, but it needs a real Google OAuth client ID for this origin. For the demo, use email/password login or set VITE_GOOGLE_CLIENT_ID and backend GOOGLE_CLIENT_ID.",
            );
            return;
        }
        const redirectUri = `${window.location.origin}${window.location.pathname}`;
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "id_token",
            scope: "openid email profile",
            nonce: crypto.randomUUID(),
            prompt: "select_account",
        });
        window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    }

    function signInWithLinkedIn() {
        const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
        if (!isConfiguredOAuthClientId(clientId, "linkedin")) {
            setError(
                "LinkedIn SSO is available, but it needs a real LinkedIn OAuth client ID for this origin. For the demo, use email/password login or set VITE_LINKEDIN_CLIENT_ID plus backend LinkedIn credentials.",
            );
            return;
        }
        const state = crypto.randomUUID();
        localStorage.setItem("hire-power-linkedin-state", state);
        const redirectUri = `${window.location.origin}${window.location.pathname}`;
        const params = new URLSearchParams({
            response_type: "code",
            client_id: clientId,
            redirect_uri: redirectUri,
            state,
            scope: "openid profile email",
        });
        window.location.assign(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
    }

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="auth-title">
                <a className="brand auth-brand" href="#" onClick={(e) => e.preventDefault()}>
                    <span className="brand-icon">
                        <span className="logo-halo" aria-hidden="true" />
                        <Sparkles size={21} aria-hidden="true" />
                    </span>
                    <span className="brand-name">
                        Hire Power<span className="brand-dot">.</span>
                    </span>
                </a>
                <div>
                    <p className="eyebrow">SECURE WORKSPACE</p>
                    <h1 id="auth-title">{mode === "login" ? "Sign in to keep tracking" : "Create your job search workspace"}</h1>
                    <p>Use email and password, Google SSO, or LinkedIn SSO.</p>
                </div>
                {error && (
                    <div className="notice auth-error" role="alert">
                        {error}
                    </div>
                )}
                <form onSubmit={submit} className="auth-form">
                    {mode === "register" && (
                        <div className="form-row">
                            <label>
                                First name
                                <input name="first_name" autoComplete="given-name" maxLength={150} />
                            </label>
                            <label>
                                Last name
                                <input name="last_name" autoComplete="family-name" maxLength={150} />
                            </label>
                        </div>
                    )}
                    <label>
                        Email
                        <input name="email" type="email" autoComplete="email" required />
                    </label>
                    <label>
                        Password
                        <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required />
                    </label>
                    <button className="primary" type="submit" disabled={busy}>
                        {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
                        <ArrowRight size={16} />
                    </button>
                </form>
                <div className="auth-divider">
                    <span>or continue with</span>
                </div>
                <div className="sso-actions">
                    <button className="secondary" type="button" onClick={signInWithGoogle}>
                        Google
                    </button>
                    <button className="secondary" type="button" onClick={signInWithLinkedIn}>
                        LinkedIn
                    </button>
                </div>
                <button className="text-button auth-switch" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                    {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
                </button>
            </section>
        </main>
    );
}

function App({ auth, user, onLogout }) {
    const [tab, setTab] = useState("Jobs"),
        [query, setQuery] = useState(""),
        [mode, setMode] = useState("All locations"),
        [type, setType] = useState("All job types"),
        [page, setPage] = useState(1),
        [savedOnly, setSavedOnly] = useState(false),
        [modal, setModal] = useState(null),
        [notice, setNotice] = useState("");
    // Keep the original storage keys so the rebrand preserves existing user edits.
    const [saved, setSaved, savedError] = useSaved("sprout-saved", []),
        [applications, setApplications, appsError] = useSaved("sprout-applications", initialApplications),
        [resumes, setResumes, resumeError] = useSaved("sprout-resumes", [
            {
                id: 1,
                name: "My master resume",
                content:
                    "YOUR NAME\nEmail · Phone · Portfolio\n\nABOUT ME\nWrite a short introduction about your interests and experience.\n\nEXPERIENCE\nRole · Company · Dates\n• Describe your contribution and its impact.\n\nEDUCATION\nDegree · University · Graduation year\n\nSKILLS\nAdd your relevant skills.",
                master: true,
            },
        ]),
        [messages, setMessages, messageError] = useSaved("sprout-messages", []);
    const [resumeId, setResumeId] = useState(1);
    const [remoteError, setRemoteError] = useState("");
    const resumeImportInput = useRef(null);

    useEffect(() => {
        let active = true;
        async function loadWorkspace() {
            setRemoteError("");
            try {
                const [remoteApplications, remoteSavedJobs, remoteResumes, remoteMessages] = await Promise.all([
                    apiRequest("/api/applications/", auth.access),
                    apiRequest("/api/saved-jobs/", auth.access),
                    apiRequest("/api/resumes/", auth.access),
                    apiRequest("/api/communications/", auth.access),
                ]);
                if (!active) return;
                setApplications(remoteApplications);
                setSaved(remoteSavedJobs.map((item) => item.jobId));
                setResumes(remoteResumes);
                setMessages(remoteMessages);
                setResumeId(remoteResumes[0]?.id || 1);
            } catch (error) {
                if (active) setRemoteError(error.message);
            }
        }
        loadWorkspace();
        return () => {
            active = false;
        };
    }, [auth.access]);
    const filtered = jobs.filter(
        (j) =>
            `${j.title} ${j.company} ${j.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()) &&
            (mode === "All locations" || j.mode === mode) &&
            (type === "All job types" || j.type === type) &&
            (!savedOnly || saved.includes(j.id)),
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / 6)),
        currentPage = Math.min(page, totalPages),
        activeResume = resumes.find((r) => r.id === resumeId) || resumes[0];
    const upcoming = applications.filter((a) => a.followUp && !["Offer", "Rejection"].includes(a.status)).sort((a, b) => a.followUp.localeCompare(b.followUp));
    function navigate(next) {
        setTab(next);
        setNotice("");
    }
    function track(job) {
        setModal({ kind: "application", job });
    }
    async function submitApplication(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const payload = {
            ...data,
            followUp: data.followUp || null,
            sourceJobId: modal.job?.id || null,
            jobPayload: modal.job || {},
        };
        try {
            const created = await apiRequest("/api/applications/", auth.access, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            setApplications([created, ...applications]);
            setModal(null);
            setNotice("Application added to your tracker.");
        } catch (error) {
            setNotice(`Could not save application: ${error.message}`);
        }
    }
    function downloadResume() {
        const url = URL.createObjectURL(new Blob([activeResume.content], { type: "text/plain" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeResume.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
    async function toggleSavedJob(job) {
        const isSaved = saved.includes(job.id);
        const next = isSaved ? saved.filter((id) => id !== job.id) : [...saved, job.id];
        setSaved(next);
        try {
            if (isSaved) {
                await apiRequest(`/api/saved-jobs/by-job/${job.id}/`, auth.access, {
                    method: "DELETE",
                });
            } else {
                await apiRequest("/api/saved-jobs/", auth.access, {
                    method: "POST",
                    body: JSON.stringify({ jobId: job.id, jobPayload: job }),
                });
            }
        } catch (error) {
            setSaved(saved);
            setNotice(`Could not update saved jobs: ${error.message}`);
        }
    }
    async function updateApplication(id, patch) {
        const previous = applications;
        setApplications(applications.map((item) => (item.id === id ? { ...item, ...patch } : item)));
        try {
            const updated = await apiRequest(`/api/applications/${id}/`, auth.access, {
                method: "PATCH",
                body: JSON.stringify(patch),
            });
            setApplications(previous.map((item) => (item.id === id ? updated : item)));
        } catch (error) {
            setApplications(previous);
            setNotice(`Could not update application: ${error.message}`);
        }
    }
    async function updateTextResume(id, patch) {
        const previous = resumes;
        setResumes(resumes.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        try {
            const updated = await apiRequest(`/api/resumes/${id}/`, auth.access, {
                method: "PATCH",
                body: JSON.stringify(patch),
            });
            setResumes(previous.map((r) => (r.id === id ? updated : r)));
        } catch (error) {
            setResumes(previous);
            setNotice(`Could not update resume: ${error.message}`);
        }
    }
    async function importTextResume(event) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        try {
            const imported = await importResumeFile(file);
            const created = await apiRequest("/api/resumes/", auth.access, {
                method: "POST",
                body: JSON.stringify({
                    name: file.name.replace(/\.txt$/i, "") || "Imported resume",
                    content: imported.content,
                    master: false,
                }),
            });
            setResumes([...resumes, created]);
            setResumeId(created.id);
            setNotice(imported.warnings.join(" "));
        } catch (error) {
            setNotice(`Could not import resume: ${error.message}`);
        }
    }
    return (
        <div className="app">
            <a className="skip" href="#main">
                Skip to content
            </a>
            <aside className="sidebar">
                <a
                    className="brand"
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate("Jobs");
                    }}
                >
                    <span className="brand-icon">
                        <span className="logo-halo" aria-hidden="true" />
                        <Sparkles size={21} aria-hidden="true" />
                    </span>
                    <span className="brand-name">
                        Hire Power<span className="brand-dot">.</span>
                    </span>
                </a>
                <div className="workspace-label">YOUR WORKSPACE</div>
                <nav aria-label="Main navigation">
                    {[
                        [LayoutGrid, "Jobs"],
                        [BriefcaseBusiness, "Applications"],
                        [FileText, "Resumes"],
                        [MessageSquare, "Inbox"],
                    ].map(([Icon, name]) => (
                        <button
                            key={name}
                            aria-label={name}
                            className={`nav-item ${tab === name ? "active" : ""}`}
                            aria-current={tab === name ? "page" : undefined}
                            onClick={() => navigate(name)}
                        >
                            <Icon size={20} />
                            <span>{name}</span>
                            {name === "Applications" && <b>{applications.length}</b>}
                        </button>
                    ))}
                </nav>
                <figure className="sidebar-meme">
                    <figcaption>does carrying the group project count as management experience</figcaption>
                    <div className="thinking-crop">
                        <img src="/memes/thinking-monkey.jpg" alt="Monkey looking up thoughtfully" width="800" height="699" />
                    </div>
                </figure>
                <div className="profile">
                    <div className="avatar">{userInitial(user)}</div>
                    <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                    </div>
                </div>
            </aside>
            <div className="workspace">
                <header className="topbar">
                    <div>
                        <span className="breadcrumb">My workspace</span>
                        <span className="slash">/</span>
                        <strong>{tab}</strong>
                    </div>
                    <div className="top-actions">
                        <span className="demo-badge">Demo workspace</span>
                        <button className="text-button" onClick={onLogout}>
                            <LogOut size={16} />
                            Sign out
                        </button>
                        <button className="icon-button" aria-label="View follow-up reminders" onClick={() => setModal({ kind: "reminders" })}>
                            <Bell size={20} />
                            {upcoming.length > 0 && <i />}
                        </button>
                        <div className="avatar small">{userInitial(user)}</div>
                    </div>
                </header>
                <main id="main">
                    <div className="page-heading">
                        <div>
                            <h1>{tab === "Jobs" ? "Here, jobs" : tab}</h1>
                        </div>
                        {tab !== "Jobs" && (
                            <button
                                className="primary"
                                onClick={() =>
                                    tab === "Applications" ? track(null) : tab === "Resumes" ? setModal({ kind: "resume" }) : setModal({ kind: "message" })
                                }
                            >
                                <Plus size={17} />
                                {tab === "Applications" ? "Add application" : tab === "Resumes" ? "Tailor a resume" : "Log communication"}
                            </button>
                        )}
                    </div>
                    {remoteError && (
                        <div role="alert" className="notice">
                            Backend sync failed: {remoteError}. Local browser data is still available.
                        </div>
                    )}
                    {(savedError || appsError || resumeError || messageError) && (
                        <div role="alert" className="notice">
                            Browser storage is unavailable. Your edits will last only for this session.
                        </div>
                    )}
                    {notice && (
                        <div className="notice" role="status">
                            <Check size={16} />
                            {notice}
                            <button aria-label="Dismiss notification" onClick={() => setNotice("")}>
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    {tab === "Jobs" && (
                        <>
                            <section className="meme-board" aria-label="Job search mood board">
                                <div className="desktop-meme">
                                    <div className="window-bar">
                                        <span>cover_letter_final_FINAL.doc</span>
                                        <span aria-hidden="true">_ □ ×</span>
                                    </div>
                                    <figure>
                                        <figcaption>“I have always been passionate about”</figcaption>
                                        <img src="/memes/office-monkey.jpg" alt="A bored monkey sitting at an office computer" width="1000" height="562" />
                                    </figure>
                                </div>
                                <figure className="recruiter-meme">
                                    <figcaption>
                                        “entry level”
                                        <br />
                                        <strong>3–5 years experience</strong>
                                    </figcaption>
                                    <img src="/memes/nerd-cat.jpg" alt="Cat wearing glasses with a raised finger" width="279" height="286" />
                                    <span className="pen-note" aria-hidden="true">
                                        be serious.
                                    </span>
                                </figure>
                            </section>
                            <section className="stats" aria-label="Your application overview">
                                {[
                                    ["Applications sent", applications.length, BriefcaseBusiness],
                                    ["In conversation", applications.filter((a) => a.status === "Interview").length, MessageSquare],
                                    ["Saved opportunities", saved.length, Bookmark],
                                ].map(([label, value, Icon]) => (
                                    <button
                                        className="stat"
                                        key={label}
                                        onClick={() => (label === "Saved opportunities" ? (setSavedOnly(true), setPage(1)) : navigate("Applications"))}
                                    >
                                        <div>
                                            <span>{label}</span>
                                            <strong>{String(value).padStart(2, "0")}</strong>
                                        </div>
                                        <span className="stat-icon">
                                            <Icon size={21} />
                                        </span>
                                    </button>
                                ))}
                            </section>
                            <section className="jobs-section">
                                <div className="section-heading">
                                    <div>
                                        <h2>
                                            Listings <span className="count">{filtered.length}</span>
                                        </h2>
                                    </div>
                                    <button
                                        className={`text-button ${savedOnly ? "selected" : ""}`}
                                        onClick={() => {
                                            setSavedOnly(!savedOnly);
                                            setPage(1);
                                        }}
                                    >
                                        <Bookmark size={16} />
                                        {savedOnly ? "Show all jobs" : "Saved jobs"}
                                    </button>
                                </div>
                                <div className="filters">
                                    <label className="search">
                                        <Search size={19} />
                                        <input
                                            id="job-search"
                                            aria-label="Search jobs by title, company, or keyword"
                                            placeholder="Job title, company, or keyword"
                                            value={query}
                                            onChange={(e) => {
                                                setQuery(e.target.value);
                                                setPage(1);
                                            }}
                                        />
                                    </label>
                                    <label className="filter">
                                        <MapPin size={17} />
                                        <select
                                            aria-label="Work location"
                                            value={mode}
                                            onChange={(e) => {
                                                setMode(e.target.value);
                                                setPage(1);
                                            }}
                                        >
                                            {["All locations", "Remote", "Hybrid", "On-site"].map((x) => (
                                                <option key={x}>{x}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="filter">
                                        <SlidersHorizontal size={17} />
                                        <select
                                            aria-label="Job type"
                                            value={type}
                                            onChange={(e) => {
                                                setType(e.target.value);
                                                setPage(1);
                                            }}
                                        >
                                            {["All job types", "Full-time", "Internship"].map((x) => (
                                                <option key={x}>{x}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="results-label">
                                    {savedOnly ? "Your saved opportunities" : "All listings"}
                                    <span>Sample listings · Not live job postings</span>
                                </div>
                                <div className="job-grid">
                                    {filtered.slice((currentPage - 1) * 6, currentPage * 6).map((job) => (
                                        <article className="job-card" key={job.id}>
                                            <div className="job-sticker">
                                                <span>{job.type}</span>
                                                <span>#{String(job.id).padStart(3, "0")}</span>
                                            </div>
                                            <div className="card-top">
                                                <div className="company-logo" style={{ background: job.color }}>
                                                    {job.logo}
                                                </div>
                                                <div>
                                                    <strong>{job.company}</strong>
                                                    <small>{job.type}</small>
                                                </div>
                                                <button
                                                    className={`save-button ${saved.includes(job.id) ? "is-saved" : ""}`}
                                                    aria-label={`${saved.includes(job.id) ? "Unsave" : "Save"} ${job.title} at ${job.company}`}
                                                    aria-pressed={saved.includes(job.id)}
                                                    onClick={() => toggleSavedJob(job)}
                                                >
                                                    <Bookmark size={19} fill={saved.includes(job.id) ? "currentColor" : "none"} />
                                                </button>
                                            </div>
                                            <h3>{job.title}</h3>
                                            <p className="job-roast">{jobLore[job.id][1]}</p>
                                            <p className="location">
                                                <MapPin size={14} />
                                                {job.location}
                                                <span>·</span>
                                                {job.mode}
                                            </p>
                                            <div className="tags">
                                                {job.tags.map((tag) => (
                                                    <span key={tag}>{tag}</span>
                                                ))}
                                            </div>
                                            <div className="card-bottom">
                                                <div>
                                                    <strong>{job.salary}</strong>
                                                    <small>
                                                        <Clock size={12} />
                                                        {job.posted}
                                                    </small>
                                                </div>
                                                <button
                                                    className="job-open"
                                                    aria-label={`View ${job.title} at ${job.company}`}
                                                    onClick={() => setModal({ kind: "job", job })}
                                                >
                                                    Details <ArrowUpRight size={17} />
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                                {!filtered.length && (
                                    <div className="empty">
                                        <Search />
                                        <h3>No opportunities found</h3>
                                        <p>Try another keyword or adjust your filters.</p>
                                        <button
                                            className="secondary"
                                            onClick={() => {
                                                setQuery("");
                                                setMode("All locations");
                                                setType("All job types");
                                                setSavedOnly(false);
                                            }}
                                        >
                                            Reset filters
                                        </button>
                                    </div>
                                )}
                                <div className="pagination">
                                    <span>
                                        Showing {filtered.length ? (currentPage - 1) * 6 + 1 : 0}–{Math.min(currentPage * 6, filtered.length)} of{" "}
                                        {filtered.length} opportunities
                                    </span>
                                    <div>
                                        <button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                                            <ChevronLeft size={16} />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                aria-label={`Page ${i + 1}`}
                                                aria-current={currentPage === i + 1 ? "page" : undefined}
                                                className={currentPage === i + 1 ? "current" : ""}
                                                onClick={() => setPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                    {tab === "Applications" && (
                        <>
                            <div className="info-strip">
                                <Bell size={18} />
                                {upcoming.length} follow-ups to keep on your radar.
                                <button className="text-button" onClick={() => setModal({ kind: "reminders" })}>
                                    View reminders <ArrowRight size={15} />
                                </button>
                            </div>
                            <div className="board">
                                {stages.map((stage) => (
                                    <section className="board-column" key={stage}>
                                        <h2>
                                            <span className={`stage-dot ${stage}`} />
                                            {stage}
                                            <span className="count">{applications.filter((a) => a.status === stage).length}</span>
                                        </h2>
                                        {applications
                                            .filter((a) => a.status === stage)
                                            .map((a) => (
                                                <article className="application-card" key={a.id}>
                                                    <small>{a.company}</small>
                                                    <h3>{a.position}</h3>
                                                    <p>Applied {a.date}</p>
                                                    <label>
                                                        Stage
                                                        <select value={a.status} onChange={(e) => updateApplication(a.id, { status: e.target.value })}>
                                                            {stages.map((s) => (
                                                                <option key={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label>
                                                        Follow-up date
                                                        <input
                                                            type="date"
                                                            value={a.followUp}
                                                            onChange={(e) =>
                                                                updateApplication(a.id, {
                                                                    followUp: e.target.value || null,
                                                                })
                                                            }
                                                        />
                                                    </label>
                                                </article>
                                            ))}
                                        {!applications.some((a) => a.status === stage) && <p className="column-empty">No applications here yet.</p>}
                                        {stage === "Offer" && (
                                            <div className="offer-doodle" aria-hidden="true">
                                                <img src="/memes/hamster-doodle.png" alt="" width="140" height="140" />
                                            </div>
                                        )}
                                        {stage === "Applied" && (
                                            <figure className="tab-meme application-meme">
                                                <img
                                                    src="/memes/praying.jpg"
                                                    alt="Black-and-white reaction image of two men praying"
                                                    width="735"
                                                    height="577"
                                                />
                                                <figcaption>after clicking submit</figcaption>
                                            </figure>
                                        )}
                                    </section>
                                ))}
                            </div>
                        </>
                    )}
                    {tab === "Resumes" && (
                        <div>
                            <ResumeUploads accessToken={auth.access} apiBaseUrl={API_BASE_URL} />
                            <div className="resume-layout">
                                <section className="resume-list">
                                    <div className="resume-list-heading">
                                        <h2>Your resumes</h2>
                                        <button className="secondary" type="button" onClick={() => resumeImportInput.current?.click()}>
                                            <Upload size={15} />
                                            Import .txt
                                        </button>
                                        <input ref={resumeImportInput} type="file" accept=".txt,text/plain" onChange={importTextResume} hidden />
                                    </div>
                                    {resumes.map((r) => (
                                        <button
                                            key={r.id}
                                            className={activeResume.id === r.id ? "resume-choice selected" : "resume-choice"}
                                            onClick={() => setResumeId(r.id)}
                                        >
                                            <FileText size={20} />
                                            <span>
                                                {r.name}
                                                <small>{r.master ? "Master template" : "Tailored copy"}</small>
                                            </span>
                                        </button>
                                    ))}
                                    <p>Edits save to your account. Download a copy to keep it with you. {RESUME_IMPORT_LIMITATIONS}</p>
                                    <figure className="tab-meme resume-meme">
                                        <img
                                            src="/memes/lock-in.jpg"
                                            alt="Monkey pointing at its head with the caption time to lock in"
                                            width="735"
                                            height="729"
                                        />
                                    </figure>
                                </section>
                                <section className="resume-editor">
                                    <div className="section-heading">
                                        <h2>{activeResume.name}</h2>
                                        <button className="secondary" onClick={downloadResume}>
                                            Download .txt <ArrowUpRight size={16} />
                                        </button>
                                    </div>
                                    <label htmlFor="resume-content" className="eyebrow">
                                        RESUME CONTENT · PLAIN TEXT
                                    </label>
                                    <textarea
                                        id="resume-content"
                                        value={activeResume.content}
                                        onChange={(e) => updateTextResume(activeResume.id, { content: e.target.value })}
                                    />
                                    <span className="editor-caption">
                                        <Check size={14} /> {resumeError ? "Saved for this session" : "Saved in this browser"}
                                    </span>
                                </section>
                            </div>
                        </div>
                    )}
                    {tab === "Inbox" && (
                        <section className="inbox">
                            <figure className="tab-meme inbox-meme">
                                <img src="/memes/phone-monkey.jpg" alt="Monkey in glasses taking a phone call at an office desk" width="540" height="759" />
                                <figcaption>“just following up”</figcaption>
                            </figure>
                            <div className="info-strip">
                                <MessageSquare size={18} />
                                Your communication journal. Add company responses here as they arrive.
                            </div>
                            {messages.length ? (
                                messages
                                    .slice()
                                    .reverse()
                                    .map((m) => (
                                        <article className="message-card" key={m.id}>
                                            <div className="stat-icon">
                                                <MessageSquare size={20} />
                                            </div>
                                            <div>
                                                <span className="tag">{m.type}</span>
                                                <h3>{m.company}</h3>
                                                <p>{m.notes}</p>
                                                <small>{m.date}</small>
                                            </div>
                                        </article>
                                    ))
                            ) : (
                                <div className="empty">
                                    <MessageSquare size={32} />
                                    <h3>No messages yet.</h3>
                                    <p>Keep interview invitations, feedback, and offers together.</p>
                                    <button className="primary" onClick={() => setModal({ kind: "message" })}>
                                        <Plus size={16} />
                                        Log your first response
                                    </button>
                                    <img className="inbox-corner-doodle" src="/memes/hamster-doodle.png" alt="" aria-hidden="true" width="95" height="95" />
                                </div>
                            )}
                        </section>
                    )}
                    <footer>
                        <span>Hire Power</span>
                    </footer>
                </main>
            </div>
            {modal && (
                <Modal onClose={() => setModal(null)}>
                    <div className="modal-heading">
                        <h2>
                            {modal.kind === "application"
                                ? "Track an application"
                                : modal.kind === "job"
                                  ? modal.job.title
                                  : modal.kind === "resume"
                                    ? "Make it your own"
                                    : modal.kind === "message"
                                      ? "Log a communication"
                                      : "Your follow-up reminders"}
                        </h2>
                        <button className="icon-button" aria-label="Close dialog" onClick={() => setModal(null)}>
                            <X size={20} />
                        </button>
                    </div>
                    {modal.kind === "job" && (
                        <>
                            <p>
                                {modal.job.company} · {modal.job.location} · {modal.job.mode}
                            </p>
                            <div className="tags">
                                {modal.job.tags.map((t) => (
                                    <span key={t}>{t}</span>
                                ))}
                            </div>
                            <p>
                                <strong>{modal.job.salary}</strong> · {modal.job.type}
                            </p>
                            <div className="lore-detail">
                                <h3>{jobLore[modal.job.id][0]}</h3>
                                <p>{jobLore[modal.job.id][1]}</p>
                                <h3>Requirements</h3>
                                <p>{jobLore[modal.job.id][2]}</p>
                            </div>
                            <p className="muted">
                                This is a fictional opportunity for exploring Hire Power. Tracking it creates a local application record; it does not submit an
                                application to the company.
                            </p>
                            <button className="primary" onClick={() => track(modal.job)}>
                                Track this application <Plus size={16} />
                            </button>
                        </>
                    )}
                    {modal.kind === "application" && (
                        <form onSubmit={submitApplication}>
                            <label>
                                Company
                                <input name="company" required maxLength={100} defaultValue={modal.job?.company} />
                            </label>
                            <label>
                                Position
                                <input name="position" required maxLength={150} defaultValue={modal.job?.title} />
                            </label>
                            <div className="form-row">
                                <label>
                                    Date applied
                                    <input name="date" type="date" required defaultValue={new Date().toLocaleDateString("en-CA")} />
                                </label>
                                <label>
                                    Status
                                    <select name="status">
                                        {stages.map((s) => (
                                            <option key={s}>{s}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label>
                                Follow-up reminder
                                <input name="followUp" type="date" />
                            </label>
                            <button className="primary" type="submit">
                                Add to applications <ArrowRight size={16} />
                            </button>
                        </form>
                    )}
                    {modal.kind === "resume" && (
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const name = new FormData(e.target).get("name");
                                try {
                                    const created = await apiRequest("/api/resumes/", auth.access, {
                                        method: "POST",
                                        body: JSON.stringify({
                                            name,
                                            content: resumes.find((r) => r.master).content,
                                            master: false,
                                        }),
                                    });
                                    setResumes([...resumes, created]);
                                    setResumeId(created.id);
                                    setModal(null);
                                } catch (error) {
                                    setNotice(`Could not create resume: ${error.message}`);
                                }
                            }}
                        >
                            <p>Create an editable copy of your master resume for a specific role.</p>
                            <label>
                                Resume name
                                <input name="name" placeholder="e.g. Delulu Labs — Frontend Vibe Engineer" required maxLength={120} />
                            </label>
                            <button className="primary" type="submit">
                                Create tailored copy <ArrowRight size={16} />
                            </button>
                        </form>
                    )}
                    {modal.kind === "message" && (
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    const created = await apiRequest("/api/communications/", auth.access, {
                                        method: "POST",
                                        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
                                    });
                                    setMessages([created, ...messages]);
                                    setModal(null);
                                    setNotice("Communication logged. Update the application stage in Applications if needed.");
                                } catch (error) {
                                    setNotice(`Could not save communication: ${error.message}`);
                                }
                            }}
                        >
                            <label>
                                Company
                                <input name="company" required maxLength={100} />
                            </label>
                            <div className="form-row">
                                <label>
                                    Response type
                                    <select name="type">
                                        {["Interview invitation", "Rejection", "Job offer", "Follow-up", "Other"].map((t) => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Date
                                    <input name="date" type="date" required defaultValue={new Date().toLocaleDateString("en-CA")} />
                                </label>
                            </div>
                            <label>
                                Notes
                                <textarea name="notes" required placeholder="What did they say? What happens next?" />
                            </label>
                            <button className="primary" type="submit">
                                Save communication <Check size={16} />
                            </button>
                        </form>
                    )}
                    {modal.kind === "reminders" && (
                        <>
                            <p className="muted">In-app reminders from your application tracker. Email and push notifications are not connected yet.</p>
                            {upcoming.length ? (
                                upcoming.map((a) => (
                                    <div className="reminder" key={a.id}>
                                        <Bell size={18} />
                                        <div>
                                            <strong>{a.company}</strong>
                                            <p>{a.position}</p>
                                        </div>
                                        <time>{a.followUp}</time>
                                    </div>
                                ))
                            ) : (
                                <p>No follow-ups scheduled. Add a date to an application to see it here.</p>
                            )}
                        </>
                    )}
                </Modal>
            )}
        </div>
    );
}
function Modal({ children, onClose }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
        const previous = document.activeElement;
        const dialog = ref.current;
        dialog.showModal();
        return () => {
            dialog.close();
            previous?.focus();
        };
    }, []);
    return (
        <dialog
            ref={ref}
            className="modal"
            aria-label="Workspace action"
            onCancel={onClose}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose();
                }
            }}
        >
            {children}
        </dialog>
    );
}
createRoot(document.getElementById("root")).render(<AuthShell />);
