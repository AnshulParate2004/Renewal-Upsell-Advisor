import { useState, useRef, useEffect } from "react";
import { Search, Building2, TrendingUp, TrendingDown, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAccounts } from "@/hooks/useAccounts";

export function SearchDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { data: accounts = [] } = useAccounts();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (account.industry && account.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (account.csm && account.csm.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 8);

    const handleAccountClick = (accountId: string) => {
        navigate(`/app/accounts/${accountId}`);
        setIsOpen(false);
        setSearchQuery("");
    };

    const getRiskColor = (riskScore: number) => {
        if (riskScore >= 70) return "text-destructive";
        if (riskScore >= 40) return "text-accent";
        return "text-primary";
    };

    const getRiskIcon = (riskScore: number) => {
        return riskScore >= 50 ? TrendingDown : TrendingUp;
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-md group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
            <input
                type="text"
                placeholder="Search accounts... ⌘K"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
                className="h-9 w-full bg-muted/50 border-[0.5px] border-black rounded-xl pl-10 pr-12 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-background border-[0.5px] border-black rounded text-[10px] text-muted-foreground pointer-events-none">
                <Command size={10} />K
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 w-full max-h-[420px] overflow-y-auto bg-card border-[0.5px] border-black rounded-2xl shadow-xl z-50"
                    >
                        {searchQuery === "" ? (
                            <div className="p-3">
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-3 px-2">
                                    Recent accounts
                                </p>
                                <div className="space-y-0.5">
                                    {accounts.slice(0, 5).map((account) => {
                                        const RiskIcon = getRiskIcon(account.riskScore);
                                        return (
                                            <div
                                                key={account.id}
                                                onClick={() => handleAccountClick(account.id)}
                                                className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-xl cursor-pointer group/item transition-colors"
                                            >
                                                <div className="h-8 w-8 flex items-center justify-center bg-primary/10 rounded-lg">
                                                    <Building2 className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors truncate">
                                                        {account.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {account.industry} · {account.csm}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <RiskIcon className={`h-3.5 w-3.5 ${getRiskColor(account.riskScore)}`} />
                                                    <span className="text-xs font-semibold text-muted-foreground">
                                                        ${((account.arr ?? 0) / 1000).toFixed(0)}K
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : filteredAccounts.length > 0 ? (
                            <div className="p-3">
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-3 px-2">
                                    {filteredAccounts.length} result{filteredAccounts.length !== 1 ? 's' : ''}
                                </p>
                                <div className="space-y-0.5">
                                    {filteredAccounts.map((account) => {
                                        const RiskIcon = getRiskIcon(account.riskScore);
                                        return (
                                            <div
                                                key={account.id}
                                                onClick={() => handleAccountClick(account.id)}
                                                className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-xl cursor-pointer group/item transition-colors"
                                            >
                                                <div className="h-8 w-8 flex items-center justify-center bg-primary/10 rounded-lg">
                                                    <Building2 className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors truncate">
                                                        {account.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {account.industry} · {account.csm}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <RiskIcon className={`h-3.5 w-3.5 ${getRiskColor(account.riskScore)}`} />
                                                    <span className="text-xs font-semibold text-muted-foreground">
                                                        ${((account.arr ?? 0) / 1000).toFixed(0)}K
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">No results found</p>
                            </div>
                        )}

                        <div className="border-t-[0.5px] border-black px-4 py-2.5 bg-muted/30 rounded-b-2xl">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 bg-card border-[0.5px] border-black rounded text-[10px]">↑↓</kbd> Navigate
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 bg-card border-[0.5px] border-black rounded text-[10px]">↵</kbd> Open
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 bg-card border-[0.5px] border-black rounded text-[10px]">Esc</kbd> Close
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
