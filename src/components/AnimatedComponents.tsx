'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Animated Page Container
export const AnimatedPage = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: [0.22, 0.68, 0, 1.15] }}
    className={className}
  >
    {children}
  </motion.div>
);

// Animated Card with hover effects
export const AnimatedCard = ({ 
  children, 
  className = '',
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.5, 
      delay,
      ease: [0.22, 0.68, 0, 1.15] 
    }}
    whileHover={{ 
      y: -6, 
      scale: 1.02,
      transition: { duration: 0.2 } 
    }}
    whileTap={{ scale: 0.98 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Animated List Item
export const AnimatedListItem = ({ 
  children, 
  index = 0,
  className = ''
}: { 
  children: React.ReactNode; 
  index?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ 
      duration: 0.4, 
      delay: index * 0.05,
      ease: [0.22, 0.68, 0, 1.15] 
    }}
    whileHover={{ x: 4 }}
    className={className}
  >
    {children}
  </motion.div>
);

// Animated Button
export const AnimatedButton = ({ 
  children, 
  className = '',
  onClick,
  disabled = false
}: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -2 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    className={className}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </motion.button>
);

// Staggered Children Animation Container
export const StaggerContainer = ({ 
  children, 
  className = '',
  staggerDelay = 0.1
}: { 
  children: React.ReactNode; 
  className?: string;
  staggerDelay?: number;
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Child item for StaggerContainer
export const StaggerItem = ({ 
  children, 
  className = ''
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    transition={{ duration: 0.4, ease: [0.22, 0.68, 0, 1.15] }}
    className={className}
  >
    {children}
  </motion.div>
);

// Animated Fade In
export const FadeIn = ({ 
  children, 
  className = '',
  delay = 0,
  direction = 'up'
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) => {
  const directionMap = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.22, 0.68, 0, 1.15] 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated Scale
export const ScaleIn = ({ 
  children, 
  className = '',
  delay = 0
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ 
      duration: 0.4, 
      delay,
      ease: [0.22, 0.68, 0, 1.15] 
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Floating animation
export const Floating = ({ 
  children, 
  className = ''
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <motion.div
    animate={{ 
      y: [0, -10, 0],
    }}
    transition={{ 
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Pulse animation
export const Pulse = ({ 
  children, 
  className = ''
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <motion.div
    animate={{ 
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1]
    }}
    transition={{ 
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Glow animation
export const Glow = ({ 
  children, 
  className = '',
  color = '#FEC00F'
}: { 
  children: React.ReactNode; 
  className?: string;
  color?: string;
}) => (
  <motion.div
    animate={{ 
      boxShadow: [
        `0 0 5px ${color}40`,
        `0 0 20px ${color}60`,
        `0 0 5px ${color}40`
      ]
    }}
    transition={{ 
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Slide in from side
export const SlideIn = ({ 
  children, 
  className = '',
  direction = 'left',
  delay = 0
}: { 
  children: React.ReactNode; 
  className?: string;
  direction?: 'left' | 'right';
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: direction === 'left' ? -100 : 100 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ 
      duration: 0.5, 
      delay,
      ease: [0.22, 0.68, 0, 1.15] 
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// Animated number counter
export const AnimatedNumber = ({ 
  value, 
  className = ''
}: { 
  value: number; 
  className?: string;
}) => (
  <motion.span
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 0.68, 0, 1.15] }}
    className={className}
  >
    {value.toLocaleString()}
  </motion.span>
);

// Animated progress bar
export const AnimatedProgress = ({ 
  value, 
  className = '',
  color = '#FEC00F'
}: { 
  value: number; 
  className?: string;
  color?: string;
}) => (
  <div className={`h-2 rounded-full overflow-hidden ${className}`} style={{ background: 'rgba(255,255,255,0.1)' }}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1, ease: [0.22, 0.68, 0, 1.15] }}
      className="h-full rounded-full"
      style={{ background: color }}
    />
  </div>
);

// Skeleton loading animation
export const Skeleton = ({ 
  className = ''
}: { 
  className?: string;
}) => (
  <motion.div
    animate={{ 
      opacity: [0.5, 1, 0.5],
    }}
    transition={{ 
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={`bg-gray-300 dark:bg-gray-700 rounded ${className}`}
  />
);