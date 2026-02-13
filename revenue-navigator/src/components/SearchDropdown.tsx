import { useState, useRef, useEffect } from "react";
import { Search, Building2, User, TrendingUp, TrendingDown } from "lucide-react";
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
        if (riskScore >= 70) return "text-red-600";
        if (riskScore >= 40) return "text-orange-500";
        return "text-green-600";
    };

    const getRiskIcon = (riskScore: number) => {
        return riskScore >= 50 ? TrendingDown : TrendingUp;
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
            <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                type="text"
                placeholder="Search accounts, contracts... ⌘K"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
                className="h-9 w-full border-2 border-black dark:border-white bg-white dark:bg-gray-800 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
            />

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-2 w-full max-h-[500px] overflow-y-auto bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] z-50 custom-scrollbar"
                    >
                        {searchQuery === "" ? (
                            // Show recent/suggested when no search query
                            <div className="p-3">
                                <p className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-2">
                                    Recent Accounts
                                </p>
                                {accounts.slice(0, 5).map((account) => {
                                    const RiskIcon = getRiskIcon(account.riskScore);
                                    return (
                                        <motion.div
                                            key={account.id}
                                            whileHover={{ x: 4 }}
                                            onClick={() => handleAccountClick(account.id)}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-0"
                                        >
                                            <div className="h-8 w-8 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 border border-black dark:border-white">
                                                <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-black dark:text-white truncate">
                                                    {account.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {account.industry} • {account.csm}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RiskIcon className={`h-4 w-4 ${getRiskColor(account.riskScore)}`} />
                                                <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                                                    ${(account.arr / 1000).toFixed(0)}K
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : filteredAccounts.length > 0 ? (
                            // Show search results
                            <div className="p-3">
                                <p className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 mb-2">
                                    {filteredAccounts.length} Result{filteredAccounts.length !== 1 ? 's' : ''}
                                </p>
                                {filteredAccounts.map((account) => {
                                    const RiskIcon = getRiskIcon(account.riskScore);
                                    return (
                                        <motion.div
                                            key={account.id}
                                            whileHover={{ x: 4 }}
                                            onClick={() => handleAccountClick(account.id)}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-0"
                                        >
                                            <div className="h-8 w-8 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 border border-black dark:border-white">
                                                <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-black dark:text-white truncate">
                                                    {account.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {account.industry} • {account.csm}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RiskIcon className={`h-4 w-4 ${getRiskColor(account.riskScore)}`} />
                                                <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                                                    ${(account.arr / 1000).toFixed(0)}K
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            // No results
                            <div className="p-6 text-center">
                                <Search className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                    No accounts found
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Try searching by company name, industry, or CSM
                                </p>
                            </div>
                        )}

                        {/* Quick Actions Footer */}
                        {searchQuery === "" && (
                            <div className="border-t-2 border-black dark:border-white p-2 bg-gray-50 dark:bg-gray-900">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400 font-mono">
                                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">↑↓</kbd> Navigate
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400 font-mono">
                                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">↵</kbd> Select
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400 font-mono">
                                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">ESC</kbd> Close
                                    </span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
