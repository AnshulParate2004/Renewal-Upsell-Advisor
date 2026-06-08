import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { TopAtRiskAccount } from "@/lib/api/analytics";
import { formatCurrency } from "@/data/mockData";

interface Props {
  accounts: TopAtRiskAccount[];
}

export function TopAtRiskTable({ accounts }: Props) {
  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black">
        <h3 className="text-sm font-semibold">Top At-Risk Accounts</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Highest risk scores in portfolio</p>
      </div>
      <div className="overflow-auto">
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No at-risk accounts</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/10 text-left text-muted-foreground">
                <th className="px-5 py-2 font-medium">Account</th>
                <th className="px-3 py-2 font-medium">Stage</th>
                <th className="px-3 py-2 font-medium">Risk</th>
                <th className="px-3 py-2 font-medium">Renewal</th>
                <th className="px-3 py-2 font-medium">Revenue</th>
                <th className="px-5 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.account_id} className="border-b border-black/5 hover:bg-muted/30">
                  <td className="px-5 py-2.5 font-semibold">{acc.account_name}</td>
                  <td className="px-3 py-2.5">{acc.stage_label}</td>
                  <td className="px-3 py-2.5 text-red-600 font-bold">{Math.round(acc.risk_score)}</td>
                  <td className="px-3 py-2.5">
                    {acc.renewal_days != null ? `${acc.renewal_days}d` : "—"}
                  </td>
                  <td className="px-3 py-2.5">{formatCurrency(acc.revenue)}</td>
                  <td className="px-5 py-2.5">
                    <Link
                      to={`/app/accounts/${acc.account_id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
