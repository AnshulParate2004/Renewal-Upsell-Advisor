import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CountUpProps {
    value: number;
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

export default function CountUp({
    value,
    duration = 1.5,
    className = "",
    prefix = "",
    suffix = "",
    decimals = 0
}: CountUpProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const spring = useSpring(0, {
        duration: duration * 1000,
        bounce: 0
    });

    const display = useTransform(spring, (latest) => {
        return prefix + latest.toFixed(decimals) + suffix;
    });

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    useEffect(() => {
        const unsubscribe = display.on("change", (latest) => {
            setDisplayValue(parseFloat(latest.replace(prefix, "").replace(suffix, "")));
        });
        return unsubscribe;
    }, [display, prefix, suffix]);

    return (
        <motion.span className={className}>
            {prefix}{displayValue.toFixed(decimals)}{suffix}
        </motion.span>
    );
}
