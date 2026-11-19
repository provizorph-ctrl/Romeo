import { motion, useReducedMotion } from 'motion/react';

interface FloatingPetalsProps {
  variant?: 'petals' | 'hearts';
  count?: number;
}

const ITEMS = [
  { left: '8%', delay: 0, duration: 11, size: 14, sway: 18, rotate: 24 },
  { left: '19%', delay: 2.2, duration: 13, size: 12, sway: -16, rotate: -18 },
  { left: '34%', delay: 4.5, duration: 12, size: 16, sway: 22, rotate: 32 },
  { left: '52%', delay: 1.4, duration: 14, size: 13, sway: -20, rotate: -26 },
  { left: '68%', delay: 3.1, duration: 11.5, size: 15, sway: 16, rotate: 20 },
  { left: '81%', delay: 0.7, duration: 13.5, size: 12, sway: -14, rotate: -30 },
  { left: '91%', delay: 5.0, duration: 12.5, size: 14, sway: 15, rotate: 18 },
];

export function FloatingPetals({ variant = 'petals', count = 7 }: FloatingPetalsProps) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  const visibleItems = ITEMS.slice(0, count);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {visibleItems.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ y: -36, x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: ['0vh', '105vh'],
            x: [0, item.sway, -item.sway * 0.6, item.sway * 0.4],
            opacity: [0, 0.55, 0.45, 0],
            rotate: [0, item.rotate, -item.rotate],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ left: item.left, top: '-24px' }}
          className="absolute will-change-transform"
        >
          {variant === 'hearts' ? (
            <svg width={item.size} height={item.size} viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21s-7.5-4.7-9.5-9.2C.9 8.2 3.1 4.5 6.8 4.5c2.2 0 4 1.2 5.2 2.9 1.2-1.7 3-2.9 5.2-2.9 3.7 0 5.9 3.7 4.3 7.3C19.5 16.3 12 21 12 21z"
                fill="#D9A0A6"
                fillOpacity="0.45"
              />
            </svg>
          ) : (
            <svg width={item.size} height={item.size * 1.2} viewBox="0 0 20 24" fill="none">
              <path
                d="M10 1C15 5 18.5 10.5 17 16.5C15.5 21.5 9.5 23.5 5 20.5C0.5 17.5 1 10.5 4.5 5.5C6.5 2.7 8.5 1.5 10 1Z"
                fill={idx % 2 === 0 ? '#F4D9DA' : '#D9A0A6'}
                fillOpacity="0.55"
              />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
}
