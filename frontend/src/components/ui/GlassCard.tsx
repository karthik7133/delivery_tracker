import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
  glow?: boolean;
  className?: string;
}

export default function GlassCard({ hover = true, glow = false, className = '', children, ...props }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`glass rounded-2xl p-6 ${glow ? 'glow-emerald' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
