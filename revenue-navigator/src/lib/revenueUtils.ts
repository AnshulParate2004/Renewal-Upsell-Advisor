import type { Account } from "@/data/mockData";
import type { RevenueType } from "@/contexts/RevenueContext";
import { formatCurrency } from "@/data/mockData";

export function accountArr(account: Pick<Account, "arr">): number {
  return account.arr ?? 0;
}

export function accountMrr(account: Pick<Account, "mrr">): number {
  return account.mrr ?? 0;
}

/** Annual view: accounts with ARR > 0 */
export function isAnnualAccount(account: Pick<Account, "arr">): boolean {
  return accountArr(account) > 0;
}

/** Monthly view: MRR present and no ARR */
export function isMonthlyAccount(account: Pick<Account, "arr" | "mrr">): boolean {
  return accountMrr(account) > 0 && accountArr(account) <= 0;
}

export function filterAccountsByRevenueType(accounts: Account[], revenueType: RevenueType): Account[] {
  return revenueType === "MRR"
    ? accounts.filter(isMonthlyAccount)
    : accounts.filter(isAnnualAccount);
}

export function accountRevenue(account: Account, revenueType: RevenueType): number {
  return revenueType === "MRR" ? accountMrr(account) : accountArr(account);
}

export function formatAccountRevenue(account: Account, revenueType: RevenueType): string {
  const value = accountRevenue(account, revenueType);
  const label = revenueType === "MRR" ? "MRR" : "ARR";
  return `${formatCurrency(value)} ${label}`;
}

export function billingIntervalParam(revenueType: RevenueType): "monthly" | "annual" {
  return revenueType === "MRR" ? "monthly" : "annual";
}
