import { useState } from "react";
import { TopBar } from "@/components/meetmind/TopBar";
import { CommandCenter } from "@/components/meetmind/CommandCenter";
import { ActivePipeline } from "@/components/meetmind/ActivePipeline";
import { IntelligenceEngine } from "@/components/meetmind/IntelligenceEngine";

type View = "command" | "pipeline" | "results";

const Index = () => {
  const [view, setView] = useState<View>("command");
  const [meta, setMeta] = useState<{ title: string; type: "meeting" | "lecture"; source: string }>({
    title: "",
    type: "meeting",
    source: "",
  });

  const reset = () => setView("command");

  return (
    <div className="min-h-screen bg-background">
      <TopBar onReset={reset} />
      {view === "command" && (
        <CommandCenter
          onLaunch={(m) => {
            setMeta(m);
            setView("pipeline");
          }}
        />
      )}
      {view === "pipeline" && <ActivePipeline title={meta.title} meetingId={meta.source} onComplete={() => setView("results")} />}
      {view === "results" && <IntelligenceEngine title={meta.title} type={meta.type} meetingId={meta.source} onBack={reset} />}
    </div>
  );
};

export default Index;
