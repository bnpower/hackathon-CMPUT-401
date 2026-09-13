const DB_NAME = "hire-power-resume-files";
export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore("files", { keyPath: "id" });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("Close other Hire Power tabs and try again."));
    });
}

async function transact(mode, action) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("files", mode);
        let result;
        const request = action(transaction.objectStore("files"));
        request.onsuccess = () => {
            result = request.result;
        };
        transaction.oncomplete = () => {
            db.close();
            resolve(result);
        };
        transaction.onabort = transaction.onerror = () => {
            db.close();
            reject(transaction.error || new Error("Could not access resume storage."));
        };
    });
}

export const listResumeFiles = () => transact("readonly", (store) => store.getAll());
export const removeResumeFile = (id) => transact("readwrite", (store) => store.delete(id));

export async function storeResumeFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(extension)) throw new Error("Choose a PDF or DOCX resume.");
    if (!file.size) throw new Error("That file is empty. Choose another resume.");
    if (file.size > MAX_RESUME_BYTES) throw new Error("That file is too large. The limit is 10 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    if (extension === "pdf" && header !== "%PDF-") throw new Error("That file does not appear to be a PDF.");
    if (extension === "docx") {
        const zipDirectory = new TextDecoder("latin1").decode(bytes);
        if (
            bytes[0] !== 0x50 ||
            bytes[1] !== 0x4b ||
            bytes[2] !== 3 ||
            bytes[3] !== 4 ||
            !zipDirectory.includes("word/document.xml") ||
            !zipDirectory.includes("[Content_Types].xml")
        ) {
            throw new Error("That file does not appear to be a DOCX document.");
        }
    }
    const record = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        extension,
        addedAt: new Date().toISOString(),
        blob: new Blob([bytes], {
            type: extension === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
    };
    await transact("readwrite", (store) => store.put(record));
    return record;
}
