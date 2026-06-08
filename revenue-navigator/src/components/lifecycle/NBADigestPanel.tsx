import { useNavigate } from "react-router-dom";
import { ExternalLink, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NextBestAction } from "@/types/lifecycle";
import { LIFECYCLE_STAGES } from "@/lib/lifecycleStages";

interface Props {
  items: NextBestAction[];
  onSelectAccount: (accountId: string) => void;
  selectedAccountId?: string;
}

export function NBADigestPanel({ items, onSelectAccount, selectedAccountId }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full min-h-[360px] overflow-hidden">
      <div className="px-4 py-3 border-b-2 border-black flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold">Your Weekly NBA Digest</h2>
        </div>
        <span className="text-[10px] text-muted-foreground">{items.length} actions</span>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No actions queued.</p>
        ) : (
          items.map((item) => {
            const stage = LIFECYCLE_STAGES.find((s) => s.id === item.stage);
            const isSelected = item.accountId === selectedAccountId;
            return (
              <div
                key={item.id}
                className={cn(
                  "w-full rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-black bg-primary/5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    : "border-black/15 hover:border-black/40"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectAccount(item.accountId)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", stage?.accentClass)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold">{item.accountName}</span>
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border",
                            stage?.badgeClass
                          )}
                        >
                          {item.stageLabel}
                        </span>
                        {item.dueHint && (
                          <span className="text-[9px] text-muted-foreground ml-auto">{item.dueHint}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-foreground/75 mt-1">{item.action}</p>
                    </div>
                  </div>
                </button>
                <div className="px-3 pb-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/app/accounts/${item.accountId}`)}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                  >
                    Open account
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
