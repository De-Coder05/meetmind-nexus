import { useState } from "react";
import { CheckCircle2, Circle, ExternalLink, ChevronDown, ChevronUp, Zap } from "lucide-react";

interface IntegrationConfig {
  name: string;
  description: string;
  color: string;
  docsUrl: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    name: "Notion",
    description: "Push meeting summaries, decisions, and action items to a Notion database automatically.",
    color: "#ffffff",
    docsUrl: "https://developers.notion.com/docs/getting-started",
    fields: [
      { key: "NOTION_API_KEY",      label: "Integration Token", placeholder: "secret_...", secret: true },
      { key: "NOTION_DATABASE_ID",  label: "Database ID",       placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
    ],
  },
  {
    name: "Slack",
    description: "Send meeting digests with decisions and action items to any Slack channel.",
    color: "#4A154B",
    docsUrl: "https://api.slack.com/authentication/basics",
    fields: [
      { key: "SLACK_BOT_TOKEN",        label: "Bot Token",       placeholder: "xoxb-...", secret: true },
      { key: "SLACK_DEFAULT_CHANNEL",  label: "Default Channel", placeholder: "#meeting-notes" },
    ],
  },
  {
    name: "Linear",
    description: "Create Linear issues from action items with correct priority, owner, and deadline.",
    color: "#5E6AD2",
    docsUrl: "https://developers.linear.app/docs/graphql/working-with-the-graphql-api",
    fields: [
      { key: "LINEAR_API_KEY", label: "API Key",  placeholder: "lin_api_...", secret: true },
      { key: "LINEAR_TEAM_ID", label: "Team ID",  placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
    ],
  },
];

export function IntegrationsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saved, setSaved]       = useState<Set<string>>(new Set());

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Integrations</h1>
        <p className="text-muted-foreground text-[14px]">
          Connect MeetMind to your tools. Once connected, toggle push on any meeting during upload.
        </p>
      </div>

      <div className="space-y-4">
        {INTEGRATIONS.map(integration => {
          const isOpen    = expanded === integration.name;
          const isSaved   = saved.has(integration.name);

          return (
            <div key={integration.name} className="card-surface rounded-2xl overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white/2 transition-colors"
                onClick={() => setExpanded(isOpen ? null : integration.name)}
              >
                {/* Logo placeholder */}
                <div className="w-10 h-10 rounded-xl border border-border grid place-items-center shrink-0 bg-surface text-[14px] font-bold" style={{ color: integration.color }}>
                  {integration.name[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold">{integration.name}</h3>
                    {isSaved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-mono">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground truncate">{integration.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="h-7 px-2 rounded-md text-[12px] text-muted-foreground hover:text-foreground border border-border inline-flex items-center gap-1 transition-colors"
                  >
                    Docs <ExternalLink className="w-3 h-3" />
                  </a>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded config */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-border pt-4 animate-fade-in-up">
                  <p className="text-[12px] text-muted-foreground mb-4">
                    Add these values to your <code className="px-1 py-0.5 rounded bg-surface-2 text-[11px] font-mono">backend/.env</code> file and restart the server.
                  </p>
                  <div className="space-y-3 mb-5">
                    {integration.fields.map(field => (
                      <div key={field.key}>
                        <label className="text-[12px] font-mono text-muted-foreground mb-1 block">{field.key}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type={field.secret ? "password" : "text"}
                            placeholder={field.placeholder}
                            className="flex-1 h-9 px-3 rounded-lg bg-surface border border-border text-[13px] outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50 font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{field.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSaved(p => new Set(p).add(integration.name)); setExpanded(null); }}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-primary text-white text-[13px] font-medium shadow-glow"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Save & mark connected
                    </button>
                    <p className="text-[11px] text-muted-foreground">
                      Note: Actual connection requires restarting the backend with correct .env values.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* API reference */}
      <div className="mt-10 p-5 rounded-2xl border border-border bg-surface/50">
        <h3 className="text-[14px] font-semibold mb-2">Push via API</h3>
        <p className="text-[13px] text-muted-foreground mb-3">You can also push individual tasks on demand:</p>
        <pre className="text-[11px] font-mono text-muted-foreground bg-surface rounded-lg p-3 overflow-x-auto">
{`POST /api/v1/tasks/notion   { title, owner, deadline, priority, ... }
POST /api/v1/tasks/linear   { title, owner, deadline, priority, ... }`}
        </pre>
      </div>
    </div>
  );
}
