import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Download, Loader2, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getDaysUntil, getRenewalInDays } from '@/data/mockData';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAccounts } from '@/hooks/useAccounts';
import { useLifecycleStageMap } from '@/hooks/useLifecycleStageMap';
import { useBulkTicketStats } from '@/hooks/useTicketStats';
import { LifecycleStageBadge } from '@/components/lifecycle/LifecycleStageBadge';
import {
  LifecycleStageFilter,
  type StageFilter,
} from '@/components/lifecycle/LifecycleStageFilter';
import { useRevenue } from '@/contexts/RevenueContext';
import { emailApi } from '@/lib/api/email';
import { accountCommentsApi, type AccountComment } from '@/lib/api/accountComments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type SortKey = 'risk' | 'healthScore' | 'arr' | 'renewal' | 'utilization' | 'relationshipScore' | 'churn';

type RangeFilter = { min: string; max: string };

const ACCOUNTS_PAGE_SIZE = 15;

const defaultRange = (): RangeFilter => ({ min: '', max: '' });

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState<StageFilter>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [rangeFilters, setRangeFilters] = useState<Record<SortKey, RangeFilter>>({
    risk: defaultRange(),
    healthScore: defaultRange(),
    arr: defaultRange(),
    renewal: defaultRange(),
    utilization: defaultRange(),
    relationshipScore: defaultRange(),
    churn: defaultRange(),
  });
  const [locationKeyword, setLocationKeyword] = useState('');
  const [partnerNameKeyword, setPartnerNameKeyword] = useState('');
  const [commentAccountId, setCommentAccountId] = useState<string | null>(null);
  const [commentAccountName, setCommentAccountName] = useState<string>('');
  const [comments, setComments] = useState<AccountComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [addCommentLoading, setAddCommentLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ACCOUNTS_PAGE_SIZE);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { revenueType } = useRevenue();
  const { data: accountsRaw, isLoading, error, refetch } = useAccounts();
  const accounts = Array.isArray(accountsRaw) ? accountsRaw : [];
  const { stageByAccountId, isLoading: lifecycleStagesLoading } = useLifecycleStageMap(accounts);
  const { data: ticketStatsByAccount = {} } = useBulkTicketStats(accounts.length > 0);
  const revenueValue = (c: typeof accounts[0]) => (revenueType === 'MRR' ? (c?.mrr ?? 0) : (c?.arr ?? 0));

  /** Risk: High (≥70), Middle (40–69), Safe (<40). */
  const getRiskTier = (riskScore: number): 'high' | 'safe' | 'middle' =>
    riskScore >= 70 ? 'high' : riskScore >= 40 ? 'middle' : 'safe';

  const searchFilteredClients = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return accounts.filter((client) =>
      (client?.name ?? '').toLowerCase().includes(term)
    );
  }, [accounts, searchTerm]);

  const lifecycleStageCounts = useMemo(() => {
    const counts: Record<StageFilter, number> = {
      all: searchFilteredClients.length,
      protect: 0,
      renew: 0,
      adopt: 0,
      expand: 0,
      activate: 0,
    };
    searchFilteredClients.forEach((client) => {
      const stage = client?.id ? stageByAccountId.get(client.id)?.stage : undefined;
      if (stage && stage in counts) {
        counts[stage] += 1;
      }
    });
    return counts;
  }, [searchFilteredClients, stageByAccountId]);

  const filteredClients = useMemo(() => {
    return searchFilteredClients.filter((client) => {
      if (lifecycleFilter !== 'all') {
        const stage = client?.id ? stageByAccountId.get(client.id)?.stage : undefined;
        if (stage !== lifecycleFilter) return false;
      }
      const risk = client.riskScore ?? 0;
      const healthScore = client.healthScore ?? 0;
      const arr = revenueValue(client);
      const renewal = getRenewalInDays(client.renewalDate, client.contractEnd, client.status) ?? 0;
      const utilization = client.utilization ?? 0;
      const relationshipScore = client.relationshipScore ?? 0;
      const churnPct = (client.churnProbability ?? 0) * 100;

      const r = rangeFilters.risk;
      if (r.min !== '' && risk < Number(r.min)) return false;
      if (r.max !== '' && risk > Number(r.max)) return false;

      const h = rangeFilters.healthScore;
      if (h.min !== '' && healthScore < Number(h.min)) return false;
      if (h.max !== '' && healthScore > Number(h.max)) return false;

      const a = rangeFilters.arr;
      if (a.min !== '' && arr < Number(a.min)) return false;
      if (a.max !== '' && arr > Number(a.max)) return false;

      const rn = rangeFilters.renewal;
      if (rn.min !== '' && renewal < Number(rn.min)) return false;
      if (rn.max !== '' && renewal > Number(rn.max)) return false;

      const u = rangeFilters.utilization;
      if (u.min !== '' && utilization < Number(u.min)) return false;
      if (u.max !== '' && utilization > Number(u.max)) return false;

      const rs = rangeFilters.relationshipScore;
      if (rs.min !== '' && relationshipScore < Number(rs.min)) return false;
      if (rs.max !== '' && relationshipScore > Number(rs.max)) return false;

      const c = rangeFilters.churn;
      if (c.min !== '' && churnPct < Number(c.min)) return false;
      if (c.max !== '' && churnPct > Number(c.max)) return false;

      const locKw = (locationKeyword || '').trim().toLowerCase();
      if (locKw) {
        const city = (client.contactCity ?? '').toLowerCase();
        const state = (client.contactState ?? '').toLowerCase();
        const combined = `${city} ${state}`.trim();
        if (!combined.includes(locKw)) return false;
      }

      const partnerKw = (partnerNameKeyword || '').trim().toLowerCase();
      if (partnerKw) {
        const partner = ((client.partnerName ?? client.csm) ?? '').toLowerCase();
        if (!partner.includes(partnerKw)) return false;
      }

      return true;
    });
  }, [searchFilteredClients, rangeFilters, locationKeyword, partnerNameKeyword, lifecycleFilter, stageByAccountId, revenueType]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

    const setRange = (key: SortKey, field: 'min' | 'max', value: string) => {
    setRangeFilters((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const clearRangeFilters = () => {
    setRangeFilters({
      risk: defaultRange(),
      healthScore: defaultRange(),
      arr: defaultRange(),
      renewal: defaultRange(),
      utilization: defaultRange(),
      relationshipScore: defaultRange(),
      churn: defaultRange(),
    });
    setLocationKeyword('');
    setPartnerNameKeyword('');
    setLifecycleFilter('all');
  };

  const hasActiveFilters =
    lifecycleFilter !== 'all' ||
    Object.values(rangeFilters).some((r) => r.min !== '' || r.max !== '') ||
    (locationKeyword || '').trim() !== '' ||
    (partnerNameKeyword || '').trim() !== '' ||
    (searchTerm || '').trim() !== '';

  useEffect(() => {
    if (!commentAccountId) return;
    setCommentsLoading(true);
    accountCommentsApi.getByAccountId(commentAccountId).then(setComments).catch(() => setComments([])).finally(() => setCommentsLoading(false));
  }, [commentAccountId]);

  const handleOpenComments = (accountId: string, accountName: string) => {
    setCommentAccountId(accountId);
    setCommentAccountName(accountName);
    setNewCommentBody('');
  };

  const handleAddComment = async () => {
    if (!commentAccountId || !newCommentBody.trim()) return;
    setAddCommentLoading(true);
    try {
      const created = await accountCommentsApi.create(commentAccountId, newCommentBody.trim());
      setComments((prev) => [created, ...prev]);
      setNewCommentBody('');
    } finally {
      setAddCommentLoading(false);
    }
  };

  const sortedClients = useMemo(() => {
    if (!sortBy) return filteredClients;
    const mult = sortDir === 'asc' ? 1 : -1;
    return [...filteredClients].sort((a, b) => {
      let aVal: number | string, bVal: number | string;
      switch (sortBy) {
        case 'risk':
          aVal = a.riskScore ?? 0;
          bVal = b.riskScore ?? 0;
          return mult * (aVal as number - (bVal as number));
        case 'healthScore':
          aVal = a.healthScore ?? 0;
          bVal = b.healthScore ?? 0;
          return mult * (aVal as number - (bVal as number));
        case 'arr':
          aVal = revenueValue(a);
          bVal = revenueValue(b);
          return mult * (aVal as number - (bVal as number));
        case 'renewal': {
          const aRenewal = getRenewalInDays(a.renewalDate, a.contractEnd) ?? 0;
          const bRenewal = getRenewalInDays(b.renewalDate, b.contractEnd, b.status) ?? 0;
          return mult * (aRenewal - bRenewal);
        }
        case 'utilization':
          aVal = a.utilization ?? 0;
          bVal = b.utilization ?? 0;
          return mult * (aVal as number - (bVal as number));
        case 'relationshipScore':
          aVal = a.relationshipScore ?? 0;
          bVal = b.relationshipScore ?? 0;
          return mult * (aVal as number - (bVal as number));
        case 'churn':
          aVal = a.churnProbability ?? 0;
          bVal = b.churnProbability ?? 0;
          return mult * (aVal as number - (bVal as number));
        default:
          return 0;
      }
    });
  }, [filteredClients, sortBy, sortDir]);

  const visibleClients = useMemo(
    () => sortedClients.slice(0, visibleCount),
    [sortedClients, visibleCount]
  );

  const hasMore = visibleCount < sortedClients.length;

  useEffect(() => {
    setVisibleCount(ACCOUNTS_PAGE_SIZE);
  }, [
    searchTerm,
    lifecycleFilter,
    rangeFilters,
    locationKeyword,
    partnerNameKeyword,
    sortBy,
    sortDir,
  ]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + ACCOUNTS_PAGE_SIZE, sortedClients.length));
  }, [sortedClients.length]);

  useEffect(() => {
    if (!hasMore || isLoading) return;
    const sentinel = loadMoreRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: '120px', threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore, visibleClients.length]);

  const handleExportCSV = () => {
    if (filteredClients.length === 0) return;
    const revLabel = revenueType === 'MRR' ? 'MRR' : 'ARR';
    const headers = ['Account', revLabel, 'Health', 'Risk', 'Renewal Days', 'Licences Used %', 'Relationship Score', 'Churn Probability', 'Sentiment Score', 'Location', 'Partner name'];
    const rows = filteredClients.map(client => {
      const rev = revenueValue(client);
      const revStr = rev != null && !Number.isNaN(rev) ? String(rev) : '';
      return [
      client?.name, revStr, client?.healthScore, client?.riskScore,
      (getRenewalInDays(client?.renewalDate, client?.contractEnd, client?.status) ?? ''), client?.utilization, client?.relationshipScore,
      client.churnProbability, client.sentimentScore,
      [client?.contactCity, client?.contactState].filter(Boolean).join(', ') || '',
      client?.partnerName ?? client?.csm ?? ''
    ];
    });
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `accounts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-background">
      {/* Page Header */}
      <div className="bg-card border-b-2 border-black px-6 py-5 shrink-0 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="shrink-0 min-w-[140px]">
            <h1 className="text-xl font-semibold text-foreground">Accounts</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {visibleClients.length} of {filteredClients.length} accounts
              {filteredClients.length !== accounts.length ? ` (${accounts.length} total)` : ''}
              {lifecycleFilter !== 'all' ? ` · ${lifecycleFilter} only` : hasActiveFilters ? ' (filtered)' : ' under management'}
              {hasMore ? ' · scroll for more' : ''}
            </p>
          </div>

          <div className="flex-1 flex justify-center min-w-0 px-0 lg:px-4">
            {lifecycleStagesLoading ? (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading lifecycle filters…
              </p>
            ) : (
              <LifecycleStageFilter
                value={lifecycleFilter}
                onChange={setLifecycleFilter}
                counts={lifecycleStageCounts}
              />
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0 lg:ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm bg-background border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 w-48 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilterPanel((prev) => !prev)}
              className={`h-9 px-3 rounded-lg text-xs font-medium border-2 border-black transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${showFilterPanel ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'}`}
            >
              <Filter className="w-3.5 h-3.5" /> {showFilterPanel ? 'Hide filters' : 'Add Filter'}
            </button>
            <button onClick={handleExportCSV} className="h-9 px-3 bg-card text-foreground border-2 border-black rounded-lg text-xs font-medium hover:bg-muted transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Range filters - only visible when Add Filter is toggled on */}
      {showFilterPanel ? (
        <div className="px-6 pt-6 pb-6 shrink-0">
          <div className="bg-card rounded-xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Filter by range</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearRangeFilters}
                  className="ml-2 text-xs font-medium text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
              {([
                { key: 'risk' as const, label: 'Risk', placeholder: '0-100' },
                { key: 'healthScore' as const, label: 'Health Score', placeholder: '0-100' },
                { key: 'arr' as const, label: revenueType === 'MRR' ? 'MRR' : 'ARR', placeholder: 'e.g. 100000' },
                { key: 'renewal' as const, label: 'Renewal (days)', placeholder: 'e.g. -30 to 365' },
                { key: 'utilization' as const, label: 'Utilization %', placeholder: '0-100' },
                { key: 'relationshipScore' as const, label: 'Relationship', placeholder: '0-100' },
                { key: 'churn' as const, label: 'Churn probability', placeholder: '0-100' },
              ]).map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={rangeFilters[key].min}
                      onChange={(e) => setRange(key, 'min', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-background border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={rangeFilters[key].max}
                      onChange={(e) => setRange(key, 'max', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-background border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t-2 border-black/10">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-3">Filter by keyword</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={locationKeyword}
                    onChange={(e) => setLocationKeyword(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-background border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Partner name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme, Nexus"
                    value={partnerNameKeyword}
                    onChange={(e) => setPartnerNameKeyword(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-background border-2 border-black rounded-md focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Table */}
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-auto p-6 pt-2">
        <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b-2 border-black">
              <tr className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider text-left">
                <th className="pl-5 py-3">Account</th>
                <th className="text-center py-3">Lifecycle</th>
                <th className="text-center py-3">
                  <button type="button" onClick={() => handleSort('risk')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    Risk {sortBy === 'risk' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </button>
                </th>
                <th className="text-center py-3">
                  <button type="button" onClick={() => handleSort('healthScore')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    Health Score {sortBy === 'healthScore' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </button>
                </th>
                <th className="text-right py-3 pr-4">
                  <button type="button" onClick={() => handleSort('arr')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto">
                    {revenueType === 'MRR' ? 'MRR' : 'ARR'} {sortBy === 'arr' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </button>
                </th>
                <th className="text-center py-3">
                  <button type="button" onClick={() => handleSort('renewal')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    Renewal {sortBy === 'renewal' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </button>
                </th>
                <th className="text-center py-3">
                  <button type="button" onClick={() => handleSort('utilization')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    Licences Used % {sortBy === 'utilization' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </button>
                </th>
                <th className="text-center py-3">
                  <button type="button" onClick={() => handleSort('relationshipScore')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    Relationship Score {sortBy === 'relationshipScore' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </button>
                </th>
                <th className="text-center py-3">
                  <button type="button" onClick={() => handleSort('churn')} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    Churn probability {sortBy === 'churn' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </button>
                </th>
                <th className="text-center py-3">Tickets raised</th>
                <th className="text-center py-3">Tickets resolved</th>
                <th className="text-center py-3">Sentiment</th>
                <th className="text-center py-3">Location</th>
                <th className="text-center py-3">Partner name</th>
                <th className="text-center py-3 pr-5 w-28">Comments</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-b-2 border-black"><td colSpan={15} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </td></tr>
              ) : error ? (
                <tr className="border-b-2 border-black"><td colSpan={15} className="p-0">
                  <EmptyState variant="not-found" title="Failed to Load Accounts" message={error.message || "Failed to load accounts."} />
                </td></tr>
              ) : filteredClients.length === 0 ? (
                <tr className="border-b-2 border-black"><td colSpan={15} className="p-0">
                  <EmptyState
                    variant="no-results"
                    title="No Accounts Found"
                    message={
                      lifecycleFilter !== 'all'
                        ? `No accounts in the ${lifecycleFilter} lifecycle stage. Try All or another stage.`
                        : hasActiveFilters
                          ? 'No accounts match the current filters. Try widening ranges, another lifecycle stage, or clear filters.'
                          : 'Try adjusting your search criteria.'
                    }
                  />
                </td></tr>
              ) : (
                <>
                {visibleClients.map((client, index) => {
                  const riskTier = getRiskTier(client?.riskScore ?? 0);
                  const isMiddle = riskTier === 'middle';
                  const statusLower = (client?.status ?? '').toString().trim().toLowerCase();
                  const isNew = statusLower === 'new';
                  const isRenewed = statusLower === 'renewed' || statusLower === 'renewal';
                  
                  // Date-sensitive status logic
                  const renewalDays = getRenewalInDays(client?.renewalDate, client?.contractEnd, client?.status);
                  const isActuallyChurned = statusLower === 'churned' || (renewalDays !== null && renewalDays < 0 && !isRenewed);
                  const isActuallyCritical = !isRenewed && !isActuallyChurned && (riskTier === 'high' || statusLower === 'at_risk');
                  
                  const hasYellowBg = isActuallyCritical;
                  const hasGrayBg = isActuallyChurned;
                  
                  const clientId = client?.id ?? String(index);
                  const u = Number(client?.utilization ?? 0);
                  const utilizationPct = u <= 1 && u >= 0 ? Math.round(u * 100) : Math.round(u);
                  const utilizationPctClamped = Math.min(100, Math.max(0, utilizationPct));
                  return (
                  <tr
                    key={clientId}
                    onClick={() => client?.id && navigate(`/app/accounts/${client.id}`)}
                    className={`group cursor-pointer transition-colors border-b-2 border-black ${
                      isRenewed ? 'bg-emerald-100/80 dark:bg-emerald-950/30 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/40' : 
                      hasGrayBg ? 'bg-slate-200/50 dark:bg-slate-900/30 opacity-70 hover:bg-slate-300/50' :
                      hasYellowBg ? 'bg-amber-100/80 dark:bg-amber-950/30 hover:bg-amber-200/80 dark:hover:bg-amber-900/40' : 
                      'hover:bg-muted/20'
                    }`}
                  >
                    <td className="pl-5 py-3.5">
                      <div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">{client?.name ?? '—'}</span>
                        <div className="text-[11px] text-muted-foreground">{(client?.id ?? '').toString().slice(0, 8)}</div>
                      </div>
                    </td>
                    <td className="text-center py-3.5" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const lifecycle = client?.id ? stageByAccountId.get(client.id) : undefined;
                        if (lifecycleStagesLoading && !lifecycle) {
                          return <span className="text-[10px] text-muted-foreground">…</span>;
                        }
                        if (!lifecycle) {
                          return <span className="text-[10px] text-muted-foreground">—</span>;
                        }
                        return <LifecycleStageBadge stage={lifecycle.stage} label={lifecycle.stageLabel} />;
                      })()}
                    </td>
                    <td className="text-center py-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${
                        isRenewed ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                        isActuallyChurned ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400' :
                        isActuallyCritical ? 'bg-destructive/10 text-destructive' :
                        riskTier === 'middle' ? 'bg-amber-400/90 text-amber-950 dark:bg-amber-500/90 dark:text-amber-50' :
                        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {isRenewed ? 'Renewed' : isActuallyChurned ? 'Churned' : isActuallyCritical ? 'Critical' : riskTier === 'middle' ? 'Middle' : 'Healthy'}
                      </span>
                    </td>
                    <td className="text-center py-3.5">
                      <span className={`text-sm font-medium ${client.healthScore >= 70 ? 'text-emerald-600' : client.healthScore >= 40 ? 'text-amber-600' : 'text-destructive'}`}>
                        {client.healthScore ?? 0}
                      </span>
                    </td>
                    <td className="text-right font-medium text-foreground pr-4 py-3.5 text-sm">
                      {(() => {
                        const val = revenueValue(client);
                        if (val == null || Number.isNaN(val)) return '—';
                        return formatCurrency(val);
                      })()}
                    </td>
                    <td className="text-center py-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${(getRenewalInDays(client.renewalDate, client.contractEnd, client.status) ?? 999) <= 30 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {getRenewalInDays(client.renewalDate, client.contractEnd, client.status) ?? '—'}d
                      </span>
                    </td>
                    <td className="text-center py-3.5">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">{utilizationPctClamped}%</span>
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden border border-black/10">
                          <div className={`h-full rounded-full ${utilizationPctClamped > 80 ? 'bg-primary' : 'bg-emerald-500'}`} style={{ width: `${utilizationPctClamped}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3.5">
                      <span className="text-sm font-medium text-primary">{client.relationshipScore}</span>
                    </td>
                    <td className="text-center py-3.5">
                      <span className={`text-sm font-medium ${client.churnProbability >= 0.7 ? 'text-destructive' : client.churnProbability >= 0.4 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {Math.round(client.churnProbability * 100)}%
                      </span>
                    </td>
                    <td className="text-center py-3.5">
                      <span className="text-sm font-medium text-foreground">
                        {ticketStatsByAccount[clientId]?.raised ?? 0}
                      </span>
                    </td>
                    <td className="text-center py-3.5">
                      <span className="text-sm font-medium text-emerald-700">
                        {ticketStatsByAccount[clientId]?.resolved ?? 0}
                      </span>
                    </td>
                    <td className="text-center py-3.5 text-base">
                      {client.sentimentScore > 0.5 ? '😊' : client.sentimentScore > 0 ? '🙂' : client.sentimentScore > -0.5 ? '😐' : '😟'}
                    </td>
                    <td className="text-center py-3.5">
                      <div className="flex flex-col items-center justify-center gap-0 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                        <span className="block leading-tight">{client.contactCity ?? '—'}</span>
                        <span className="block leading-tight">{client.contactState ?? '—'}</span>
                      </div>
                    </td>
                    <td className="text-center py-3.5">
                      <div className="flex flex-col items-center justify-center gap-0 text-sm text-foreground">
                        {(() => {
                          const name = (client?.partnerName ?? client?.csm ?? '').trim() || '—';
                          if (name === '—') return <><span className="block leading-tight">—</span><span className="block leading-tight">—</span></>;
                          const parts = name.split(/\s+/);
                          const first = parts[0] ?? '—';
                          const rest = parts.slice(1).join(' ') || '—';
                          return <><span className="block leading-tight">{first}</span><span className="block leading-tight">{rest}</span></>;
                        })()}
                      </div>
                    </td>
                    <td className="text-center py-3.5 pr-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenComments(client.id, client.name)}
                          title="Comments"
                          className="p-1.5 rounded-lg border-2 border-black bg-card hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors inline-block" />
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {hasMore && (
                  <tr ref={loadMoreRef} className="border-b-2 border-black">
                    <td colSpan={15} className="text-center py-6">
                      <button
                        type="button"
                        onClick={loadMore}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border-2 border-black rounded-lg bg-card hover:bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Load more ({sortedClients.length - visibleClients.length} remaining)
                      </button>
                    </td>
                  </tr>
                )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!commentAccountId} onOpenChange={(open) => !open && setCommentAccountId(null)}>
        <DialogContent className="sm:max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle>Comments — {commentAccountName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                className="min-h-[80px] border-2 border-black resize-none"
                disabled={addCommentLoading}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newCommentBody.trim() || addCommentLoading}
                className="shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {addCommentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
            <div className="border-t border-black/20 pt-3 max-h-[240px] overflow-y-auto space-y-2">
              {commentsLoading ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet. Add one above.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="text-sm p-2 rounded-md bg-muted/50 border border-black/10">
                    <p className="text-foreground">{c.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
