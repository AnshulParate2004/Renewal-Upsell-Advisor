import { useState, useEffect } from "react";
import { ChevronRight, Settings, Plus, Play, Mail, Phone, CheckSquare, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { workflowsApi, WorkflowStep, WorkflowTemplate, type StepFrequency } from "@/lib/api/workflows";

const FREQUENCY_OPTIONS: { value: StepFrequency; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
];

/** Q1 = months 1,2,3; Q2 = 4,5,6; Q3 = 7,8,9; Q4 = 10,11,12; renewed = 1,2,3 */
function getMonthOptionsForStage(stage: string | null): { value: string; label: string }[] {
    if (!stage) return [{ value: "Month 1", label: "Month 1" }];
    const s = stage.toLowerCase();
    let months: number[];
    if (s === "q1") months = [1, 2, 3];
    else if (s === "q2") months = [4, 5, 6];
    else if (s === "q3") months = [7, 8, 9];
    else if (s === "q4") months = [10, 11, 12];
    else months = [1, 2, 3]; // renewed, no_renewed, or other
    return months.map((m) => ({ value: `Month ${m}`, label: `Month ${m}` }));
}

/** Default time_label for new step in this stage (first month of quarter). */
function getDefaultMonthLabelForStage(stage: string | null): string {
    const opts = getMonthOptionsForStage(stage);
    return opts[0]?.value ?? "Month 1";
}

type TimingType = "month" | "after_days" | "last_days";

function getTimingTypeFromStep(step: WorkflowStep): TimingType {
    const t = (step.time_label || "").trim();
    if (t.startsWith("Last")) return "last_days";
    if (t.startsWith("After")) return "after_days";
    return "month";
}

function getDaysFromStep(step: WorkflowStep): number {
    const t = (step.time_label || "").trim();
    const match = t.match(/(\d+)/);
    if (match) return Math.max(1, parseInt(match[1], 10));
    return step.days_offset && step.days_offset > 0 ? step.days_offset : 1;
}

interface QuarterlyFlowSheetProps {
    stage: string | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

type ActionType = "email" | "call" | "task";

export function QuarterlyFlowSheet({ stage, isOpen, onOpenChange }: QuarterlyFlowSheetProps) {
    const [viewMode, setViewMode] = useState<"day" | "month">("month");
    const [editingStep, setEditingStep] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [templateId, setTemplateId] = useState<string | null>(null);
    const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
    const [currentSteps, setCurrentSteps] = useState<WorkflowStep[]>([]);

    useEffect(() => {
        if (isOpen && stage) {
            loadTemplate(stage);
        }
    }, [isOpen, stage]);

    const loadTemplate = async (stageName: string) => {
        setIsLoading(true);
        try {
            const templates = await workflowsApi.getTemplates();
            // find template for this stage
            let found = templates.find((t: any) => t.stage_name === stageName.toLowerCase());

            if (found) {
                setTemplateId(found.id);
                setTemplate(found);
                setCurrentSteps(found.steps || []);
            } else {
                // If not found, start with empty
                setTemplateId(null);
                setTemplate(null);
                setCurrentSteps([]);
            }
        } catch (error) {
            console.error("Failed to load template", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!stage) return;
        setIsSaving(true);

        try {
            let currentTemplateId = templateId;
            // 1. Create template if it doesn't exist
            if (!currentTemplateId) {
                const newTemplate = await workflowsApi.createTemplate({
                    stage_name: stage.toLowerCase(),
                    description: `${stage.toUpperCase()} Automated Workflow`
                });
                currentTemplateId = newTemplate.id;
                setTemplateId(currentTemplateId);
            }

            // 2. We could optimize this by deleting old steps and creating new ones, or updating existing ones.
            // For simplicity, let's recreate all steps for this template.
            if (template && template.steps) {
                for (const oldStep of template.steps) {
                    if (oldStep.id) {
                        await workflowsApi.deleteStep(oldStep.id);
                    }
                }
            }

            // 3. Create all steps
            for (let i = 0; i < currentSteps.length; i++) {
                const step = currentSteps[i];
                await workflowsApi.createStep({
                    template_id: currentTemplateId!,
                    step_order: i + 1,
                    title: step.title,
                    time_label: step.time_label,
                    days_offset: step.days_offset,
                    action_type: step.action_type,
                    topic: step.topic,
                    frequency: step.frequency ?? "weekly",
                    send_window_start: step.send_window_start || undefined,
                    send_window_end: step.send_window_end || undefined,
                    follow_up_offset_days: step.follow_up_offset_days ?? 3,
                    is_active: step.is_active
                });
            }

            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save workflow", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!stage) return null;

    const stageTitle = stage === "no_renewed" ? "No Renewed" : (stage === "renewed" ? "Renewed" : stage.toUpperCase());

    const handleAddStep = () => {
        const monthLabel = getDefaultMonthLabelForStage(stage);
        const newStep: WorkflowStep = {
            title: "New Action",
            time_label: monthLabel,
            days_offset: viewMode === "month" ? 30 : 1,
            action_type: "email",
            topic: "",
            frequency: "weekly",
            send_window_start: "09:00",
            send_window_end: "17:00",
            follow_up_offset_days: 3,
            is_active: true,
            step_order: currentSteps.length + 1
        };
        setCurrentSteps([...currentSteps, newStep]);
        setEditingStep(currentSteps.length);
    };

    const monthOptions = getMonthOptionsForStage(stage);

    const actionIcons = {
        email: <Mail className="w-4 h-4" />,
        call: <Phone className="w-4 h-4" />,
        task: <CheckSquare className="w-4 h-4" />
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[480px] w-[95vw] p-0 gap-0 border-2 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background max-h-[90vh] flex flex-col">
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-6 border-b-2 border-black bg-card shrink-0">
                    <DialogHeader className="text-left space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Automated Workflow</span>
                        </div>
                        <DialogTitle className="text-xl font-bold text-foreground">{stageTitle} Process Flow</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Set schedule to day-wise or month-wise. For each step choose email or voice; the purpose you write is injected into the email/call bot so it sends or says it accordingly. Set frequency: one-time, daily, weekly, or monthly.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Scrollable Flow Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/30 relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Connecting line */}
                            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-black" />

                            <div className="space-y-4">
                                {currentSteps.map((step, idx) => (
                                    <div key={idx} className="relative pl-10 group cursor-pointer">
                                        {/* Timeline Dot */}
                                        <div
                                            className={`absolute left-0 top-3 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center bg-card shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 transition-transform ${step.is_active ? 'hover:scale-110 text-primary' : 'text-muted-foreground'}`}
                                            onClick={() => {
                                                const newSteps = [...currentSteps];
                                                newSteps[idx].is_active = !newSteps[idx].is_active;
                                                setCurrentSteps(newSteps);
                                            }}
                                        >
                                            {step.is_active ? <Play className="w-3.5 h-3.5 fill-current" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                        </div>

                                        {/* Card */}
                                        <div className={`p-4 rounded-xl border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${step.is_active ? 'bg-primary/5 border-primary text-primary-foreground' : 'bg-card'}`}>

                                            {editingStep === idx ? (
                                                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <input
                                                            type="text"
                                                            className="text-sm font-bold bg-background px-2 py-1 rounded-md border border-primary flex-1 min-w-[120px] outline-none text-foreground"
                                                            value={step.title}
                                                            onChange={(e) => {
                                                                const newSteps = [...currentSteps];
                                                                newSteps[idx].title = e.target.value;
                                                                setCurrentSteps(newSteps);
                                                            }}
                                                            placeholder="Action Title"
                                                        />
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <label className="text-[10px] font-medium text-muted-foreground shrink-0">When</label>
                                                            <select
                                                                className="text-[10px] font-bold px-2 py-1.5 rounded-md border-2 border-black bg-background text-foreground"
                                                                value={getTimingTypeFromStep(step)}
                                                                onChange={(e) => {
                                                                    const newSteps = [...currentSteps];
                                                                    const typ = e.target.value as TimingType;
                                                                    if (typ === "month") {
                                                                        newSteps[idx].time_label = monthOptions[0]?.value ?? "Month 1";
                                                                        newSteps[idx].days_offset = 30;
                                                                    } else if (typ === "after_days") {
                                                                        const n = getDaysFromStep(step);
                                                                        newSteps[idx].time_label = `After ${n} days`;
                                                                        newSteps[idx].days_offset = n;
                                                                    } else {
                                                                        const n = getDaysFromStep(step);
                                                                        newSteps[idx].time_label = `Last ${n} days`;
                                                                        newSteps[idx].days_offset = n;
                                                                    }
                                                                    setCurrentSteps(newSteps);
                                                                }}
                                                            >
                                                                <option value="month">Month in quarter</option>
                                                                <option value="after_days">After X days</option>
                                                                <option value="last_days">Last X days before renewal</option>
                                                            </select>
                                                            {getTimingTypeFromStep(step) === "month" && (
                                                                <select
                                                                    className="text-[10px] font-bold px-2 py-1 rounded-md border-2 border-black bg-background text-foreground min-w-[90px]"
                                                                    value={monthOptions.some((o) => o.value === (step.time_label || "")) ? step.time_label : monthOptions[0]?.value}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...currentSteps];
                                                                        newSteps[idx].time_label = e.target.value;
                                                                        setCurrentSteps(newSteps);
                                                                    }}
                                                                >
                                                                    {monthOptions.map((opt) => (
                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                            {(getTimingTypeFromStep(step) === "after_days" || getTimingTypeFromStep(step) === "last_days") && (
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        max={getTimingTypeFromStep(step) === "last_days" ? 365 : 999}
                                                                        className="w-14 text-[10px] font-bold px-2 py-1 rounded-md border-2 border-black bg-background text-foreground text-center"
                                                                        value={getDaysFromStep(step)}
                                                                        onChange={(e) => {
                                                                            const newSteps = [...currentSteps];
                                                                            const n = Math.max(1, parseInt(e.target.value, 10) || 1);
                                                                            const typ = getTimingTypeFromStep(newSteps[idx]);
                                                                            newSteps[idx].days_offset = n;
                                                                            newSteps[idx].time_label = typ === "after_days" ? `After ${n} days` : `Last ${n} days`;
                                                                            setCurrentSteps(newSteps);
                                                                        }}
                                                                    />
                                                                    <span className="text-[10px] text-muted-foreground">days</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <select
                                                            className="w-full text-xs font-medium bg-background px-2 py-1.5 rounded-md border border-primary outline-none text-foreground"
                                                            value={step.action_type}
                                                            onChange={(e) => {
                                                                const newSteps = [...currentSteps];
                                                                newSteps[idx].action_type = e.target.value as ActionType;
                                                                setCurrentSteps(newSteps);
                                                            }}
                                                        >
                                                            <option value="email">Email</option>
                                                            <option value="call">Voice Call</option>
                                                            <option value="task">Manual Task</option>
                                                        </select>
                                                        {(step.action_type === "email" || step.action_type === "call") && (
                                                            <>
                                                                <label className="text-[10px] font-medium text-muted-foreground block mt-1">
                                                                    Purpose (injected into email/call bot)
                                                                </label>
                                                                <textarea
                                                                    className="w-full text-xs bg-background px-2 py-1.5 rounded-md border border-primary outline-none resize-none text-foreground"
                                                                    rows={2}
                                                                    value={step.topic || ''}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...currentSteps];
                                                                        newSteps[idx].topic = e.target.value;
                                                                        setCurrentSteps(newSteps);
                                                                    }}
                                                                    placeholder="e.g. Renewal reminder, check satisfaction, offer upgrade..."
                                                                />
                                                            </>
                                                        )}
                                                        {step.action_type === "task" && (
                                                            <>
                                                                <label className="text-[10px] font-medium text-muted-foreground block mt-1">Details</label>
                                                                <textarea
                                                                    className="w-full text-xs bg-background px-2 py-1.5 rounded-md border border-primary outline-none resize-none text-foreground"
                                                                    rows={2}
                                                                    value={step.topic || ''}
                                                                    onChange={(e) => {
                                                                        const newSteps = [...currentSteps];
                                                                        newSteps[idx].topic = e.target.value;
                                                                        setCurrentSteps(newSteps);
                                                                    }}
                                                                    placeholder="Task description..."
                                                                />
                                                            </>
                                                        )}
                                                        <label className="text-[10px] font-medium text-muted-foreground block mt-1">Frequency</label>
                                                        <select
                                                            className="w-full text-xs font-medium bg-background px-2 py-1.5 rounded-md border border-black outline-none text-foreground"
                                                            value={step.frequency ?? "weekly"}
                                                            onChange={(e) => {
                                                                const newSteps = [...currentSteps];
                                                                newSteps[idx].frequency = e.target.value as StepFrequency;
                                                                setCurrentSteps(newSteps);
                                                            }}
                                                        >
                                                            {FREQUENCY_OPTIONS.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                        <label className="text-[10px] font-medium text-muted-foreground block mt-1">Send between (start – end time)</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="time"
                                                                className="text-xs bg-background px-2 py-1.5 rounded-md border-2 border-black outline-none text-foreground"
                                                                value={step.send_window_start ?? "09:00"}
                                                                onChange={(e) => {
                                                                    const newSteps = [...currentSteps];
                                                                    newSteps[idx].send_window_start = e.target.value || undefined;
                                                                    setCurrentSteps(newSteps);
                                                                }}
                                                            />
                                                            <span className="text-[10px] text-muted-foreground">to</span>
                                                            <input
                                                                type="time"
                                                                className="text-xs bg-background px-2 py-1.5 rounded-md border-2 border-black outline-none text-foreground"
                                                                value={step.send_window_end ?? "17:00"}
                                                                onChange={(e) => {
                                                                    const newSteps = [...currentSteps];
                                                                    newSteps[idx].send_window_end = e.target.value || undefined;
                                                                    setCurrentSteps(newSteps);
                                                                }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground">Message or call is sent only within this time window.</p>
                                                        <label className="text-[10px] font-medium text-muted-foreground block mt-1">Follow-up offset (days)</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={60}
                                                            className="w-full text-xs bg-background px-2 py-1.5 rounded-md border-2 border-black outline-none text-foreground"
                                                            value={step.follow_up_offset_days ?? 3}
                                                            onChange={(e) => {
                                                                const newSteps = [...currentSteps];
                                                                newSteps[idx].follow_up_offset_days = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 3));
                                                                setCurrentSteps(newSteps);
                                                            }}
                                                        />
                                                        <p className="text-[10px] text-muted-foreground">Controls when calls or emails are automatically queued after this touchpoint.</p>
                                                    </div>

                                                    <button
                                                        onClick={() => setEditingStep(null)}
                                                        className="w-full py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-md border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-primary/90"
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-md border border-black/20 ${step.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                                {actionIcons[step.action_type as ActionType]}
                                                            </div>
                                                            <h4 className={`text-sm font-bold ${step.is_active ? 'text-primary' : 'text-foreground'}`}>{step.title}</h4>
                                                        </div>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-black bg-muted text-muted-foreground">
                                                            {step.time_label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[10px] font-medium text-muted-foreground capitalize">
                                                            {FREQUENCY_OPTIONS.find((o) => o.value === (step.frequency ?? "weekly"))?.label ?? "Weekly"}
                                                        </span>
                                                        {(step.send_window_start || step.send_window_end) && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {step.send_window_start ?? "—"} – {step.send_window_end ?? "—"}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Follow-up in {(step.follow_up_offset_days ?? 3)}d
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start justify-between mt-3 gap-4">
                                                        <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-2">
                                                            {step.topic || "—"}
                                                        </p>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingStep(idx);
                                                            }}
                                                            className="p-1 hover:bg-black/5 rounded-md transition-colors text-muted-foreground shrink-0"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isLoading && (
                        <button onClick={handleAddStep} className="w-full py-3 mt-4 border-2 border-dashed border-black rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-black/5 hover:border-solid transition-all flex items-center justify-center gap-2 bg-card shadow-sm">
                            <Plus className="w-4 h-4" /> Add New Step
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t-2 border-black bg-card shrink-0 rounded-b-xl">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSaving ? "Saving..." : `Save ${stageTitle} Flow`} {!isSaving && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
