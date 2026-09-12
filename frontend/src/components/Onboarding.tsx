import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Code2, FileText, MapPin, Sparkles, UserRound } from 'lucide-react';
import { Modal } from './UI';
import { useApp } from '../store';
import { LEVELS, LOCATIONS, POSITIONS, type Contact, type Profile, type Resume, type ResumeEntry } from '../types';

export function PreferenceChoices({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (value: string[]) => void }) {
  return <fieldset className="preference-group"><legend>{label}</legend><div className="choice-grid">{options.map(option => <button key={option} type="button" className={`choice-chip ${selected.includes(option) ? 'selected' : ''}`} aria-pressed={selected.includes(option)} onClick={() => onChange(selected.includes(option) ? selected.filter(item => item !== option) : [...selected, option])}>{option}{selected.includes(option) && <Check size={13} />}</button>)}</div></fieldset>;
}
export function ContactFields({ value, onChange }: { value: Contact; onChange: (key: keyof Contact, value: string) => void }) {
  return <div className="form-grid">
    <label className="field">Full name<input className="input" required value={value.fullName} autoComplete="name" onChange={event => onChange('fullName', event.target.value)} maxLength={100} pattern=".*\S.*" /></label>
    <label className="field">Email address<input className="input" type="email" required value={value.email} autoComplete="email" onChange={event => onChange('email', event.target.value)} /></label>
    <label className="field">Phone number<input className="input" type="tel" value={value.phone} autoComplete="tel" onChange={event => onChange('phone', event.target.value)} placeholder="+1 (416) 555-0123" /></label>
    <label className="field">Your city<select className="input" value={value.location} onChange={event => onChange('location', event.target.value)}><option value="">Choose a city</option>{LOCATIONS.map(location => <option key={location}>{location}</option>)}</select></label>
    <label className="field">Portfolio / website<input className="input" value={value.website} autoComplete="url" onChange={event => onChange('website', event.target.value)} placeholder="yourname.dev" /></label>
    <label className="field">LinkedIn profile<input className="input" value={value.linkedin} onChange={event => onChange('linkedin', event.target.value)} placeholder="linkedin.com/in/yourname" /></label>
  </div>;
}
export default function Onboarding({ onClose }: { onClose: () => void }) {
  const { state, completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(structuredClone(state.profile));
  const [resume, setResume] = useState<Resume>(() => structuredClone(state.resumes.find(item => item.id === 'master')!));
  const [error, setError] = useState('');
  function changeEntry(section: 'education' | 'experience' | 'skills' | 'projects', key: keyof ResumeEntry, value: string) {
    setResume(current => {
      const entry = current.sections[section][0] ?? { id: crypto.randomUUID(), title: '', subtitle: '', location: '', period: '', details: '', visible: true };
      return { ...current, sections: { ...current.sections, [section]: [{ ...entry, [key]: value }, ...current.sections[section].slice(1)] } };
    });
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === 1 && (!profile.positions.length || !profile.locations.length || !profile.levels.length)) { setError('Choose at least one position, location, and job type to personalize your feed.'); return; }
    setError('');
    if (step < 2) { setStep(step + 1); return; }
    const contact = { fullName: profile.fullName, email: profile.email, phone: profile.phone, location: profile.location, website: profile.website, linkedin: profile.linkedin };
    completeOnboarding(profile, { ...resume, contact, updatedAt: new Date().toISOString() });
    onClose();
  }
  const steps = [{ label: 'A little about you', icon: UserRound }, { label: 'Your next move', icon: Sparkles }, { label: 'Your story', icon: FileText }];
  return <Modal title="Let’s make this feel like you." onClose={onClose} wide>
    <div className="onboarding-steps">{steps.map((item, index) => <div key={item.label} className={index <= step ? 'active' : ''}><span>{index < step ? <Check size={16} /> : <item.icon size={16} />}</span><b>{item.label}</b></div>)}</div>
    <form onSubmit={submit}>
      {step === 0 && <div className="onboarding-step"><span className="eyebrow">STEP 01 · THE INTRODUCTION</span><h3>Nice to meet you{profile.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}.</h3><p className="muted">Start with the basics. We’ll use these details on your master resume.</p><ContactFields value={profile} onChange={(key, value) => setProfile(current => ({ ...current, [key]: value }))} /></div>}
      {step === 1 && <div className="onboarding-step"><span className="eyebrow">STEP 02 · THE POSSIBILITIES</span><h3>What does your next chapter look like?</h3><p className="muted">Pick what excites you. You can always change this in settings.</p><PreferenceChoices label="Positions you’re interested in" options={POSITIONS} selected={profile.positions} onChange={positions => setProfile(current => ({ ...current, positions }))} /><PreferenceChoices label="Places you could see yourself" options={LOCATIONS} selected={profile.locations} onChange={locations => setProfile(current => ({ ...current, locations }))} /><PreferenceChoices label="The kind of opportunity you’re after" options={LEVELS} selected={profile.levels} onChange={levels => setProfile(current => ({ ...current, levels }))} /></div>}
      {step === 2 && <div className="onboarding-step"><span className="eyebrow">STEP 03 · THE GOOD STUFF</span><h3>You’ve got a story worth sharing.</h3><p className="muted">Build the foundation of your Harvard-style resume. Add more entries, upload a text resume, and fine-tune every detail in the resume editor later. Demo details are prefilled—replace them with your own.</p><div className="onboard-resume-fields"><label className="field">School / university<input className="input" value={resume.sections.education[0]?.title ?? ''} onChange={event => changeEntry('education', 'title', event.target.value)} placeholder="University of Alberta" /></label><label className="field">Degree / program<input className="input" value={resume.sections.education[0]?.subtitle ?? ''} onChange={event => changeEntry('education', 'subtitle', event.target.value)} placeholder="BSc in Computer Science" /></label><label className="field">Most recent role<input className="input" value={resume.sections.experience[0]?.title ?? ''} onChange={event => changeEntry('experience', 'title', event.target.value)} placeholder="Software Developer Intern" /></label><label className="field">Company<input className="input" value={resume.sections.experience[0]?.subtitle ?? ''} onChange={event => changeEntry('experience', 'subtitle', event.target.value)} placeholder="Where you made an impact" /></label><label className="field full-width">Experience highlights<textarea className="input" rows={3} value={resume.sections.experience[0]?.details ?? ''} onChange={event => changeEntry('experience', 'details', event.target.value)} placeholder="What did you build, improve, or learn?" /></label><label className="field full-width">Technical skills<textarea className="input" rows={2} value={resume.sections.skills[0]?.details ?? ''} onChange={event => { changeEntry('skills', 'details', event.target.value); changeEntry('skills', 'title', 'Languages & frameworks'); }} placeholder="Python, TypeScript, React, PostgreSQL…" /></label><label className="field">A project you’re proud of<input className="input" value={resume.sections.projects[0]?.title ?? ''} onChange={event => changeEntry('projects', 'title', event.target.value)} /></label><label className="field">What you built<input className="input" value={resume.sections.projects[0]?.details ?? ''} onChange={event => changeEntry('projects', 'details', event.target.value)} /></label></div></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={() => step ? setStep(step - 1) : onClose()}>{step ? <><ArrowLeft size={16} />Back</> : 'Maybe later'}</button><button className="btn btn-primary" type="submit">{step === 2 ? 'Find my next chapter' : 'Keep going'}<ArrowRight size={16} /></button></div>
    </form>
  </Modal>;
}
