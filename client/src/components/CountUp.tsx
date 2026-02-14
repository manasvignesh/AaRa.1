import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CountUpProps {
    value: number;
    duration?: number;
    decimals?: number;
}

export const CountUp: React.FC<CountUpProps> = ({ value, duration = 2, decimals = 0 }) => {
    const springValue = useSpring(0, {
        duration: duration * 1000,
        bounce: 0,
    });

    const display = useTransform(springValue, (latest) =>
        latest.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })
    );

    useEffect(() => {
        springValue.set(value);
    }, [value, springValue]);

    return <motion.span>{display}</motion.span>;
};
