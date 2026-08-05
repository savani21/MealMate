import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
export const fadeUpVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};
export function AnimatedSection({ children, className = '', id, delay = 0 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.15 });
    return (<motion.section id={id} ref={ref} className={className} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={{
            hidden: { opacity: 0, y: 40 },
            visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: "easeOut", delay }
            }
        }}>
      {children}
    </motion.section>);
}
