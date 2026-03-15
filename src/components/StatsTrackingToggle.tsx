import { BarChart2, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsTrackingToggleProps {
  trackStats: boolean;
  setTrackStats: (value: boolean) => void;
}

export const StatsTrackingToggle = ({ trackStats, setTrackStats }: StatsTrackingToggleProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-300"
    >
      <input
        type="checkbox"
        id="trackStats"
        checked={trackStats}
        onChange={(e) => setTrackStats(e.target.checked)}
        className="w-5 h-5 rounded border-2 border-border bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all duration-200 cursor-pointer"
        style={{
          accentColor: 'var(--primary)',
        }}
      />
      <label
        htmlFor="trackStats"
        className="flex-1 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold text-sm font-body">
            Track Statistics
          </span>
          <span className="text-xs text-muted-foreground">
            {trackStats ? <><BarChart2 className="w-3 h-3 inline-block mr-1" />Recording</> : <><Pause className="w-3 h-3 inline-block mr-1" />Paused</>}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 font-body">
          {trackStats
            ? 'Your practice data is being recorded for analytics'
            : 'Enable to track your performance'}
        </p>
      </label>
    </motion.div>
  );
};

// To integrate into Practice.tsx, add this component in the Controls Panel area or near the board:
// Suggested placement - in the header area or controls section:
/*
  <StatsTrackingToggle
    trackStats={trackStats}
    setTrackStats={setTrackStats}
  />
*/