import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const GuestBanner = () => {
  const navigate = useNavigate();
  const { isGuest, getOpeningsRemaining, getLinesRemaining } = useAuth();

  if (!isGuest) return null;

  const openingsRemaining = getOpeningsRemaining();
  const linesRemaining = getLinesRemaining();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-500/10 to-yellow-500/10 border-b border-primary/20 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-foreground" />
              <span className="font-semibold text-sm font-body text-foreground">
                Guest Mode
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm font-body">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Openings:</span>
                <span className={`font-semibold ${openingsRemaining === 0 ? 'text-destructive' : 'text-primary'}`}>
                  {openingsRemaining} left
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">PGN Uploads:</span>
                <span className={`font-semibold ${linesRemaining === 0 ? 'text-destructive' : 'text-primary'}`}>
                  {linesRemaining} left
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors font-body"
          >
            Sign In for Unlimited
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default GuestBanner;