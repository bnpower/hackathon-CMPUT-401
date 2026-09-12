import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./store";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./styles.css";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        if (this.state.failed)
            return (
                <main className="app-error">
                    <h1>Let’s get you back on track.</h1>
                    <p>Something unexpected happened in this demo workspace. Try reloading the page.</p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        Reload HirePower
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            if (window.confirm("Clear the demo workspace? This deletes locally saved resumes and applications.")) {
                                localStorage.removeItem("hirepower-demo-v1");
                                window.location.reload();
                            }
                        }}
                    >
                        Reset demo workspace
                    </button>
                </main>
            );
        return this.props.children;
    }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <AppProvider>
                <App />
            </AppProvider>
        </ErrorBoundary>
    </React.StrictMode>,
);
