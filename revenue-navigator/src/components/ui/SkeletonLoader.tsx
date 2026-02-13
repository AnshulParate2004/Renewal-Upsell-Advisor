import { motion } from "framer-motion";

interface SkeletonLoaderProps {
    type?: "card" | "table" | "text";
    rows?: number;
    className?: string;
}

export default function SkeletonLoader({
    type = "card",
    rows = 5,
    className = ""
}: SkeletonLoaderProps) {
    if (type === "card") {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] ${className}`}
            >
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
            </motion.div>
        );
    }

    if (type === "table") {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`space-y-2 ${className}`}
            >
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4 p-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                    </div>
                ))}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`animate-pulse space-y-2 ${className}`}
        >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </motion.div>
    );
}
