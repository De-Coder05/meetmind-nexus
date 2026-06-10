import { useState } from "react";
import { TopBar, type NavView } from "@/components/meetmind/TopBar";
import { CommandCenter } from "@/components/meetmind/CommandCenter";
import { ActivePipeline } from "@/components/meetmind/ActivePipeline";
import { IntelligenceEngine } from "@/components/meetmind/IntelligenceEngine";
import { IntegrationsPage } from "./IntegrationsPage";
import { PipelinesPage } from "./PipelinesPage";

type AppView = "command" | "pipeline" | "results" | "integrations" | "pipelines" | "teams";

const Index = () => {
  const [view, setView] = useState<AppView>("command");
  const [meta, setMeta] = useState<{ title: string; type: "meeting" | "lecture"; source: string }>({
    title: "", type: "meeting", source: "",
  });

  const reset = () => setView("command");

  const handleNav = (nav: NavView) => {
    if (nav === "library")      setView("command");
    if (nav === "pipelines")    setView("pipelines");
    if (nav === "integrations") setView("integrations");
    if (nav === "teams")        setView("teams");
  };

  const activeNav: NavView =
    view === "integrations" ? "integrations"
    : view === "pipelines"  ? "pipelines"
    : view === "teams"      ? "teams"
    : "library";

  return (
    <div className="min-h-screen bg-background">
      <TopBar onReset={reset} activeNav={activeNav} onNav={handleNav} />

      {view === "command" && (
        <CommandCenter
          onLaunch={(m) => { setMeta(m); setView("pipeline"); }}
        />
      )}

      {view === "pipeline" && (
        <ActivePipeline
          title={meta.title}
          meetingId={meta.source}
          onComplete={() => setView("results")}
        />
      )}

      {view === "results" && (
        <IntelligenceEngine
          title={meta.title}
          type={meta.type}
          meetingId={meta.source}
          onBack={reset}
        />
      )}

      {view === "integrations" && <IntegrationsPage />}

      {view === "pipelines" && <PipelinesPage />}

      {view === "teams" && (
        <div className="max-w-[900px] mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border grid place-items-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Teams</h1>
          <p className="text-muted-foreground text-[14px] max-w-sm mx-auto">
            Collaborate with your team on meeting intelligence. Invite members, share workspaces, and set permissions.
          </p>
          <span className="inline-block mt-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-mono">
            Coming soon
          </span>
        </div>
      )}
    </div>
  );
};

export default Index;
