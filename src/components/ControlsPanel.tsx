import { Eye, Target, Bot, RotateCcw, FlipHorizontal2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
interface ControlsPanelProps {
  mode: 'view' | 'guess';
  onSetMode: (mode: 'view' | 'guess') => void;
  onReset: () => void;
  onFlip: () => void;
  onNavigate: (dir: 'first' | 'prev' | 'next' | 'last') => void;
  autoRespond: boolean;
  onToggleAutoRespond: () => void;
  currentMoveSan: string | null;
  message: { text: string; type: 'success' | 'error' } | null;
  boardColor: string;
  onSetBoardColor: (color: string) => void;
}

const colorOptions = [
  { id: 'classic', label: 'Classic Brown', light: '#f0d9b5', dark: '#b58863' },
  { id: 'purple', label: 'Purple', light: '#e0c3fc', dark: '#8b5cf6' },
  { id: 'blue', label: 'Blue', light: '#bfdbfe', dark: '#3b82f6' },
  { id: 'red', label: 'Red', light: '#fecaca', dark: '#dc2626' },
];

export default function ControlsPanel({
  mode,
  onSetMode,
  onReset,
  onFlip,
  onNavigate,
  autoRespond,
  onToggleAutoRespond,
  currentMoveSan,
  message,
  boardColor,
  onSetBoardColor,
}: ControlsPanelProps) {
  return (
    <>
      {/* Desktop: Full panel on right */}
      <div className="hidden sm:block bg-card rounded-xl border border-border shadow-elevated p-5 w-full sm:w-[300px]">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">Controls</h2>

        {/* Mode Selector */}
        <div className="bg-muted rounded-lg p-3 mb-4">
          <h3 className="text-foreground font-semibold text-sm mb-2 font-body">Select Mode</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onSetMode('view')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold font-body transition-all duration-300 ${
                mode === 'view'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="w-4 h-4 inline-block mr-1 align-text-bottom" /> View
            </button>
            <button
              onClick={() => onSetMode('guess')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold font-body transition-all duration-300 ${
                mode === 'guess'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
              }`}
            >
              <Target className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Guess
            </button>
          </div>
        </div>

        {/* Auto Respond (guess mode only) */}
        {mode === 'guess' && (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <h3 className="text-foreground font-semibold text-sm mb-2 font-body">Auto Respond</h3>
            <button
              onClick={onToggleAutoRespond}
              className={`w-full py-2 rounded-md text-sm font-semibold font-body transition-all duration-300 ${
                autoRespond
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-elevated text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bot className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Opponent Auto Respond: {autoRespond ? 'ON' : 'OFF'}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <button
          onClick={onReset}
          className="w-full py-2.5 bg-muted text-foreground rounded-lg font-semibold text-sm hover:bg-surface-elevated transition-all duration-300 mb-2 font-body"
        >
          <RotateCcw className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Reset Board
        </button>
        <button
          onClick={onFlip}
          className="w-full py-2.5 bg-muted text-foreground rounded-lg font-semibold text-sm hover:bg-surface-elevated transition-all duration-300 mb-4 font-body"
        >
          <FlipHorizontal2 className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Flip Board
        </button>

        {/* Navigation (view mode only) */}
        {mode === 'view' && (
          <div className="bg-muted rounded-lg p-3 mb-4">
            <h3 className="text-foreground font-semibold text-sm mb-2 font-body">Navigation</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => onNavigate('first')} className="py-2 bg-surface-elevated text-foreground rounded-md text-sm font-semibold hover:bg-card transition-all duration-300 font-body"><ChevronsLeft className="w-4 h-4 inline-block" /> First</button>
              <button onClick={() => onNavigate('prev')} className="py-2 bg-surface-elevated text-foreground rounded-md text-sm font-semibold hover:bg-card transition-all duration-300 font-body"><ChevronLeft className="w-4 h-4 inline-block" /> Prev</button>
              <button onClick={() => onNavigate('next')} className="py-2 bg-surface-elevated text-foreground rounded-md text-sm font-semibold hover:bg-card transition-all duration-300 font-body">Next <ChevronRight className="w-4 h-4 inline-block" /></button>
              <button onClick={() => onNavigate('last')} className="py-2 bg-surface-elevated text-foreground rounded-md text-sm font-semibold hover:bg-card transition-all duration-300 font-body">Last <ChevronsRight className="w-4 h-4 inline-block" /></button>
            </div>
            <div className="bg-card rounded-md p-2 mt-2">
              <p className="text-muted-foreground text-xs font-body">Current Move:</p>
              <div className="text-foreground text-center font-semibold text-sm font-body mt-1">
                {currentMoveSan || 'Start Position'}
              </div>
            </div>
          </div>
        )}

        {/* Board Colors */}
        <div className="bg-muted rounded-lg p-3">
          <h3 className="text-foreground font-semibold text-sm mb-3 font-body">Board Colors</h3>
          <div className="space-y-2">
            {colorOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onSetBoardColor(option.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-300 border-2 ${
                  boardColor === option.id
                    ? 'bg-primary/20 border-primary/40'
                    : 'bg-surface-elevated border-transparent hover:border-border'
                }`}
              >
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded-sm border border-foreground/10" style={{ background: option.light }} />
                  <div className="w-5 h-5 rounded-sm border border-foreground/10" style={{ background: option.dark }} />
                </div>
                <span className="text-foreground font-semibold text-sm font-body">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center font-semibold text-sm font-body transition-all duration-300 ${
            message.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Mobile: Compact controls below board */}
      <div className="block sm:hidden w-full space-y-3">
        {/* Mode Selector & Quick Actions Row */}
        <div className="flex gap-2 items-center">
          {/* Mode Selector */}
          <div className="flex gap-1 flex-1 bg-muted rounded-lg p-1.5">
            <button
              onClick={() => onSetMode('view')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold font-body transition-all duration-300 ${
                mode === 'view'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-elevated text-muted-foreground'
              }`}
            >
              <Eye className="w-4 h-4 inline-block mr-1 align-text-bottom" /> View
            </button>
            <button
              onClick={() => onSetMode('guess')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold font-body transition-all duration-300 ${
                mode === 'guess'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-elevated text-muted-foreground'
              }`}
            >
              <Target className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Guess
            </button>
          </div>

          {/* Quick Action Icons */}
          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="p-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-surface-elevated transition-all duration-300"
              title="Reset Board"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onFlip}
              className="p-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-surface-elevated transition-all duration-300"
              title="Flip Board"
            >
              <FlipHorizontal2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auto Respond (guess mode only) */}
        {mode === 'guess' && (
          <button
            onClick={onToggleAutoRespond}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold font-body transition-all duration-300 ${
              autoRespond
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-surface-elevated'
            }`}
          >
            <Bot className="w-4 h-4 inline-block mr-1 align-text-bottom" /> Auto Respond: {autoRespond ? 'ON' : 'OFF'}
          </button>
        )}

        {/* Navigation (view mode only) */}
        {mode === 'view' && (
          <div className="bg-muted rounded-lg p-3">
            <div className="grid grid-cols-4 gap-2 mb-2">
              <button onClick={() => onNavigate('first')} className="py-2 bg-surface-elevated text-foreground rounded-md text-xs font-semibold hover:bg-card transition-all duration-300 font-body"><ChevronsLeft className="w-4 h-4 inline-block" /></button>
              <button onClick={() => onNavigate('prev')} className="py-2 bg-surface-elevated text-foreground rounded-md text-xs font-semibold hover:bg-card transition-all duration-300 font-body"><ChevronLeft className="w-4 h-4 inline-block" /></button>
              <button onClick={() => onNavigate('next')} className="py-2 bg-surface-elevated text-foreground rounded-md text-xs font-semibold hover:bg-card transition-all duration-300 font-body"><ChevronRight className="w-4 h-4 inline-block" /></button>
              <button onClick={() => onNavigate('last')} className="py-2 bg-surface-elevated text-foreground rounded-md text-xs font-semibold hover:bg-card transition-all duration-300 font-body"><ChevronsRight className="w-4 h-4 inline-block" /></button>
            </div>
            <div className="bg-card rounded-md p-2">
              <p className="text-muted-foreground text-xs font-body">Current Move:</p>
              <div className="text-foreground text-center font-semibold text-xs font-body mt-1">
                {currentMoveSan || 'Start Position'}
              </div>
            </div>
          </div>
        )}

        {/* Board Colors - Horizontal scroll on mobile */}
        <div className="bg-muted rounded-lg p-3">
          <h3 className="text-foreground font-semibold text-xs mb-2 font-body">Board Colors</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {colorOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onSetBoardColor(option.id)}
                className={`flex-shrink-0 flex items-center gap-2 p-2 rounded-lg transition-all duration-300 border-2 ${
                  boardColor === option.id
                    ? 'bg-primary/20 border-primary/40'
                    : 'bg-surface-elevated border-transparent'
                }`}
              >
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-sm border border-foreground/10" style={{ background: option.light }} />
                  <div className="w-4 h-4 rounded-sm border border-foreground/10" style={{ background: option.dark }} />
                </div>
                <span className="text-foreground font-semibold text-xs font-body whitespace-nowrap">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}