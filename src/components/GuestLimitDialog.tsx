import { Crown, FolderOpen, Save, BarChart2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface GuestLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'openings' | 'lines';
}

const GUEST_LIMIT = 5;

const GuestLimitDialog = ({ open, onOpenChange, limitType }: GuestLimitDialogProps) => {
  const navigate = useNavigate();
  const { getOpeningsRemaining, getLinesRemaining } = useAuth();

  const openingsUsed = GUEST_LIMIT - getOpeningsRemaining();
  const linesUsed = GUEST_LIMIT - getLinesRemaining();

  const handleSignIn = () => {
    navigate('/auth');
  };

  const limitText = limitType === 'openings'
    ? `You've reached the limit of ${GUEST_LIMIT} openings for guest users.`
    : `You've reached the limit of ${GUEST_LIMIT} PGN uploads for guest users.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-2 border-primary/30 sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold text-primary flex items-center gap-3 justify-center">
            <Crown className="w-10 h-10 text-primary" />
            Upgrade to Continue
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {limitText}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Limits */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-foreground mb-3 font-body">
              Guest Mode Limits:
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-body">
                <span className="text-muted-foreground">Openings</span>
                <span className={`font-semibold ${openingsUsed >= GUEST_LIMIT ? 'text-destructive' : 'text-foreground'}`}>
                  {openingsUsed} / {GUEST_LIMIT} used
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-body">
                <span className="text-muted-foreground">PGN Uploads</span>
                <span className={`font-semibold ${linesUsed >= GUEST_LIMIT ? 'text-destructive' : 'text-foreground'}`}>
                  {linesUsed} / {GUEST_LIMIT} used
                </span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
            <p className="font-semibold text-foreground mb-3 text-sm font-body">
              <Sparkles className="w-4 h-4 inline-block mr-1 text-primary" /> Sign In for Unlimited Access:
            </p>
            <ul className="space-y-2 text-sm text-foreground/90 font-body">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">♔</span>
                <span>Unlimited openings</span>
              </li>
              <li className="flex items-start gap-2">
                <FolderOpen className="w-4 h-4 text-primary mt-0.5" />
                <span>Unlimited PGN uploads</span>
              </li>
              <li className="flex items-start gap-2">
                <Save className="w-4 h-4 text-primary mt-0.5" />
                <span>Save your progress</span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart2 className="w-4 h-4 text-primary mt-0.5" />
                <span>Track your statistics</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignIn}
              className="w-full py-3 gradient-gold text-primary-foreground font-semibold rounded-lg transition-all duration-300 hover:shadow-gold font-body"
            >
              Sign In / Create Account
            </motion.button>
            <button
              onClick={() => onOpenChange(false)}
              className="w-full py-2.5 bg-muted text-foreground font-medium rounded-lg transition-all duration-300 hover:bg-muted/80 text-sm font-body"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestLimitDialog;