"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease } },
};

export const stagger = (delayChildren = 0.05, staggerChildren = 0.06): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren, staggerChildren },
  },
});

export function MotionPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger(0.04, 0.07)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({
  children,
  className,
  variants = fadeUp,
  ...rest
}: { children: ReactNode; className?: string; variants?: Variants } & Omit<
  HTMLMotionProps<"div">,
  "variants" | "children"
>) {
  return (
    <motion.div variants={variants} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function MotionList({
  children,
  className,
  delay = 0.05,
  step = 0.06,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  step?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger(delay, step)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const tap = { whileTap: { scale: 0.97 }, whileHover: { y: -1 } };

export const cardHover = {
  whileHover: { y: -3, transition: { duration: 0.2, ease } },
};
