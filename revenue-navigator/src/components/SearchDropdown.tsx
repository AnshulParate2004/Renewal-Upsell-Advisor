import { useState, useRef, useEffect } from "react";
import { Search, Building2, TrendingUp, TrendingDown, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { accounts } from "@/data/mockData";

export function SearchDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter accounts based on search query
    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.csm.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8); // Limit to 8 results

    const handleAccountClick = (accountId: string) => {
        navigate(`/app/accounts/${accountId}`);
        setIsOpen(false);
        setSearchQuery("");
    };

    const getRiskColor = (riskScore: number) => {
        if (riskScore >= 70) return "text-destructive";
        if (riskScore >= 40) return "text-orange-500";
        return "text-primary";
    };

    const getRiskIcon = (riskScore: number) => {
        return riskScore >= 50 ? TrendingDown : TrendingUp;
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-md group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40 z-10 group-focus-within:text-primary transition-colors" />
            <input
                type="text"
                placeholder="PROBE_SYSTEM_INDEX... ⌘K"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
                className="h-10 w-full border-4 border-foreground bg-white pl-10 pr-12 text-xs font-black text-foreground placeholder:text-foreground/10 focus:outline-none focus:bg-primary/5 shadow-[2px_2px_0px_0px_hsl(var(--foreground))] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all uppercase tracking-widest"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 border-2 border-foreground bg-secondary text-[8px] font-black pointer-events-none">
                <Command size={8} />
                <span>K</span>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-4 w-full max-h-[500px] overflow-y-auto bg-white border-4 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))] z-50 custom-scrollbar paper-card"
                    >
                        {searchQuery === "" ? (
                            // Show recent/suggested when no search query
                            <div className="p-4">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] mb-4 italic">
                                    // RECENT_NODES
                                </p>
                                <div className="space-y-1">
                                    {accounts.slice(0, 5).map((account) => {
                                        const RiskIcon = getRiskIcon(account.riskScore);
                                        return (
                                            <div
                                                key={account.id}
                                                onClick={() => handleAccountClick(account.id)}
                                                className="flex items-center gap-4 p-3 hover:bg-secondary/20 cursor-pointer border-b-2 border-foreground/5 last:border-0 group/item transition-colors"
                                            >
                                                <div className="h-10 w-10 flex items-center justify-center bg-white border-2 border-foreground shadow-[1px_1px_0_0_hsl(var(--foreground))] group-hover/item:shadow-none group-hover/item:translate-x-[1px] group-hover/item:translate-y-[1px] transition-all">
                                                    <Building2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-foreground uppercase tracking-tight font-display italic group-hover/item:text-primary transition-colors">
                                                        {account.name}
                                                    </p>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                                        {account.industry} // {account.csm}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <RiskIcon className={`h-4 w-4 ${getRiskColor(account.riskScore)}`} />
                                                    <span className="text-xs font-black text-foreground tracking-widest">
                                                        ${(account.arr / 1000).toFixed(0)}K
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : filteredAccounts.length > 0 ? (
                            // Show search results
                            <div className="p-4">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] mb-4 italic">
                                    // {filteredAccounts.length} SIGNAL{filteredAccounts.length !== 1 ? 'S' : ''}_DETECTED
                                </p>
                                <div className="space-y-1">
                                    {filteredAccounts.map((account) => {
                                        const RiskIcon = getRiskIcon(account.riskScore);
                                        return (
                                            <div
                                                key={account.id}
                                                onClick={() => handleAccountClick(account.id)}
                                                className="flex items-center gap-4 p-3 hover:bg-secondary/20 cursor-pointer border-b-2 border-foreground/5 last:border-0 group/item transition-colors"
                                            >
                                                <div className="h-10 w-10 flex items-center justify-center bg-white border-2 border-foreground shadow-[1px_1px_0_0_hsl(var(--foreground))] group-hover/item:shadow-none group-hover/item:translate-x-[1px] group-hover/item:translate-y-[1px] transition-all">
                                                    <Building2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-foreground uppercase tracking-tight font-display italic group-hover/item:text-primary transition-colors">
                                                        {account.name}
                                                    </p>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                                        {account.industry} // {account.csm}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <RiskIcon className={`h-4 w-4 ${getRiskColor(account.riskScore)}`} />
                                                    <span className="text-xs font-black text-foreground tracking-widest">
                                                        ${(account.arr / 1000).toFixed(0)}K
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            // No results
                            <div className="p-10 text-center">
                                <Search className="h-12 w-12 text-foreground/10 mx-auto mb-4" />
                                <p className="text-sm font-black text-foreground uppercase tracking-widest italic">
                                    NULL_RESULT_SET
                                </p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">
                                    PROBE_RETRY_REQUIRED
                                </p>
                            </div>
                        )}

                        {/* Quick Actions Footer */}
                        <div className="border-t-4 border-foreground p-4 bg-secondary">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <span className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white border-2 border-foreground rounded shadow-[1px_1px_0_0_hsl(var(--foreground))]">↑↓</kbd> NAV_INDEX
                                </span>
                                <span className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white border-2 border-foreground rounded shadow-[1px_1px_0_0_hsl(var(--foreground))]">↵</kbd> EXEC_LINK
                                </span>
                                <span className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white border-2 border-foreground rounded shadow-[1px_1px_0_0_hsl(var(--foreground))]">ESC</kbd> ABORT
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
