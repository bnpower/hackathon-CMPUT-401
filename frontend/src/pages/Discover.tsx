import { useMemo, useState } from "react";
import {
    ArrowDown,
    ArrowRight,
    ArrowUpRight,
    Bookmark,
    BriefcaseBusiness,
    Check,
    CheckCheck,
    ChevronDown,
    ChevronRight,
    Clock3,
    Code2,
    Coffee,
    FileText,
    Globe2,
    Leaf,
    MapPin,
    Monitor,
    MousePointer2,
    MoveUpRight,
    SlidersHorizontal,
    Sparkles,
    Target,
    TrendingUp,
    WandSparkles,
    X,
    Zap,
} from "lucide-react";
import { CompanyLogo, EmptyState, Modal, SaveButton, StatusBadge } from "../components/UI";
import { useApp } from "../store";
import { LEVELS, LOCATIONS, type Job, type Page } from "../types";
import { formatDate } from "../lib/state";

interface DiscoverProps {
    search: string;
    onClearSearch: () => void;
    onNavigate: (page: Page, saved?: boolean) => void;
    onOpenJob: (jobId: string) => void;
    onApply: (jobId: string) => void;
    onCustomize: (jobId: string) => void;
    onOnboard: () => void;
}
const CATEGORIES = ["For you", "Backend", "Frontend", "Fullstack", "DevOps", "Data & AI"];
function postedLabel(date: string) {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    return days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
}
export default function Discover({ search, onClearSearch, onNavigate, onOpenJob, onApply, onCustomize, onOnboard }: DiscoverProps) {
    const { state, saveJob } = useApp();
    const [category, setCategory] = useState("For you");
    const [sort, setSort] = useState("recommended");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [locations, setLocations] = useState<string[]>([]);
    const [levels, setLevels] = useState<string[]>([]);
    const [remoteOnly, setRemoteOnly] = useState(false);
    const filterCount = locations.length + levels.length + Number(remoteOnly);
    const jobs = useMemo(() => {
        const query = search.trim().toLowerCase();
        const ranked = state.jobs.filter(
            (job) =>
                (!query || `${job.company} ${job.position} ${job.skills.join(" ")}`.toLowerCase().includes(query)) &&
                (category === "For you" || job.department === category) &&
                (!locations.length || locations.includes(job.location)) &&
                (!levels.length || levels.includes(job.level)) &&
                (!remoteOnly || job.workplace === "Remote"),
        );
        const score = (job: Job) =>
            job.match +
            (state.profile.positions.includes(job.department) ? 8 : 0) +
            (state.profile.locations.includes(job.location) ? 5 : 0) +
            (state.profile.levels.includes(job.level) ? 3 : 0);
        return ranked.sort((a, b) => (sort === "newest" ? new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime() : score(b) - score(a)));
    }, [state.jobs, state.profile, search, category, locations, levels, remoteOnly, sort]);
    const applied = state.applications.filter((app) => app.appliedDate);
    const interviews = applied.filter((app) => app.status === "Interview").length;
    const offers = applied.filter((app) => app.status === "Offer" || app.status === "Accepted").length;
    const weekCount = applied.filter((app) => Date.now() - new Date(app.appliedDate!).getTime() < 7 * 86400000).length;
    const master = state.resumes.find((resume) => resume.id === "master")!;
    const readiness = Math.round(
        ([
            !!master.contact.fullName,
            !!master.contact.email,
            ...Object.values(master.sections).map((entries) => entries.some((entry) => entry.visible && entry.title.trim())),
        ].filter(Boolean).length /
            6) *
            100,
    );
    const clearFilters = () => {
        setLocations([]);
        setLevels([]);
        setRemoteOnly(false);
        setCategory("For you");
        onClearSearch();
    };
    const toggle = (value: string, list: string[], set: (next: string[]) => void) =>
        set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    return (
        <div className="discover-page">
            <section className="discover-heading">
                <div>
                    <div className="eyebrow">
                        <span className="live-dot" />
                        GOOD THINGS ARE AHEAD
                    </div>
                    <h1>
                        Your next chapter.
                        <br />
                        <span>A little more you.</span>
                        <span className="heading-spark">✳</span>
                    </h1>
                    <p>Less job hunting. More finding your thing.</p>
                </div>
                <div className="hero-art" aria-hidden="true">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <span className="art-star star-one">✦</span>
                    <span className="art-star star-two">✳</span>
                    <div className="art-card art-card-back">
                        <Code2 size={31} />
                        <span />
                    </div>
                    <div className="art-card art-card-front">
                        <span className="art-check">
                            <Check size={26} strokeWidth={3} />
                        </span>
                        <div>
                            <b>It’s a match.</b>
                            <span>Your future looks good.</span>
                        </div>
                        <span className="art-confetti">✧</span>
                    </div>
                    <span className="art-cursor">
                        <MousePointer2 size={30} fill="currentColor" />
                        <small>Your next move</small>
                    </span>
                </div>
            </section>
            <div className="discover-layout">
                <section className="feed-column" aria-label="Discover jobs">
                    <div className="feed-title-row">
                        <h2>
                            Made for your next move <Sparkles size={17} />
                        </h2>
                        <span className="job-count">{jobs.length} opportunities</span>
                    </div>
                    <div className="feed-tabs" role="group" aria-label="Filter by position">
                        {CATEGORIES.map((item) => (
                            <button
                                key={item}
                                className={`feed-tab ${category === item ? "active" : ""}`}
                                onClick={() => setCategory(item)}
                                aria-pressed={category === item}
                            >
                                {item === "For you" && <Sparkles size={14} />}
                                {item}
                            </button>
                        ))}
                    </div>
                    <div className="feed-filter-row">
                        <button className={`filter-button ${filterCount ? "filter-active" : ""}`} onClick={() => setFiltersOpen(true)}>
                            <SlidersHorizontal size={15} />
                            Filters{filterCount > 0 && <span className="filter-count">{filterCount}</span>}
                        </button>
                        <span className="feed-location">
                            <MapPin size={13} />
                            Across Canada
                        </span>
                        <label className="sort-control">
                            <span>Sort by:</span>
                            <select aria-label="Sort job feed" value={sort} onChange={(event) => setSort(event.target.value)}>
                                <option value="recommended">Recommended</option>
                                <option value="newest">Newest first</option>
                            </select>
                            <ChevronDown size={13} />
                        </label>
                    </div>
                    {search && (
                        <div className="search-summary">
                            Results for “{search}”
                            <button className="text-button" onClick={onClearSearch}>
                                <X size={13} />
                                Clear
                            </button>
                        </div>
                    )}
                    <div className="job-feed">
                        {jobs.map((job, index) => {
                            const application = state.applications.find((app) => app.jobId === job.id);
                            return (
                                <article className="job-card" key={job.id} style={{ animationDelay: `${Math.min(index, 3) * 65}ms` }}>
                                    {job.featured && (
                                        <div className="featured-strip">
                                            <span>
                                                <Zap size={13} fill="currentColor" />A little extra potential
                                            </span>
                                            <span>
                                                FEATURED OPPORTUNITY
                                                <ArrowUpRight size={13} />
                                            </span>
                                        </div>
                                    )}
                                    <div className="job-card-body">
                                        <div className="job-card-top">
                                            <button
                                                className="company-link"
                                                onClick={() => onOpenJob(job.id)}
                                                aria-label={`View ${job.position} at ${job.company}`}
                                            >
                                                <CompanyLogo job={job} />
                                                <span>
                                                    <b>
                                                        {job.company}
                                                        <span className="verified-icon">
                                                            <Check size={8} strokeWidth={3} />
                                                        </span>
                                                    </b>
                                                    <span>
                                                        {postedLabel(job.postedAt)}
                                                        <span className="tiny-dot">·</span>
                                                        {job.workplace === "Remote" ? "Remote-friendly" : "Actively hiring"}
                                                    </span>
                                                </span>
                                            </button>
                                            <div className="match-badge" title="Illustrative match score in the demo dataset">
                                                <Sparkles size={12} />
                                                {job.match}% match
                                            </div>
                                        </div>
                                        <button className="job-title-button" onClick={() => onOpenJob(job.id)}>
                                            <h3>{job.position}</h3>
                                            <ArrowUpRight size={20} />
                                        </button>
                                        <div className="job-meta">
                                            <span>
                                                <MapPin size={14} />
                                                {job.location}
                                            </span>
                                            <span>
                                                <BriefcaseBusiness size={14} />
                                                {job.level}
                                            </span>
                                            <span>
                                                <Monitor size={14} />
                                                {job.workplace}
                                            </span>
                                        </div>
                                        <p className="job-description">{job.description}</p>
                                        <div className="skill-tags">
                                            {job.skills.map((skill) => (
                                                <span key={skill}>{skill}</span>
                                            ))}
                                        </div>
                                        <div className="job-card-details">
                                            <span className="job-salary">
                                                {job.salary}
                                                <small>CAD{job.salary.includes("/ hr") ? "" : " / year"}</small>
                                            </span>
                                            <button className="text-button requirements-link" onClick={() => onOpenJob(job.id)}>
                                                View requirements
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                        {application?.appliedDate && (
                                            <div className="feed-application-info">
                                                <StatusBadge status={application.status} />
                                                <span>
                                                    Applied {formatDate(application.appliedDate, { month: "short", day: "numeric" })} ·{" "}
                                                    {application.resumeId === "master" ? "Master resume" : "Custom resume"}
                                                </span>
                                            </div>
                                        )}
                                        <div className="job-actions">
                                            <button
                                                className="btn btn-primary apply-button"
                                                onClick={() => (application?.appliedDate ? onOpenJob(job.id) : onApply(job.id))}
                                            >
                                                {application?.appliedDate ? (
                                                    <>
                                                        <CheckCheck size={17} />
                                                        View application
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap size={16} />
                                                        Apply now
                                                        <ArrowUpRight size={16} />
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-secondary custom-apply"
                                                onClick={() => onCustomize(job.id)}
                                                disabled={!!application?.appliedDate}
                                            >
                                                <WandSparkles size={16} />
                                                <span>Apply custom</span>
                                            </button>
                                            <SaveButton saved={application?.saved ?? false} onClick={() => saveJob(job.id)} />
                                        </div>
                                        {index === 0 && !application?.appliedDate && (
                                            <div className="apply-note">
                                                <FileText size={11} />
                                                One good resume. A world of possibilities. Uses your master resume.
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                        {!jobs.length && (
                            <div className="panel">
                                <EmptyState
                                    icon={<BriefcaseBusiness size={28} />}
                                    title="Your next thing is out there."
                                    description="Try a different search or broaden your filters to discover more opportunities."
                                    action={
                                        <button className="btn btn-primary" onClick={clearFilters}>
                                            Reset filters
                                        </button>
                                    }
                                />
                            </div>
                        )}
                        {!!jobs.length && (
                            <div className="feed-end">
                                <span>
                                    <Check size={17} />
                                </span>
                                <b>You’re all caught up.</b>
                                <p>Great things take a little scrolling. Check back for new opportunities.</p>
                                <button className="text-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                                    Back to the top
                                    <ArrowUpRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </section>
                <aside className="insights-column" aria-label="Your job search insights">
                    <section className="profile-card panel">
                        <div className="rail-heading">
                            <span>YOUR CAREER TOOLKIT</span>
                            <span className="little-spark">✳</span>
                        </div>
                        <div className="resume-health">
                            <div className="progress-ring" style={{ "--progress": `${readiness}%` } as React.CSSProperties}>
                                <span>
                                    <b>
                                        {readiness}
                                        <small>%</small>
                                    </b>
                                </span>
                            </div>
                            <div>
                                <h3>Ready when you are.</h3>
                                <p>
                                    Your master resume is
                                    <br />
                                    looking sharp.
                                </p>
                            </div>
                        </div>
                        <div className="resume-ready">
                            <span>
                                <Check size={13} />
                                Harvard format
                            </span>
                            <span>
                                <Check size={13} />
                                ATS-friendly layout
                            </span>
                        </div>
                        <button className="btn btn-secondary rail-wide-button" onClick={() => onNavigate("resumes")}>
                            <FileText size={15} />
                            Give your resume some love
                            <ArrowUpRight size={15} />
                        </button>
                    </section>
                    <section className="pipeline-card panel">
                        <div className="section-heading">
                            <h3>Your momentum</h3>
                            <TrendingUp size={17} />
                        </div>
                        <p className="rail-description">Little steps. Big possibilities.</p>
                        <div className="pipeline-stats">
                            <button onClick={() => onNavigate("tracker")}>
                                <b>{String(applied.length).padStart(2, "0")}</b>
                                <span>
                                    <span className="stat-dot applied-dot" />
                                    Applied
                                </span>
                            </button>
                            <button onClick={() => onNavigate("tracker")}>
                                <b>{String(interviews).padStart(2, "0")}</b>
                                <span>
                                    <span className="stat-dot interview-dot" />
                                    Interview
                                </span>
                            </button>
                            <button onClick={() => onNavigate("tracker")}>
                                <b>{String(offers).padStart(2, "0")}</b>
                                <span>
                                    <span className="stat-dot offer-dot" />
                                    Offers
                                </span>
                            </button>
                        </div>
                        <button className="rail-link" onClick={() => onNavigate("tracker")}>
                            Keep an eye on your applications
                            <ArrowRight size={15} />
                        </button>
                    </section>
                    <section className="weekly-card panel">
                        <div className="section-heading">
                            <h3>
                                <Target size={17} />
                                One step at a time
                            </h3>
                            <span className="weekly-badge">THIS WEEK</span>
                        </div>
                        <p>
                            You’ve put yourself out there <b>{weekCount} times.</b>
                            <br />
                            That’s {weekCount >= state.profile.weeklyGoal ? "a goal worth celebrating." : "something to feel good about."}
                        </p>
                        <div className="goal-label">
                            <span>Weekly application goal</span>
                            <b>
                                {weekCount}
                                <span> / {state.profile.weeklyGoal}</span>
                            </b>
                        </div>
                        <div className="goal-track">
                            <div style={{ width: `${Math.min(100, (weekCount / state.profile.weeklyGoal) * 100)}%` }} />
                        </div>
                        <div className="goal-footer">
                            <span>
                                Keep that good energy going <Zap size={11} fill="currentColor" />
                            </span>
                            <button className="text-button" onClick={() => onNavigate("settings")}>
                                Edit goal
                            </button>
                        </div>
                    </section>
                    <section className="tip-card">
                        <span className="tip-label">
                            <span>✦</span> A LITTLE INSIDE SCOOP
                        </span>
                        <h3>
                            You’re more than
                            <br />a list of skills.
                        </h3>
                        <p>A tailored resume tells your story. Highlight the projects and experiences that make you, you.</p>
                        <button onClick={() => onNavigate("resumes")}>
                            Make it personal
                            <MoveUpRight size={16} />
                        </button>
                        <div className="tip-doodle" aria-hidden="true">
                            ✳
                        </div>
                    </section>
                    {!state.onboarded && (
                        <button className="personalize-link" onClick={onOnboard}>
                            <SlidersHorizontal size={16} />
                            <span>
                                A feed that gets you.
                                <b>
                                    Fine-tune your preferences
                                    <ArrowUpRight size={13} />
                                </b>
                            </span>
                        </button>
                    )}
                    <div className="rail-footer">
                        <span>
                            <Leaf size={13} />
                            Built for your Canadian tech career.
                        </span>
                        <p>A little ambition. A lot of HirePower.</p>
                        <span className="demo-footnote">Demo jobs · Illustrative matches & salaries</span>
                    </div>
                </aside>
            </div>
            {filtersOpen && (
                <Modal title="Find your kind of opportunity" onClose={() => setFiltersOpen(false)}>
                    <p className="modal-description">A few preferences to point your next chapter in the right direction.</p>
                    <div className="filter-group">
                        <h3>Where would you like to work?</h3>
                        <div className="choice-grid">
                            {LOCATIONS.map((location) => (
                                <button
                                    key={location}
                                    className={`choice-chip ${locations.includes(location) ? "selected" : ""}`}
                                    aria-pressed={locations.includes(location)}
                                    onClick={() => toggle(location, locations, setLocations)}
                                >
                                    <MapPin size={13} />
                                    {location}
                                    {locations.includes(location) && <Check size={13} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <h3>What are you looking for?</h3>
                        <div className="choice-grid">
                            {LEVELS.map((level) => (
                                <button
                                    key={level}
                                    className={`choice-chip ${levels.includes(level) ? "selected" : ""}`}
                                    aria-pressed={levels.includes(level)}
                                    onClick={() => toggle(level, levels, setLevels)}
                                >
                                    {level}
                                    {levels.includes(level) && <Check size={13} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <label className="checkbox-label">
                        <input type="checkbox" checked={remoteOnly} onChange={(event) => setRemoteOnly(event.target.checked)} />
                        Remote opportunities only
                    </label>
                    <div className="modal-actions">
                        <button className="btn btn-ghost" onClick={clearFilters}>
                            Reset filters
                        </button>
                        <button className="btn btn-primary" onClick={() => setFiltersOpen(false)}>
                            Show {jobs.length} opportunities
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
