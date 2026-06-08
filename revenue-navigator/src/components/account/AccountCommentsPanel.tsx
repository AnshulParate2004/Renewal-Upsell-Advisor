import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { accountCard, accountCardHeader, accountSectionTitle } from "./accountDetailStyles";
import type { AccountComment } from "@/lib/api/accountComments";

interface Props {
  comments: AccountComment[];
  commentsLoading: boolean;
  newCommentBody: string;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
  addCommentLoading: boolean;
}

export function AccountCommentsPanel({
  comments,
  commentsLoading,
  newCommentBody,
  onCommentChange,
  onAddComment,
  addCommentLoading,
}: Props) {
  return (
    <div className={accountCard}>
      <div className={accountCardHeader}>
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className={accountSectionTitle}>Comments</h3>
      </div>
      <div className="p-5 flex flex-col gap-4 min-h-[200px]">
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a note for your team…"
            value={newCommentBody}
            onChange={(e) => onCommentChange(e.target.value)}
            className="min-h-[72px] resize-none border-black/15 flex-1 text-sm"
            disabled={addCommentLoading}
          />
          <Button
            onClick={onAddComment}
            disabled={!newCommentBody.trim() || addCommentLoading}
            className="shrink-0 self-end"
            size="sm"
          >
            {addCommentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 max-h-[280px]">
          {commentsLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="text-sm p-3 rounded-lg bg-muted/40 border border-black/8">
                <p className="text-foreground leading-relaxed">{c.body}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {new Date(c.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
