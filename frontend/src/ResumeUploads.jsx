import React, { useEffect, useRef, useState } from "react";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { MAX_RESUME_BYTES } from "./resumeFiles";
import "./resumeUploads.css";

function fileError(data) {
    const message = data?.file?.[0] || data?.detail || "Could not save this resume. Please try again.";
    return typeof message === "string" ? message : "Could not save this resume. Please try again.";
}

export default function ResumeUploads({ accessToken, apiBaseUrl }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const input = useRef(null);
    const urls = useRef(new Set());

    useEffect(() => {
        let active = true;
        fetch(`${apiBaseUrl}/api/resume-documents/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(data?.detail || "Could not load uploaded resumes.");
                return data;
            })
            .then((records) => {
                if (active) setFiles(records.sort((a, b) => b.addedAt.localeCompare(a.addedAt)));
            })
            .catch(() => {
                if (active) setError("Could not load uploaded resumes. Check the backend connection and reload to try again.");
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
            const extension = file.name.split(".").pop().toLowerCase();
            if (!file.size) throw new Error("That file is empty. Choose another resume.");
            if (!["pdf", "docx", "png", "jpg", "jpeg"].includes(extension)) throw new Error("Choose a PDF, DOCX, PNG, JPG, or JPEG file.");
            if (file.size > MAX_RESUME_BYTES) throw new Error("That file is too large. The limit is 10 MB.");
            const form = new FormData();
            form.append("file", file);
            const response = await fetch(`${apiBaseUrl}/api/resume-documents/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: form,
            });
            const record = await response.json();
            if (!response.ok) throw new Error(fileError(record));
            setFiles((previous) => [record, ...previous]);
            setStatus(`${file.name} saved to your account.`);
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
        fetch(`${apiBaseUrl}/api/resume-documents/${file.id}/download/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then(async (response) => {
                if (!response.ok) throw new Error("Could not download this file.");
                return response.blob();
            })
            .then((blob) => {
                const url = URL.createObjectURL(blob);
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
            })
            .catch((err) => setError(err.message));
    }

    async function remove(file) {
        setBusy(true);
        setError("");
        setStatus("");
        try {
            const response = await fetch(`${apiBaseUrl}/api/resume-documents/${file.id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error("Could not remove this file.");
            setFiles((previous) => previous.filter((item) => item.id !== file.id));
            setStatus(`${file.name} removed.`);
        } catch {
            setError("Could not remove this file. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="resume-uploads" aria-labelledby="uploads-title" aria-busy={busy || loading}>
            <div className="uploads-heading">
                <h2 id="uploads-title">Uploaded resumes</h2>
                <button className="secondary" disabled={busy || loading} onClick={() => input.current.click()}>
                    <Upload size={16} />
                    {busy ? "Saving…" : "Upload resume"}
                </button>
                <input
                    ref={input}
                    type="file"
                    aria-label="Upload PDF, DOCX, PNG, or JPEG resume"
                    accept=".pdf,.docx,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
                    onChange={upload}
                    hidden
                    disabled={busy || loading}
                />
            </div>
            <p>
                PDF, DOCX, PNG, or JPEG, up to 10 MB. Original files are saved to your account and can be downloaded again. Edit them in your document app; the
                text editor below stays separate.
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
                                    {file.extension.toUpperCase()} · {Math.max(1, Math.round(file.size / 1024))} KB
                                </small>
                            </div>
                            <div className="uploaded-file-actions">
                                <button className="secondary" onClick={() => download(file)} aria-label={`Download ${file.name}`}>
                                    <Download size={15} />
                                    Download
                                </button>
                                <button className="icon-button" disabled={busy} onClick={() => remove(file)} aria-label={`Remove ${file.name}`}>
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
