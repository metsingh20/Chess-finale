import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <>
      {/* Royal Curtain Effect - Splits from center */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 0 }}
        exit={{ scaleX: 1 }}
        transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(88, 28, 135, 0.95) 100%)',
          transformOrigin: 'center',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* Checkered Pattern Wipe */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: '100%' }}
        exit={{ x: '0%' }}
        transition={{ duration: 0.5, ease: [0.87, 0, 0.13, 1] }}
        className="fixed inset-0 pointer-events-none z-[9997]"
        style={{
          background: `
            repeating-conic-gradient(
              from 45deg,
              rgba(234, 179, 8, 0.3) 0deg 90deg,
              rgba(139, 92, 246, 0.3) 90deg 180deg
            )
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Particle Burst Effect */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0,
            scale: 0,
            x: '50vw',
            y: '50vh',
          }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
            x: `${50 + Math.cos((i * Math.PI * 2) / 12) * 40}vw`,
            y: `${50 + Math.sin((i * Math.PI * 2) / 12) * 40}vh`,
          }}
          transition={{
            duration: 0.8,
            delay: i * 0.03,
            ease: "easeOut"
          }}
          className="fixed w-3 h-3 rounded-full pointer-events-none z-[9999]"
          style={{
            background: i % 2 === 0 
              ? 'linear-gradient(135deg, #eab308, #f59e0b)' 
              : 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
            boxShadow: '0 0 20px currentColor',
          }}
        />
      ))}

      {/* Main Content with 3D Transform */}
      <motion.div
        initial={{ 
          opacity: 0,
          scale: 0.88,
          rotateY: -15,
          z: -200,
        }}
        animate={{ 
          opacity: 1,
          scale: 1,
          rotateY: 0,
          z: 0,
        }}
        exit={{ 
          opacity: 0,
          scale: 1.1,
          rotateY: 15,
          z: -200,
          filter: 'blur(10px) brightness(0.7)',
        }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
          opacity: { duration: 0.4 },
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          transformStyle: 'preserve-3d',
          perspective: '2000px',
        }}
      >
        {/* Radial Glow Pulse */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 0.4, 0],
            scale: [0.5, 1.5, 2],
          }}
          transition={{ 
            duration: 1,
            ease: "easeOut"
          }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 50% 50%, 
                rgba(234, 179, 8, 0.4) 0%, 
                rgba(139, 92, 246, 0.2) 40%,
                transparent 70%
              )
            `,
            mixBlendMode: 'screen',
          }}
        />

        {/* Floating Chess Pieces */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotate: -30 }}
          animate={{ 
            opacity: [0, 0.15, 0.15, 0],
            y: [50, -20, -40, -100],
            rotate: [-30, -10, 5, 30],
            scale: [0.8, 1, 1.1, 1.2],
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/4 left-1/4 pointer-events-none text-[180px]"
          style={{ 
            filter: 'blur(1px)',
            textShadow: '0 0 40px rgba(234, 179, 8, 0.6)',
          }}
        >
          ♔
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, rotate: 30 }}
          animate={{ 
            opacity: [0, 0.15, 0.15, 0],
            y: [50, -20, -40, -100],
            rotate: [30, 10, -5, -30],
            scale: [0.8, 1, 1.1, 1.2],
          }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
          className="absolute top-1/3 right-1/4 pointer-events-none text-[180px]"
          style={{ 
            filter: 'blur(1px)',
            textShadow: '0 0 40px rgba(139, 92, 246, 0.6)',
          }}
        >
          ♕
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, rotate: -20 }}
          animate={{ 
            opacity: [0, 0.12, 0.12, 0],
            y: [50, -15, -35, -90],
            rotate: [-20, 0, 10, 25],
            scale: [0.7, 0.9, 1, 1.1],
          }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          className="absolute bottom-1/3 left-1/3 pointer-events-none text-[140px]"
          style={{ 
            filter: 'blur(1px)',
            textShadow: '0 0 30px rgba(234, 179, 8, 0.5)',
          }}
        >
          ♘
        </motion.div>

        {/* Content Reveal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          style={{ width: '100%', height: '100%' }}
        >
          {children}
        </motion.div>
      </motion.div>

      {/* Top/Bottom Gold Sweep */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
        transition={{ 
          duration: 0.8,
          times: [0, 0.3, 0.7, 1],
          ease: "easeInOut"
        }}
        className="fixed top-0 left-0 w-full h-1 pointer-events-none z-[10000]"
        style={{
          background: 'linear-gradient(90deg, transparent, #eab308 20%, #eab308 80%, transparent)',
          boxShadow: '0 0 20px #eab308, 0 0 40px #eab308',
        }}
      />

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
        transition={{ 
          duration: 0.8,
          times: [0, 0.3, 0.7, 1],
          ease: "easeInOut",
          delay: 0.05
        }}
        className="fixed bottom-0 left-0 w-full h-1 pointer-events-none z-[10000]"
        style={{
          background: 'linear-gradient(90deg, transparent, #8b5cf6 20%, #8b5cf6 80%, transparent)',
          boxShadow: '0 0 20px #8b5cf6, 0 0 40px #8b5cf6',
        }}
      />

      {/* Corner Accent Pieces */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -45 }}
        animate={{ opacity: [0, 0.3, 0], scale: [0, 1, 0], rotate: [-45, 0, 45] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-8 left-8 text-6xl pointer-events-none z-[9999]"
        style={{ 
          color: '#eab308',
          textShadow: '0 0 30px #eab308',
          filter: 'blur(0.5px)',
        }}
      >
        ♜
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: 45 }}
        animate={{ opacity: [0, 0.3, 0], scale: [0, 1, 0], rotate: [45, 0, -45] }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="fixed top-8 right-8 text-6xl pointer-events-none z-[9999]"
        style={{ 
          color: '#8b5cf6',
          textShadow: '0 0 30px #8b5cf6',
          filter: 'blur(0.5px)',
        }}
      >
        ♞
      </motion.div>
    </>
  );
};

export default PageTransition;