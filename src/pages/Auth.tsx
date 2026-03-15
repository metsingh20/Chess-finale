import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Key, Mail, MailOpen, Lightbulb } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const { signIn, signUp, user, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  // COMPLETELY LOCK SCROLLING - No black space
  useEffect(() => {
    // Prevent ALL scrolling on body and html
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in. Check your inbox for the verification link.');
        } else {
          setError(error.message);
        }
      } else {
        navigate('/');
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(error.message);
        }
      } else {
        // Show the verification dialog
        setSignupEmail(email);
        setShowVerificationDialog(true);
        // Clear the form
        setEmail('');
        setPassword('');
      }
    }

    setLoading(false);
  };

  const handleGuestClick = () => {
    continueAsGuest();
    navigate('/');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const emailResult = emailSchema.safeParse(resetEmail);
    if (!emailResult.success) {
      setResetError(emailResult.error.errors[0].message);
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setResetError(error.message);
      } else {
        setResetSuccess('Password reset link sent! Check your email.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetEmail('');
          setResetSuccess('');
        }, 3000);
      }
    } catch (err) {
      setResetError('An error occurred. Please try again.');
    }

    setResetLoading(false);
  };

  const handleCloseVerificationDialog = () => {
    setShowVerificationDialog(false);
    setIsLogin(true); // Switch to login tab
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center p-4" style={{ background: 'var(--gradient-hero)' }}>
      {/* Decorative chess pieces */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <span className="absolute top-10 left-10 text-[120px]">♔</span>
        <span className="absolute top-20 right-20 text-[100px]">♛</span>
        <span className="absolute bottom-10 left-1/4 text-[80px]">♞</span>
        <span className="absolute bottom-20 right-10 text-[90px]">♜</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card rounded-2xl p-8 shadow-elevated border border-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-5xl mb-3"
            >
              ♔
            </motion.div>
            <h1 className="text-2xl font-display font-bold text-primary">Chess Lines</h1>
            <p className="text-muted-foreground mt-1 font-body text-sm">Master Your Openings</p>
          </div>

          {/* Tab Switch */}
          <div className="flex bg-muted rounded-lg p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold font-body transition-all duration-300 ${
                isLogin
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold font-body transition-all duration-300 ${
                !isLogin
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 font-body"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-foreground font-body">
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:text-primary/80 transition-colors font-body"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 font-body"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-body"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm font-body"
                >
                  {success}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 gradient-gold text-primary-foreground font-semibold rounded-lg transition-all duration-300 hover:shadow-gold hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-body"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : isLogin ? 'Sign In' : 'Create Account'}
              </button>

              {/* Guest Button */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-body">
                    Or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuestClick}
                className="w-full py-3 bg-muted text-foreground font-semibold rounded-lg transition-all duration-300 hover:bg-muted/80 hover:scale-[1.02] font-body border border-border"
              >
                <span className="flex items-center justify-center gap-2">
                  <User className="w-5 h-5" />
                  Continue as Guest
                </span>
              </button>

              <p className="text-center text-xs text-muted-foreground font-body mt-2">
                Guest mode: Try 5 openings & upload 5 PGN files
              </p>
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword} modal>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-2 border-primary/30 sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-primary flex items-center gap-3 justify-center">
              <Key className="w-10 h-10 text-primary" />
              Reset Password
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">
                Email Address
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 font-body"
                placeholder="your@email.com"
                required
              />
              <p className="text-muted-foreground font-body text-xs mt-2">
                We'll send you a link to reset your password
              </p>
            </div>

            {resetError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-body"
              >
                {resetError}
              </motion.div>
            )}

            {resetSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm font-body"
              >
                {resetSuccess}
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetError('');
                  setResetSuccess('');
                }}
                className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-lg transition-all duration-300 hover:bg-muted/80 font-body"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="flex-1 py-3 gradient-gold text-primary-foreground font-semibold rounded-lg transition-all duration-300 hover:shadow-gold hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-body"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog} modal>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-2 border-primary/30 sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-primary flex items-center gap-3 justify-center">
              <Mail className="w-12 h-12 text-primary" />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 text-center py-4">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                Verify Your Email
              </h3>
              <p className="text-muted-foreground font-body text-sm">
                We've sent a verification link to:
              </p>
              <p className="text-primary font-semibold font-body text-base mt-2">
                {signupEmail}
              </p>
            </div>

            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg text-left">
              <p className="text-foreground/90 font-body text-sm leading-relaxed">
                <strong className="text-primary flex items-center gap-1"><MailOpen className="w-4 h-4 inline-block" /> Check your inbox</strong>
                <br />
                Click the verification link in the email to activate your account.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-left">
              <p className="text-muted-foreground font-body text-xs leading-relaxed">
                <strong className="text-foreground flex items-center gap-1"><Lightbulb className="w-4 h-4 inline-block" /> Didn't receive the email?</strong>
                <br />
                • Check your spam/junk folder
                <br />
                • Make sure you entered the correct email
                <br />
                • Wait a few minutes for the email to arrive
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCloseVerificationDialog}
                className="w-full py-3 gradient-gold text-primary-foreground font-semibold rounded-lg transition-all duration-300 hover:shadow-gold hover:scale-[1.02] font-body"
              >
                Got it! Go to Sign In
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;