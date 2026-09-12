import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
    ArrowRight,
    ArrowUpRight,
    Bell,
    Bookmark,
    BriefcaseBusiness,
    Check,
    ChevronDown,
    ChevronRight,
    Compass,
    FileText,
    HelpCircle,
    Info,
    Leaf,
    LogIn,
    Menu,
    Moon,
    Search,
    Settings2,
    ShieldCheck,
    Sparkles,
    Sun,
    WandSparkles,
    X,
    Zap,
} from "lucide-react";
import { Brand, CompanyLogo, Modal, Toast } from "./components/UI";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import Discover from "./pages/Discover";
import { useApp } from "./store";
import { formatDate } from "./lib/state";
import type { Page } from "./types";
const Tracker = lazy(() => import("./pages/Tracker"));
const Resumes = lazy(() => import("./pages/Resumes"));
const Settings = lazy(() => import("./pages/Settings"));
const JobDetail = lazy(() => import("./pages/JobDetail"));

const navItems = [
    { page: "discover" as Page, label: "Discover", mobile: "Discover", icon: Compass },
    { page: "tracker" as Page, label: "My applications", mobile: "My tracker", icon: BriefcaseBusiness },
    { page: "resumes" as Page, label: "My resumes", mobile: "Resumes", icon: FileText },
    { page: "settings" as Page, label: "Settings", mobile: "Settings", icon: Settings2 },
];
function readRoute() {
    const [name, rawId] = window.location.hash.slice(1).split("/");
    let id: string | undefined = rawId;
    try {
        id = rawId ? decodeURIComponent(rawId) : undefined;
    } catch {
        id = undefined;
    }
    return { page: (["discover", "tracker", "resumes", "settings", "job"].includes(name) ? name : "discover") as Page | "job", id };
}
export default function App() {
    const { state, toastMessage, toast, applyJob, createCustomResume, setTheme } = useApp();
    const [route, setRoute] = useState(readRoute);
    const [search, setSearch] = useState("");
    const [authOpen, setAuthOpen] = useState(false);
    const [onboardingOpen, setOnboardingOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [applyTarget, setApplyTarget] = useState<{ jobId: string; resumeId: string } | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const detailSource = useRef<Page>("discover");
    const contentRef = useRef<HTMLElement>(null);
    useEffect(() => {
        function onHash() {
            setRoute(readRoute());
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0 });
        }
        window.addEventListener("hashchange", onHash);
        function onKey(event: KeyboardEvent) {
            if ((event.ctrlKey || event.metaKey) && event.key === "k") {
                event.preventDefault();
                searchRef.current?.focus();
            }
        }
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("hashchange", onHash);
            window.removeEventListener("keydown", onKey);
        };
    }, []);
    useEffect(() => {
        document.title = `${route.page === "job" ? "Opportunity" : (navItems.find((item) => item.page === route.page)?.label ?? "Discover")} · HirePower`;
    }, [route]);
    function navigate(page: Page, saved = false) {
        window.location.hash = `${page}${page === "tracker" && saved ? "/saved" : ""}`;
        setMobileMenuOpen(false);
    }
    function openJob(jobId: string) {
        if (route.page !== "job") detailSource.current = route.page;
        window.location.hash = `job/${encodeURIComponent(jobId)}`;
    }
    function customize(jobId: string) {
        if (state.applications.some((app) => app.jobId === jobId && app.appliedDate)) {
            toast("This job is already in your application tracker.");
            return;
        }
        const resume = createCustomResume(jobId);
        window.location.hash = `resumes/${resume.id}`;
    }
    function requestApply(jobId: string, resumeId = "master") {
        setApplyTarget({ jobId, resumeId });
    }
    const appliedCount = state.applications.filter((app) => app.appliedDate).length;
    const savedCount = state.applications.filter((app) => app.saved).length;
    const notifications = state.applications
        .flatMap((app) => app.notifications.map((notification) => ({ ...notification, job: state.jobs.find((job) => job.id === app.jobId)! })))
        .filter((item) => item.job)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const initials =
        state.profile.fullName
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "HP";
    const activePage = route.page === "job" ? detailSource.current : route.page;
    const targetJob = state.jobs.find((job) => job.id === applyTarget?.jobId);
    const targetResume = state.resumes.find((resume) => resume.id === applyTarget?.resumeId);
    const canApply = !!targetResume?.contact.fullName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetResume?.contact.email ?? "");
    return (
        <div className="app-shell">
            <a
                className="skip-link"
                href="#main-content"
                onClick={(event) => {
                    event.preventDefault();
                    contentRef.current?.focus();
                }}
            >
                Skip to content
            </a>
            {mobileMenuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
            <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`} aria-label="Main navigation">
                <a href="#discover" className="brand-link" aria-label="HirePower home">
                    <Brand />
                </a>
                <div className="workspace-label">
                    <span className="workspace-dot" />
                    YOUR NEXT CHAPTER
                </div>
                <nav className="desktop-nav">
                    {navItems.slice(0, 3).map((item) => (
                        <a
                            href={`#${item.page}`}
                            key={item.page}
                            className={`nav-item ${activePage === item.page && !(item.page === "tracker" && route.id === "saved") ? "active" : ""}`}
                            aria-current={activePage === item.page && route.id !== "saved" ? "page" : undefined}
                        >
                            <item.icon size={19} />
                            <span>{item.label}</span>
                            {item.page === "tracker" && <span className="nav-count">{appliedCount}</span>}
                            {item.page === "discover" && <span className="nav-active-dot" />}
                        </a>
                    ))}
                    <a
                        href="#tracker/saved"
                        className={`nav-item ${route.page === "tracker" && route.id === "saved" ? "active" : ""}`}
                        aria-current={route.page === "tracker" && route.id === "saved" ? "page" : undefined}
                    >
                        <Bookmark size={19} />
                        <span>Saved for later</span>
                        <span className="nav-count">{savedCount}</span>
                    </a>
                </nav>
                <div className="sidebar-divider" />
                <div className="sidebar-small-label">MAKE IT YOURS</div>
                <nav className="desktop-nav">
                    <a
                        href="#settings"
                        className={`nav-item ${activePage === "settings" ? "active" : ""}`}
                        aria-current={activePage === "settings" ? "page" : undefined}
                    >
                        <Settings2 size={19} />
                        <span>Settings</span>
                    </a>
                    <button className="nav-item" onClick={() => setHelpOpen(true)}>
                        <HelpCircle size={19} />
                        <span>A little guidance</span>
                        <ArrowUpRight size={14} />
                    </button>
                </nav>
                <div className="sidebar-bottom">
                    <div className="sidebar-pep-talk">
                        <span className="pep-star">✳</span>
                        <h3>
                            Big things start
                            <br />
                            with a little spark.
                        </h3>
                        <p>
                            You bring the ambition.
                            <br />
                            We’ll bring the possibilities.
                        </p>
                        <button onClick={() => setOnboardingOpen(true)}>
                            Find your direction
                            <ArrowUpRight size={15} />
                        </button>
                    </div>
                    <div className="theme-sidebar">
                        <span>
                            {state.theme === "light" ? <Sun size={15} /> : <Moon size={15} />}
                            {state.theme === "light" ? "A little sunshine" : "After hours"}
                        </span>
                        <button
                            className={`toggle toggle-small ${state.theme === "dark" ? "on" : ""}`}
                            role="switch"
                            aria-label="Dark mode"
                            aria-checked={state.theme === "dark"}
                            onClick={() => setTheme(state.theme === "dark" ? "light" : "dark")}
                        >
                            <span />
                        </button>
                    </div>
                    <button className="sidebar-profile" onClick={() => (state.session ? navigate("settings") : setAuthOpen(true))}>
                        <span className="avatar">{initials}</span>
                        <span>
                            <b>{state.profile.fullName || "Your workspace"}</b>
                            <small>{state.session ? "Demo account" : "Your personal workspace"}</small>
                        </span>
                        <ChevronDown size={15} />
                    </button>
                </div>
            </aside>
            <div className="workspace">
                <header className="topbar">
                    <div className="topbar-breadcrumb">
                        <button
                            className="icon-button mobile-menu-button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Open navigation"
                            aria-expanded={mobileMenuOpen}
                        >
                            <Menu size={21} />
                        </button>
                        <span className="desktop-breadcrumb">
                            Your workspace
                            <ChevronRight size={13} />
                            <b>{route.page === "job" ? "Opportunity" : navItems.find((item) => item.page === route.page)?.label}</b>
                        </span>
                        <a className="mobile-brand" href="#discover">
                            <Brand compact />
                        </a>
                    </div>
                    <div className="topbar-actions">
                        <label className="global-search">
                            <Search size={17} />
                            <input
                                ref={searchRef}
                                type="search"
                                placeholder="Find your next opportunity..."
                                aria-label="Search jobs and companies"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    if (route.page !== "discover") navigate("discover");
                                }}
                            />
                            <kbd>⌘ K</kbd>
                        </label>
                        <button
                            className="icon-button notification-button"
                            onClick={() => setNotificationsOpen(true)}
                            aria-label={`Notifications, ${notifications.length} demo updates`}
                        >
                            <Bell size={20} />
                            {notifications.length > 0 && <span />}
                        </button>
                        <span className="topbar-divider" />
                        {!state.session && (
                            <button className="login-button" onClick={() => setAuthOpen(true)}>
                                Log in
                                <ArrowUpRight size={13} />
                            </button>
                        )}
                        <button
                            className="avatar topbar-avatar"
                            aria-label={state.session ? "Open your profile" : "Log in or register"}
                            onClick={() => (state.session ? navigate("settings") : setAuthOpen(true))}
                        >
                            {initials}
                        </button>
                    </div>
                </header>
                <main id="main-content" tabIndex={-1} ref={contentRef} className="main-content">
                    <Suspense
                        fallback={
                            <div className="page-loading">
                                <span className="loading-spinner" />
                                <p>Getting your next chapter ready…</p>
                            </div>
                        }
                    >
                        {route.page === "discover" && (
                            <Discover
                                search={search}
                                onClearSearch={() => setSearch("")}
                                onNavigate={navigate}
                                onOpenJob={openJob}
                                onApply={requestApply}
                                onCustomize={customize}
                                onOnboard={() => setOnboardingOpen(true)}
                            />
                        )}
                        {route.page === "tracker" && <Tracker onOpenJob={openJob} initialTab={route.id === "saved" ? "saved" : "all"} />}
                        {route.page === "resumes" && (
                            <Resumes
                                selectedResumeId={route.id ?? null}
                                onSelectResume={(id) => {
                                    window.location.hash = id ? `resumes/${id}` : "resumes";
                                }}
                                onApplyCustom={requestApply}
                            />
                        )}
                        {route.page === "settings" && <Settings onLogin={() => setAuthOpen(true)} />}
                        {route.page === "job" && (
                            <JobDetail jobId={route.id ?? ""} onBack={() => navigate(detailSource.current)} onCustomize={customize} onApply={requestApply} />
                        )}
                    </Suspense>
                </main>
                <footer className="workspace-footer">
                    <span>Made for the next version of you.</span>
                    <span>
                        <Brand compact />
                        HIREPOWER © {new Date().getFullYear()}
                    </span>
                    <button onClick={() => setHelpOpen(true)}>
                        Demo workspace
                        <Info size={12} />
                    </button>
                </footer>
            </div>
            <nav className="bottom-nav" aria-label="Bottom toolbar">
                {navItems.map((item) => (
                    <a
                        key={item.page}
                        href={`#${item.page}`}
                        className={activePage === item.page ? "active" : ""}
                        aria-current={activePage === item.page ? "page" : undefined}
                    >
                        <item.icon size={21} />
                        <span>{item.mobile}</span>
                        {activePage === item.page && <i />}
                    </a>
                ))}
            </nav>
            <Toast message={toastMessage} />
            {authOpen && (
                <Auth
                    onClose={() => setAuthOpen(false)}
                    onRegistered={() => {
                        setAuthOpen(false);
                        setOnboardingOpen(true);
                    }}
                />
            )}
            {onboardingOpen && <Onboarding onClose={() => setOnboardingOpen(false)} />}
            {applyTarget && targetJob && targetResume && (
                <Modal title="One small step. A new possibility." onClose={() => setApplyTarget(null)}>
                    <div className="apply-job-summary">
                        <CompanyLogo job={targetJob} size="lg" />
                        <div>
                            <span className="muted">{targetJob.company}</span>
                            <h3>{targetJob.position}</h3>
                            <p>
                                {targetJob.location} · {targetJob.workplace}
                            </p>
                        </div>
                    </div>
                    <div className="apply-resume-summary">
                        <span className="settings-icon">
                            <FileText size={23} />
                        </span>
                        <div>
                            <b>{targetResume.jobId ? "Your tailored resume" : "Your master resume"}</b>
                            <span>{targetResume.contact.fullName} · Harvard format</span>
                        </div>
                        <span className="badge">
                            <Check size={12} />
                            Ready
                        </span>
                    </div>
                    <p className="modal-description">
                        {targetResume.jobId
                            ? "A resume that tells the right story for this opportunity."
                            : "Your master resume will be linked to this application. Want to make it more personal? Use Apply custom to tailor a separate copy."}
                    </p>
                    <div className="notice">
                        <ShieldCheck size={20} />
                        <p>
                            <b>Demo application, real organization.</b> This adds the job to your local tracker with an Applied status and today’s date. No
                            application or resume is sent to {targetJob.company}. Employer submission requires the Django backend.
                        </p>
                    </div>
                    {!canApply && (
                        <p className="form-error" role="alert">
                            Add your name and a valid email to this resume before applying.
                        </p>
                    )}
                    <div className="modal-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setApplyTarget(null);
                                window.location.hash = `resumes/${targetResume.id}`;
                            }}
                        >
                            <FileText size={15} />
                            Review resume
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={!canApply}
                            onClick={() => {
                                applyJob(targetJob.id, targetResume.id);
                                setApplyTarget(null);
                            }}
                        >
                            Apply & track
                            <ArrowUpRight size={16} />
                        </button>
                    </div>
                </Modal>
            )}
            {notificationsOpen && (
                <Modal title="A little news for your next chapter" onClose={() => setNotificationsOpen(false)}>
                    <p className="modal-description">
                        Your application activity, all in one place. These are local demo notifications, not messages received from employers.
                    </p>
                    <div className="notifications-list">
                        {notifications.length ? (
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => {
                                        setNotificationsOpen(false);
                                        openJob(notification.job.id);
                                    }}
                                >
                                    <CompanyLogo job={notification.job} size="sm" />
                                    <span>
                                        <b>{notification.title}</b>
                                        <p>
                                            {notification.job.company} · {notification.job.position}
                                        </p>
                                        <small>
                                            {formatDate(notification.date)} · {notification.channel}
                                        </small>
                                    </span>
                                    <ChevronRight size={16} />
                                </button>
                            ))
                        ) : (
                            <p className="muted">You’re all caught up. Application activity will appear here.</p>
                        )}
                    </div>
                </Modal>
            )}
            {helpOpen && (
                <Modal title="A little momentum goes a long way." onClose={() => setHelpOpen(false)}>
                    <div className="help-intro">
                        <Brand />
                        <p>Your Canadian tech career, with a little more possibility and a lot less tab overload.</p>
                    </div>
                    <div className="help-steps">
                        {[
                            {
                                icon: Compass,
                                title: "Find your kind of opportunity",
                                text: "Explore admin-curated jobs, filter your feed, and save the ones that catch your eye.",
                            },
                            {
                                icon: WandSparkles,
                                title: "Tell a story that fits",
                                text: "Build a Harvard-style master resume, then tailor a separate copy for a specific job.",
                            },
                            {
                                icon: BriefcaseBusiness,
                                title: "Keep your next chapter in view",
                                text: "Track every application from Applied through Interview, Offer, and beyond.",
                            },
                        ].map((item) => (
                            <div key={item.title}>
                                <span>
                                    <item.icon size={20} />
                                </span>
                                <div>
                                    <h3>{item.title}</h3>
                                    <p>{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="notice">
                        <Info size={19} />
                        <p>
                            This is a frontend-only demo. Jobs, salary ranges, and match scores are illustrative. Data stays in this browser; authentication,
                            employer submissions, PDF/DOCX extraction, and real notifications need Django integration.
                        </p>
                    </div>
                    <button
                        className="btn btn-primary help-cta"
                        onClick={() => {
                            setHelpOpen(false);
                            setOnboardingOpen(true);
                        }}
                    >
                        Make it yours
                        <ArrowRight size={16} />
                    </button>
                </Modal>
            )}
        </div>
    );
}
