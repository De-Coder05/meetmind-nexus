import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, User, Zap, GripVertical, Trash2 } from "lucide-react";

export interface StagedTask {
  id: string;
  title: string;
  assignee: string;
  priority: "low" | "med" | "high";
}

interface Props {
  open: boolean;
  onClose: () => void;
  tasks: StagedTask[];
  onConfirm: (tasks: StagedTask[]) => void;
}

export function TaskStaging({ open, onClose, tasks: initial, onConfirm }: Props) {
  const [tasks, setTasks] = useState<StagedTask[]>(initial);
  const [pushing, setPushing] = useState(false);

  const update = (id: string, patch: Partial<StagedTask>) =>
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = (id: string) => setTasks((t) => t.filter((x) => x.id !== id));

  const confirm = () => {
    setPushing(true);
    setTimeout(() => {
      onConfirm(tasks);
      setPushing(false);
      onClose();
    }, 1100);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(720px,92vw)] max-h-[88vh] overflow-hidden glass-strong rounded-2xl shadow-elevated flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: "#5e6ad2" }}>
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold">Stage tasks for Linear</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    Edit titles & assignees before pushing · {tasks.length} tasks
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <AnimatePresence initial={false}>
                {tasks.map((t, i) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="group flex items-start gap-2 p-3 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 mt-1.5 text-muted-foreground/40 shrink-0" />

                    <div className="flex-1 space-y-2 min-w-0">
                      <input
                        value={t.title}
                        onChange={(e) => update(t.id, { title: e.target.value })}
                        className="w-full bg-transparent outline-none text-[13px] font-medium border-b border-transparent focus:border-primary/40 pb-1 transition-colors"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-2 h-7 rounded-md bg-background border border-border text-[11px]">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <input
                            value={t.assignee}
                            onChange={(e) => update(t.id, { assignee: e.target.value })}
                            className="bg-transparent outline-none w-28 text-foreground"
                          />
                        </label>
                        <select
                          value={t.priority}
                          onChange={(e) => update(t.id, { priority: e.target.value as StagedTask["priority"] })}
                          className="h-7 px-2 rounded-md bg-background border border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground outline-none focus:border-primary/40"
                        >
                          <option value="low">low</option>
                          <option value="med">med</option>
                          <option value="high">high</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => remove(t.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {tasks.length === 0 && (
                <p className="text-center text-[12px] text-muted-foreground py-10">
                  No tasks staged. Close this dialog to return.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 h-14 border-t border-border/60 bg-surface/40">
              <span className="text-[11px] font-mono text-muted-foreground">
                {tasks.length} issue{tasks.length === 1 ? "" : "s"} will be created in Linear
              </span>
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="h-9 px-3 rounded-lg border border-border text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button
                  onClick={confirm}
                  disabled={tasks.length === 0 || pushing}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-primary text-white text-[12px] font-medium shadow-glow disabled:opacity-50 disabled:saturate-0 transition-opacity"
                >
                  {pushing ? (
                    <>
                      <motion.span
                        className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                      Beaming…
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Push {tasks.length} to Linear
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
