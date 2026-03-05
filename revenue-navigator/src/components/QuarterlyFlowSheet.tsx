import { useState, useEffect } from "react";
import { Clock, Calendar, ChevronRight, Settings, Plus, Play, Mail, Phone, CheckSquare, Loader2 } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { workflowsApi, WorkflowStep, WorkflowTemplate } from "@/lib/api/workflows";

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

    const stageTitle = stage === "renewed" ? "Renewed" : stage.toUpperCase();

    const handleAddStep = () => {
        const newStep: WorkflowStep = {
            title: "New Action",
            time_label: viewMode === "month" ? "Month X" : "Day X",
            days_offset: viewMode === "month" ? 30 : 1,
            action_type: "email",
            topic: "Enter action details...",
            is_active: true,
            step_order: currentSteps.length + 1
        };
        setCurrentSteps([...currentSteps, newStep]);
        setEditingStep(currentSteps.length);
    };

    const actionIcons = {
        email: <Mail className="w-4 h-4" />,
        call: <Phone className="w-4 h-4" />,
        task: <CheckSquare className="w-4 h-4" />
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[450px] p-0 border-l-2 border-black flex flex-col bg-background">
                <div className="p-6 border-b-2 border-black bg-card shrink-0">
                    <SheetHeader className="text-left space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Automated Workflow</span>
                        </div>
                        <SheetTitle className="text-xl font-bold text-foreground">{stageTitle} Process Flow</SheetTitle>
                        <SheetDescription className="text-sm text-muted-foreground">
                            Define the scheduled touchpoints and expected figures for accounts in {stageTitle}.
                        </SheetDescription>
                    </SheetHeader>

                    {/* View Mode Toggle */}
                    <div className="flex bg-muted rounded-lg p-1 border-2 border-black mt-6">
                        <button
                            onClick={() => setViewMode("day")}
                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "day"
                                ? "bg-card text-foreground shadow-sm border-2 border-black"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                                }`}
                        >
                            <Clock className="w-3.5 h-3.5" /> Day-wise
                        </button>
                        <button
                            onClick={() => setViewMode("month")}
                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "month"
                                ? "bg-card text-foreground shadow-sm border-2 border-black"
                                : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                                }`}
                        >
                            <Calendar className="w-3.5 h-3.5" /> Month-wise
                        </button>
                    </div>
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
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            className="text-sm font-bold bg-background px-2 py-1 rounded-md border border-primary w-full outline-none text-foreground"
                                                            value={step.title}
                                                            onChange={(e) => {
                                                                const newSteps = [...currentSteps];
                                                                newSteps[idx].title = e.target.value;
                                                                setCurrentSteps(newSteps);
                                                            }}
                                                            placeholder="Action Title"
                                                        />
                                                        <input
                                                            type="text"
                                                            className="text-[10px] font-bold px-2 py-1 rounded-md border border-black bg-muted text-muted-foreground w-16 text-center"
                                                            value={step.time_label || ''}
                                                            onChange={(e) => {
                                                                const newSteps = [...currentSteps];
                                                                newSteps[idx].time_label = e.target.value;
                                                                setCurrentSteps(newSteps);
                                                            }}
                                                            placeholder="Time"
                                                        />
                                                    </div>

                                                    <div>
                                                        <select
                                                            className="w-full text-xs font-medium bg-background px-2 py-1.5 rounded-md border border-primary outline-none text-foreground mb-2"
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
                                                        <textarea
                                                            className="w-full text-xs bg-background px-2 py-1.5 rounded-md border border-primary outline-none resize-none text-foreground"
                                                            rows={2}
                                                            value={step.topic || ''}
                                                            onChange={(e) => {
                                                                const newSteps = [...currentSteps];
                                                                newSteps[idx].topic = e.target.value;
                                                                setCurrentSteps(newSteps);
                                                            }}
                                                            placeholder="Action Topic and Details..."
                                                        />
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
                                                    <div className="flex items-start justify-between mt-3 gap-4">
                                                        <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-2">
                                                            {step.topic}
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
                <div className="p-6 border-t-2 border-black bg-card shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSaving ? "Saving..." : `Save ${stageTitle} Flow`} {!isSaving && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
