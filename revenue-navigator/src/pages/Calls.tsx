import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, ChevronDown, ChevronUp, Download, Copy, Flag } from "lucide-react";
import { voiceCalls, type VoiceCall } from "@/data/mockData";

const outcomeBadge: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  picked_up: { label: "✅ Picked Up", variant: "default" },
  missed: { label: "❌ Missed", variant: "destructive" },
  retry: { label: "🔄 Retry", variant: "secondary" },
  voicemail: { label: "⏸️ Voicemail", variant: "outline" },
};

export default function Calls() {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = voiceCalls
    .filter((c) => c.accountName.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => outcomeFilter === "all" || c.outcome === outcomeFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Voice Calls</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by account..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="retry">Retry</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((call) => (
              <>
                <TableRow
                  key={call.id}
                  className="cursor-pointer"
                  onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                >
                  <TableCell className="font-medium text-sm">{call.accountName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{call.date}</TableCell>
                  <TableCell className="font-mono text-xs">{call.duration}</TableCell>
                  <TableCell>
                    <Badge variant={outcomeBadge[call.outcome].variant} className="text-xs">
                      {outcomeBadge[call.outcome].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {call.sentiment ? (
                      <span className="capitalize">{call.sentiment === "positive" ? "😊" : call.sentiment === "neutral" ? "😐" : "😟"} {call.sentiment}</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{call.retryCount}</TableCell>
                  <TableCell>
                    {call.transcript ? (
                      expandedId === call.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    ) : null}
                  </TableCell>
                </TableRow>
                {expandedId === call.id && call.transcript && (
                  <TableRow key={`${call.id}-transcript`}>
                    <TableCell colSpan={7} className="bg-muted/30 p-0">
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">📞 Call Transcript</p>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs"><Download className="h-3 w-3 mr-1" /> Download</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs"><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs"><Flag className="h-3 w-3 mr-1" /> Flag</Button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {call.transcript.map((line, i) => (
                            <p key={i} className={line.startsWith("[Agent]") ? "text-primary" : "text-foreground"}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
