import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  BriefcaseBusiness,
  LayoutGrid,
  FileText,
  MessageSquare,
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
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./styles.css";
import "./personality.css";
import "./readability.css";
import ResumeUploads from "./ResumeUploads";

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
  3: [
    "About the job",
    "Mostly asking people if they saw the message you sent them.",
    "Must be available for a meeting about reducing meetings.",
  ],
  4: [
    "About the job",
    "You will be going outside. We can lend you a jacket.",
    "Shoes required. We did not think we needed to specify this.",
  ],
  5: [
    "About the job",
    "It works on Kevin's laptop. Kevin has left the company.",
    "Find Kevin or fix the build. Either is fine.",
  ],
  6: [
    "About the job",
    "We liked the first version. Can you send that again?",
    "Must keep files named final, final2, and actually_final organized.",
  ],
  7: [
    "About the job",
    "The meeting ended 20 minutes ago and you are still talking. You're hired.",
    "Must be able to turn 'ok' into a 200-word email.",
  ],
  8: [
    "About the job",
    "Our entire financial model is in Sheet1 (copy) (2).",
    "Know what a pivot table is before the interview, preferably.",
  ],
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
const stageMemes = {
  Applied: ["image-folder/01.png", "Unimpressed character waiting patiently", "sent it. now we wait."],
  Interview: ["image-folder/03.png", "Serious character in a suit with folded hands", "time to explain the resume lore"],
  Offer: ["image-folder/07.png", "Character giving an enthusiastic thumbs-up", "the employment arc is real"],
  Rejection: ["image-folder/02.png", "Character dramatically crying rivers of tears", "their loss. next side quest."],
};
const responseMemes = {
  "Interview invitation": ["image-folder/08.png", "Wide-eyed character screaming", "THEY WANT TO TALK TO ME?"],
  "Job offer": stageMemes.Offer,
  Rejection: stageMemes.Rejection,
  "Follow-up": ["image-folder/04.png", "Determined character raising a fist", "politely asking for the lore update"],
  Other: stageMemes.Applied,
};
function ReactionMeme({ meme, className = "" }) {
  return (
    <figure className={`tab-meme ${className}`}>
      <img src={`/memes/${meme[0]}`} alt={meme[1]} loading="lazy" />
      <figcaption>{meme[2]}</figcaption>
    </figure>
  );
}
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
function App() {
  const [tab, setTab] = useState("Jobs"),
    [query, setQuery] = useState(""),
    [mode, setMode] = useState("All locations"),
    [type, setType] = useState("All job types"),
    [page, setPage] = useState(1),
    [savedOnly, setSavedOnly] = useState(false),
    [modal, setModal] = useState(null),
    [notice, setNotice] = useState(""),
    [brainrotOpen, setBrainrotOpen] = useState(false);
  // Keep the original storage keys so the rebrand preserves existing user edits.
  const [saved, setSaved, savedError] = useSaved("sprout-saved", []),
    [applications, setApplications, appsError] = useSaved(
      "sprout-applications",
      initialApplications,
    ),
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
  const [activeDragId, setActiveDragId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const draggedApplication = applications.find((a) => a.id === activeDragId);
  function handleDragEnd(event) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeApp = applications.find((a) => a.id === active.id);
    if (!activeApp) return;
    const overApp = applications.find((a) => a.id === over.id);
    const targetStatus = overApp
      ? overApp.status
      : String(over.id).startsWith("col-")
        ? String(over.id).slice(4)
        : null;
    if (!targetStatus) return;
    const withoutActive = applications.filter((a) => a.id !== active.id);
    const moved = { ...activeApp, status: targetStatus };
    if (overApp) {
      const overIndex = withoutActive.findIndex((a) => a.id === over.id);
      const next = [...withoutActive];
      next.splice(overIndex, 0, moved);
      setApplications(next);
    } else {
      setApplications([...withoutActive, moved]);
    }
  }
  const filtered = jobs.filter(
    (j) =>
      `${j.title} ${j.company} ${j.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (mode === "All locations" || j.mode === mode) &&
      (type === "All job types" || j.type === type) &&
      (!savedOnly || saved.includes(j.id)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 6)),
    currentPage = Math.min(page, totalPages),
    activeResume = resumes.find((r) => r.id === resumeId) || resumes[0];
  const upcoming = applications
    .filter((a) => a.followUp && !["Offer", "Rejection"].includes(a.status))
    .sort((a, b) => a.followUp.localeCompare(b.followUp));
  function navigate(next) {
    setTab(next);
    setNotice("");
  }
  function track(job) {
    setModal({ kind: "application", job });
  }
  function submitApplication(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    setApplications([...applications, { ...data, id: Date.now() }]);
    setModal(null);
    setNotice("Application added to your tracker.");
  }
  function downloadResume() {
    const url = URL.createObjectURL(
      new Blob([activeResume.content], { type: "text/plain" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeResume.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
          <span className="brand-icon angel-logo">
            <img src="/memes/image.png" alt="" width="58" height="58" />
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
          <figcaption>
            does carrying the group project count as management experience
          </figcaption>
          <div className="thinking-crop">
            <img
              src="/memes/thinking-monkey.jpg"
              alt="Monkey looking up thoughtfully"
              width="800"
              height="699"
            />
          </div>
        </figure>
        <div className="profile">
          <div className="avatar">Y</div>
          <div>My workspace</div>
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
            <button
              className="icon-button"
              aria-label="View follow-up reminders"
              onClick={() => setModal({ kind: "reminders" })}
            >
              <Bell size={20} />
              {upcoming.length > 0 && <i />}
            </button>
            <div className="avatar small">Y</div>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <h1>
                {tab === "Jobs" ? "Here, jobs" : tab}
              </h1>
            </div>
            {tab !== "Jobs" && (
              <button
                className="primary"
                onClick={() =>
                  tab === "Applications"
                    ? track(null)
                    : tab === "Resumes"
                      ? setModal({ kind: "resume" })
                      : setModal({ kind: "message" })
                }
              >
                <Plus size={17} />
                {tab === "Applications"
                  ? "Add application"
                  : tab === "Resumes"
                    ? "Tailor a resume"
                    : "Log communication"}
              </button>
            )}
          </div>
          {(savedError || appsError || resumeError || messageError) && (
            <div role="alert" className="notice">
              Browser storage is unavailable. Your edits will last only for this
              session.
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              <Check size={16} />
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <button className="reminders-banner" onClick={() => setModal({ kind: "reminders" })}>
            <Bell size={28} aria-hidden="true" />
            <span><strong>{upcoming.length ? `${upcoming.length} follow-up${upcoming.length === 1 ? "" : "s"} on your radar` : "Your follow-up reminders"}</strong>
              <small>{upcoming.length ? `Next: ${upcoming[0].company} · ${upcoming[0].followUp}` : "Add a follow-up date in Applications to stay on track."}</small>
            </span>
            <span className="reminders-link">View reminders <ArrowRight size={20} /></span>
          </button>
          {tab === "Jobs" && (
            <>
              <section
                className="meme-board"
                aria-label="Job search mood board"
              >
                <div className="desktop-meme">
                  <div className="window-bar">
                    <span>cover_letter_final_FINAL.doc</span>
                    <span aria-hidden="true">_ □ ×</span>
                  </div>
                  <figure>
                    <figcaption>
                      “I have always been passionate about”
                    </figcaption>
                    <img
                      src="/memes/office-monkey.jpg"
                      alt="A bored monkey sitting at an office computer"
                      width="1000"
                      height="562"
                    />
                  </figure>
                </div>
                <figure className="recruiter-meme">
                  <figcaption>
                    “entry level”
                    <br />
                    <strong>3–5 years experience</strong>
                  </figcaption>
                  <img
                    src="/memes/nerd-cat.jpg"
                    alt="Cat wearing glasses with a raised finger"
                    width="279"
                    height="286"
                  />
                  <span className="pen-note" aria-hidden="true">
                    be serious.
                  </span>
                </figure>
              </section>
              <section className="stats" aria-label="Your application overview">
                {[
                  ["Applications sent", applications.length, BriefcaseBusiness],
                  [
                    "In conversation",
                    applications.filter((a) => a.status === "Interview").length,
                    MessageSquare,
                  ],
                  ["Saved opportunities", saved.length, Bookmark],
                ].map(([label, value, Icon]) => (
                  <button
                    className="stat"
                    key={label}
                    onClick={() =>
                      label === "Saved opportunities"
                        ? (setSavedOnly(true), setPage(1))
                        : navigate("Applications")
                    }
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
                      {savedOnly ? "Saved jobs" : "Listings"} <span className="count">{filtered.length}</span>
                    </h2>
                  </div>
                  <button
                    className={`saved-jobs-button ${savedOnly ? "is-active" : ""}`}
                    aria-pressed={savedOnly}
                    onClick={() => {
                      setSavedOnly(!savedOnly);
                      setPage(1);
                    }}
                  >
                    <Bookmark size={26} aria-hidden="true" fill={savedOnly ? "currentColor" : "none"} />
                    <span>{savedOnly ? "Show all jobs" : "View saved jobs"}</span>
                    <span className="saved-jobs-count" aria-label={`${saved.length} saved jobs`}>{saved.length}</span>
                    <ArrowRight size={22} aria-hidden="true" />
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
                      {["All locations", "Remote", "Hybrid", "On-site"].map(
                        (x) => (
                          <option key={x}>{x}</option>
                        ),
                      )}
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
                  {filtered
                    .slice((currentPage - 1) * 6, currentPage * 6)
                    .map((job) => (
                      <article className="job-card" key={job.id}>
                        <div className="job-sticker">
                          <span>{job.type}</span>
                          <span>#{String(job.id).padStart(3, "0")}</span>
                        </div>
                        <div className="card-top">
                          <div
                            className="company-logo"
                            style={{ background: job.color }}
                          >
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
                            onClick={() =>
                              setSaved(
                                saved.includes(job.id)
                                  ? saved.filter((id) => id !== job.id)
                                  : [...saved, job.id],
                              )
                            }
                          >
                            <Bookmark
                              size={19}
                              fill={
                                saved.includes(job.id) ? "currentColor" : "none"
                              }
                            />
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
                    Showing {filtered.length ? (currentPage - 1) * 6 + 1 : 0}–
                    {Math.min(currentPage * 6, filtered.length)} of{" "}
                    {filtered.length} opportunities
                  </span>
                  <div>
                    <button
                      aria-label="Previous page"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        aria-label={`Page ${i + 1}`}
                        aria-current={
                          currentPage === i + 1 ? "page" : undefined
                        }
                        className={currentPage === i + 1 ? "current" : ""}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      aria-label="Next page"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
          {tab === "Applications" && (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={(e) => {
                  console.log("DEBUG dragstart", e.active.id);
                  setActiveDragId(e.active.id);
                }}
                onDragOver={(e) =>
                  console.log("DEBUG dragover", e.active.id, "over:", e.over?.id)
                }
                onDragEnd={(e) => {
                  console.log("DEBUG dragend", e.active.id, "over:", e.over?.id);
                  handleDragEnd(e);
                }}
                onDragCancel={() => {
                  console.log("DEBUG dragcancel");
                  setActiveDragId(null);
                }}
              >
                <div className="board">
                  {stages.map((stage) => (
                    <BoardColumn
                      key={stage}
                      stage={stage}
                      apps={applications.filter((a) => a.status === stage)}
                      onStatusChange={(id, status) =>
                        setApplications(
                          applications.map((item) =>
                            item.id === id ? { ...item, status } : item,
                          ),
                        )
                      }
                      onFollowUpChange={(id, followUp) =>
                        setApplications(
                          applications.map((item) =>
                            item.id === id ? { ...item, followUp } : item,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
                <DragOverlay>
                  {draggedApplication && (
                    <article className="application-card drag-overlay-card">
                      <small>{draggedApplication.company}</small>
                      <h3>{draggedApplication.position}</h3>
                    </article>
                  )}
                </DragOverlay>
              </DndContext>
            </>
          )}
          {tab === "Resumes" && (
            <div>
              <ResumeUploads />
              <div className="resume-layout">
                <section className="resume-list">
                  <h2>Your resumes</h2>
                  {resumes.map((r) => (
                    <button
                      key={r.id}
                      className={
                        activeResume.id === r.id
                          ? "resume-choice selected"
                          : "resume-choice"
                      }
                      onClick={() => setResumeId(r.id)}
                    >
                      <FileText size={20} />
                      <span>
                        {r.name}
                        <small>
                          {r.master ? "Master template" : "Tailored copy"}
                        </small>
                      </span>
                    </button>
                  ))}
                  <p>
                    Edits save automatically in this browser. Download a copy to
                    keep it with you.
                  </p>
                  <ReactionMeme className="resume-meme" meme={["image-folder/06.png", "Character smiling mischievously", "me turning the group project into leadership experience"]} />
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
                    onChange={(e) =>
                      setResumes(
                        resumes.map((r) =>
                          r.id === activeResume.id
                            ? { ...r, content: e.target.value }
                            : r,
                        ),
                      )
                    }
                  />
                  <span className="editor-caption">
                    <Check size={14} />{" "}
                    {resumeError
                      ? "Saved for this session"
                      : "Saved in this browser"}
                  </span>
                </section>
              </div>
            </div>
          )}
          {tab === "Inbox" && (
            <section className="inbox">
              <figure className="tab-meme inbox-meme">
                <img
                  src="/memes/phone-monkey.jpg"
                  alt="Monkey in glasses taking a phone call at an office desk"
                  width="540"
                  height="759"
                />
                <figcaption>“just following up”</figcaption>
              </figure>
              <div className="info-strip">
                <MessageSquare size={18} />
                Your communication journal. Add company responses here as they
                arrive.
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
                      <div className="message-content">
                        <span className="tag">{m.type}</span>
                        <h3>{m.company}</h3>
                        <p>{m.notes}</p>
                        <small>{m.date}</small>
                      </div>
                      <ReactionMeme className="message-reaction" meme={responseMemes[m.type] ?? responseMemes.Other} />
                      <div className="message-actions">
                        <button className="secondary" aria-label={`Edit log for ${m.company}`} onClick={() => setModal({ kind: "message", message: m })}><Pencil size={18} /> Edit</button>
                        <button className="secondary" aria-label={`Delete log for ${m.company}`} onClick={() => setModal({ kind: "delete-message", message: m })}><Trash2 size={18} /> Delete</button>
                      </div>
                    </article>
                  ))
              ) : (
                <div className="empty">
                  <ReactionMeme className="inbox-waiting-meme" meme={["image-folder/05.png", "Sad character watching something crumble into dust", "me waiting for the recruiter to reply"]} />
                  <h3>No messages yet.</h3>
                  <p>
                    Keep interview invitations, feedback, and offers together.
                  </p>
                  <button
                    className="primary"
                    onClick={() => setModal({ kind: "message" })}
                  >
                    <Plus size={16} />
                    Log your first response
                  </button>
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
                      ? modal.message ? "Edit communication" : "Log a communication"
                      : modal.kind === "delete-message" ? "Delete this log?"
                      : "Your follow-up reminders"}
            </h2>
            <button
              className="icon-button"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
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
              {modal.job.id === 4 && (
                <ReactionMeme className="job-detail-meme" meme={["image-folder/09.png", "Pig-faced character taking a selfie beside coastal cliffs", "first day at Touch Grass Technologies"]} />
              )}
              <p className="muted">
                This is a fictional opportunity for exploring Hire Power.
                Tracking it creates a local application record; it does not
                submit an application to the company.
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
                <input
                  name="company"
                  required
                  maxLength={100}
                  defaultValue={modal.job?.company}
                />
              </label>
              <label>
                Position
                <input
                  name="position"
                  required
                  maxLength={150}
                  defaultValue={modal.job?.title}
                />
              </label>
              <div className="form-row">
                <label>
                  Date applied
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toLocaleDateString("en-CA")}
                  />
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
              onSubmit={(e) => {
                e.preventDefault();
                const name = new FormData(e.target).get("name");
                const id = Date.now();
                setResumes([
                  ...resumes,
                  {
                    id,
                    name,
                    content: resumes.find((r) => r.master).content,
                    master: false,
                  },
                ]);
                setResumeId(id);
                setModal(null);
              }}
            >
              <p>
                Create an editable copy of your master resume for a specific
                role.
              </p>
              <label>
                Resume name
                <input
                  name="name"
                  placeholder="e.g. Delulu Labs — Frontend Vibe Engineer"
                  required
                  maxLength={120}
                />
              </label>
              <button className="primary" type="submit">
                Create tailored copy <ArrowRight size={16} />
              </button>
            </form>
          )}
          {modal.kind === "message" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const entry = { ...Object.fromEntries(new FormData(e.target)), id: modal.message?.id ?? Date.now() };
                setMessages(modal.message ? messages.map((m) => m.id === entry.id ? entry : m) : [...messages, entry]);
                setModal(null);
                setNotice(
                  modal.message ? "Communication updated." : "Communication logged. Update the application stage in Applications if needed.",
                );
              }}
            >
              <label>
                Company
                <input name="company" required maxLength={100} defaultValue={modal.message?.company} />
              </label>
              <div className="form-row">
                <label>
                  Response type
                  <select name="type" defaultValue={modal.message?.type}>
                    {[
                      "Interview invitation",
                      "Rejection",
                      "Job offer",
                      "Follow-up",
                      "Other",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={modal.message?.date ?? new Date().toLocaleDateString("en-CA")}
                  />
                </label>
              </div>
              <label>
                Notes
                <textarea
                  name="notes"
                  defaultValue={modal.message?.notes}
                  required
                  placeholder="What did they say? What happens next?"
                />
              </label>
              <button className="primary" type="submit">
                {modal.message ? "Save changes" : "Save communication"} <Check size={16} />
              </button>
            </form>
          )}
          {modal.kind === "delete-message" && (
            <div>
              <p>Delete the {modal.message.type.toLowerCase()} log for <strong>{modal.message.company}</strong> from {modal.message.date}? This cannot be undone.</p>
              <div className="message-actions">
                <button className="secondary" onClick={() => setModal(null)}>Cancel</button>
                <button className="primary" onClick={() => {
                  setMessages(messages.filter((m) => m.id !== modal.message.id));
                  setModal(null);
                  setNotice("Communication deleted.");
                }}><Trash2 size={18} /> Delete log</button>
              </div>
            </div>
          )}
          {modal.kind === "reminders" && (
            <>
              <p className="muted">
                In-app reminders from your application tracker. Email and push
                notifications are not connected yet.
              </p>
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
                <p>
                  No follow-ups scheduled. Add a date to an application to see
                  it here.
                </p>
              )}
            </>
          )}
        </Modal>
      )}
      <button
        className={`brainrot-toggle ${brainrotOpen ? "is-open" : ""}`}
        aria-label={brainrotOpen ? "Hide focus break" : "Show focus break"}
        aria-expanded={brainrotOpen}
        onClick={() => setBrainrotOpen(!brainrotOpen)}
      >
        {brainrotOpen ? (
          <ChevronsRight size={18} />
        ) : (
          <ChevronsLeft size={18} />
        )}
      </button>
      <aside
        className={`brainrot-panel ${brainrotOpen ? "is-open" : ""}`}
        aria-hidden={!brainrotOpen}
      >
        <div className="brainrot-split">
          {brainrotOpen && (
            <iframe
              title="Minecraft parkour"
              src="https://www.youtube.com/embed/pCW_yTzfvQM?autoplay=1&mute=1&loop=1&playlist=pCW_yTzfvQM&controls=0&modestbranding=1&playsinline=1"
              allow="autoplay; encrypted-media"
              frameBorder="0"
            />
          )}
        </div>
        <div className="brainrot-split">
          {brainrotOpen && (
            <iframe
              title="Roblox obby"
              src="https://www.youtube.com/embed/fPh_SaPwqYs?autoplay=1&mute=1&loop=1&playlist=fPh_SaPwqYs&controls=0&modestbranding=1&playsinline=1"
              allow="autoplay; encrypted-media"
              frameBorder="0"
            />
          )}
        </div>
      </aside>
    </div>
  );
}
function BoardColumn({ stage, apps, onStatusChange, onFollowUpChange }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${stage}` });
  return (
    <section
      className={`board-column ${isOver ? "is-drop-target" : ""}`}
      ref={setNodeRef}
    >
      <h2>
        <span className={`stage-dot ${stage}`} />
        {stage}
        <span className="count">{apps.length}</span>
      </h2>
      <SortableContext
        items={apps.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        {apps.map((a) => (
          <ApplicationCard
            key={a.id}
            application={a}
            onStatusChange={onStatusChange}
            onFollowUpChange={onFollowUpChange}
          />
        ))}
      </SortableContext>
      {!apps.length && <p className="column-empty">No applications here yet.</p>}
      <ReactionMeme className="application-meme" meme={stageMemes[stage]} />
    </section>
  );
}
function ApplicationCard({ application, onStatusChange, onFollowUpChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: application.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <article className="application-card" ref={setNodeRef} style={style}>
      <div
        className="application-card-handle"
        aria-label={`Drag to move ${application.position} at ${application.company}`}
        {...attributes}
        {...listeners}
      >
        <div className="application-card-top">
          <GripVertical size={16} className="drag-icon" aria-hidden="true" />
          <small>{application.company}</small>
        </div>
        <h3>{application.position}</h3>
        <p>Applied {application.date}</p>
      </div>
      <label>
        Stage
        <select
          value={application.status}
          onChange={(e) => onStatusChange(application.id, e.target.value)}
        >
          {stages.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Follow-up date
        <input
          type="date"
          value={application.followUp}
          onChange={(e) => onFollowUpChange(application.id, e.target.value)}
        />
      </label>
    </article>
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
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}
createRoot(document.getElementById("root")).render(<App />);
