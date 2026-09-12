import React, { useEffect, useRef, useState } from "react";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import {
  listResumeFiles,
  storeResumeFile,
  removeResumeFile,
} from "./resumeFiles";
import "./resumeUploads.css";

export default function ResumeUploads() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const input = useRef(null);
  const urls = useRef(new Set());

  useEffect(() => {
    let active = true;
    listResumeFiles()
      .then((records) => {
        if (active)
          setFiles(records.sort((a, b) => b.addedAt.localeCompare(a.addedAt)));
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load uploaded resumes. Browser storage may be unavailable; reload to try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      for (const url of urls.current) URL.revokeObjectURL(url);
    };
  }, []);

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const record = await storeResumeFile(file);
      setFiles((previous) => [record, ...previous]);
      setStatus(`${file.name} saved in this browser.`);
    } catch (err) {
      setError(
        err.name === "QuotaExceededError"
          ? "Browser storage is full. Remove an uploaded file and try again."
          : err.message || "Could not save this resume. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function download(file) {
    const url = URL.createObjectURL(file.blob);
    urls.current.add(url);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      urls.current.delete(url);
    }, 60000);
  }

  async function remove(file) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await removeResumeFile(file.id);
      setFiles((previous) => previous.filter((item) => item.id !== file.id));
      setStatus(`${file.name} removed.`);
    } catch {
      setError("Could not remove this file. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="resume-uploads"
      aria-labelledby="uploads-title"
      aria-busy={busy || loading}
    >
      <div className="uploads-heading">
        <h2 id="uploads-title">Uploaded resumes</h2>
        <button
          className="secondary"
          disabled={busy || loading}
          onClick={() => input.current.click()}
        >
          <Upload size={16} />
          {busy ? "Saving…" : "Upload resume"}
        </button>
        <input
          ref={input}
          type="file"
          aria-label="Upload PDF or DOCX resume"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={upload}
          hidden
          disabled={busy || loading}
        />
      </div>
      <p>
        PDF or DOCX, up to 10 MB. Original files are saved in this browser and
        can be downloaded again. Edit them in your document app; the text editor
        below stays separate.
      </p>
      {error && (
        <p className="upload-error" role="alert">
          {error}
        </p>
      )}
      <p className="upload-status" role="status">
        {loading ? "Loading uploaded resumes…" : status}
      </p>
      {files.length > 0 && (
        <ul className="uploaded-files">
          {files.map((file) => (
            <li key={file.id}>
              <FileText size={20} aria-hidden="true" />
              <div className="uploaded-file-name">
                <strong>{file.name}</strong>
                <small>
                  {file.extension.toUpperCase()} ·{" "}
                  {Math.max(1, Math.round(file.size / 1024))} KB
                </small>
              </div>
              <div className="uploaded-file-actions">
                <button
                  className="secondary"
                  onClick={() => download(file)}
                  aria-label={`Download ${file.name}`}
                >
                  <Download size={15} />
                  Download
                </button>
                <button
                  className="icon-button"
                  disabled={busy}
                  onClick={() => remove(file)}
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
