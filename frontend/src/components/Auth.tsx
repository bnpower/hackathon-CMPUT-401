import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Info, Linkedin, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Brand, Modal } from './UI';
import { useApp } from '../store';
import { ssoUrl } from '../lib/api';

export default function Auth({ onClose, onRegistered, initialMode = 'login' }: { onClose: () => void; onRegistered: () => void; initialMode?: 'login' | 'register' }) {
  const { signInDemo, toast } = useApp();
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ssoNotice, setSsoNotice] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    signInDemo(name.trim() || email.split('@')[0].replace(/[._-]/g, ' '), email.trim());
    setPassword('');
    if (mode === 'register') onRegistered();
    else { onClose(); toast('Demo session started. Authentication is not connected to Django yet.'); }
  }
  function startSso(provider: 'google' | 'linkedin') {
    const url = ssoUrl(provider);
    if (url) window.location.assign(url);
    else setSsoNotice(`${provider === 'google' ? 'Google' : 'LinkedIn'} sign-in needs the Django OAuth provider to be configured. You can explore with a demo session below.`);
  }
  return <Modal title={mode === 'login' ? 'Welcome back to your next chapter.' : 'Good things start here.'} onClose={onClose}>
    <div className="auth-intro"><Brand /><p>{mode === 'login' ? 'A little ambition. A lot of possibility. Let’s pick up where you left off.' : 'Less searching. More possibilities. Make your next move with HirePower.'}</p></div>
    <div className="auth-switch"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setPassword(''); }}>Log in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setPassword(''); }}>Create an account</button></div>
    <div className="sso-buttons"><button className="btn btn-secondary" onClick={() => startSso('google')}><span className="google-icon">G</span>Google</button><button className="btn btn-secondary" onClick={() => startSso('linkedin')}><Linkedin size={18} fill="#0a66c2" color="#0a66c2" />LinkedIn</button></div>
    {ssoNotice && <div className="notice" role="status"><Info size={17} /><p>{ssoNotice}</p></div>}
    <div className="divider-label"><span />or continue with email<span /></div>
    <form onSubmit={submit} className="auth-form">
      {mode === 'register' && <label className="field">Full name<input className="input" value={name} onChange={event => setName(event.target.value)} placeholder="Your first and last name" autoComplete="name" required maxLength={100} pattern=".*\S.*" /></label>}
      <label className="field">Email address<div className="input-icon-wrap"><Mail size={16} /><input className="input" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div></label>
      <label className="field">Password<div className="input-icon-wrap"><LockKeyhole size={16} /><input className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required /><button type="button" className="password-toggle icon-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
      <div className="notice demo-notice"><ShieldCheck size={18} /><p><b>This is a frontend demo.</b> Use a made-up password. No credentials are verified, stored, or sent. Your workspace is saved only in this browser.</p></div>
      <button className="btn btn-primary auth-submit" type="submit">{mode === 'login' ? 'Start demo session' : 'Create demo profile'}<ArrowRight size={17} /></button>
    </form><p className="auth-fineprint"><Sparkles size={13} />Your next chapter is yours to write.</p>
  </Modal>;
}
