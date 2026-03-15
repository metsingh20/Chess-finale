import { FlipHorizontal2, RotateCcw } from 'lucide-react';
interface MobileBoardControlsProps {
  onReset: () => void;
  onFlip: () => void;
}

export default function MobileBoardControls({ onReset, onFlip }: MobileBoardControlsProps) {
  return (
    // Only show on mobile (sm:hidden)
    <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
      <button
        onClick={onFlip}
        className="p-3 bg-card/90 backdrop-blur-sm text-foreground rounded-l-lg font-semibold hover:bg-card transition-all duration-300 shadow-lg border border-border border-r-0"
        title="Flip Board"
        aria-label="Flip Board"
      >
        <FlipHorizontal2 className="w-5 h-5" />
      </button>
      <button
        onClick={onReset}
        className="p-3 bg-card/90 backdrop-blur-sm text-foreground rounded-l-lg font-semibold hover:bg-card transition-all duration-300 shadow-lg border border-border border-r-0"
        title="Reset Board"
        aria-label="Reset Board"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
    </div>
  );
}