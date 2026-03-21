import { Analytics } from "@vercel/analytics/next"
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Lightbulb, Info, Mail, Briefcase } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Home = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showChessLines, setShowChessLines] = useState(false);

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

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/home.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-0 bg-background/75 backdrop-blur-sm" />

      {/* Content Container - NO SCROLLING */}
      <div className="relative z-10 w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center p-4 md:p-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">♔</span>
            <span className="font-display text-lg text-primary font-bold">Chess Lines</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm font-body hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm font-body text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-all duration-300"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 pb-4 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-4xl flex flex-col items-center gap-3 py-4">
            {/* Title Section */}
            <div className="text-center animate-fade-in">
              <div className="text-5xl md:text-6xl lg:text-7xl mb-3">
                ♔
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-2 tracking-wide">
                Chess <span className="text-primary">Lines</span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground font-body max-w-md mx-auto">
                Master your opening repertoire with precision
              </p>
            </div>

            {/* Educational Message / Info Button - Desktop: Full Card, Mobile: Button */}
            <div className="w-full animate-fade-in">
              {/* Mobile: Show as button */}
              <div className="block md:hidden">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowChessLines(true);
                  }}
                  type="button"
                  className="w-full group relative overflow-hidden bg-card/80 backdrop-blur-md border-2 border-primary/30 text-foreground font-body font-semibold px-5 py-3 rounded-xl shadow-lg transition-all duration-300 hover:border-primary/60 hover:scale-105"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    <span className="text-base">What are Chess Lines?</span>
                  </span>
                </button>
              </div>

              {/* Desktop: Show as expanded card */}
              <div className="hidden md:block">
                <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-4 md:p-6 lg:p-8 shadow-lg overflow-hidden">
                  <div className="flex items-start gap-3 md:gap-4">
                    <Lightbulb className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 text-primary" />
                    <div>
                      <h2 className="font-display text-base md:text-lg lg:text-xl font-bold text-foreground mb-2 md:mb-4">
                        What are Chess Lines?
                      </h2>
                      <p className="text-muted-foreground font-body leading-relaxed text-xs sm:text-sm md:text-base">
                        A chess line is like a possible story of how a game can unfold. Each move leads to
                       different paths, and over time you start to recognize which paths appear most often
                       in your own games. This app is designed to help you learn and improve your own
                        lines the positions and move sequences that frequently occur in games you've
                        already played. Chess growth happens in stages. It doesn't begin with memorizing
                         openings. First, you learn how to handle the middlegame and endgame.
                         Eventually, you realize that the key to success is simply surviving the
                         opening with an equal position or a small advantage.

                         That understanding comes from analyzing your own games. By reviewing them, you
                          identify recurring patterns and critical moments. This app lets you practice
                          those exact lines, so repetition builds memory, decision-making becomes faster,
                         and playing those positions starts to feel natural.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* START TRAINING BUTTON */}
            <div className="w-full max-w-md animate-fade-in">
              <button
                onClick={() => navigate('/practice')}
                className="relative w-full group overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-cyan-600 text-white font-display font-bold text-lg sm:text-xl md:text-2xl py-5 sm:py-6 md:py-8 px-6 sm:px-8 md:px-10 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50"
                style={{
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.3), 0 10px 40px -10px rgba(6, 182, 212, 0.5)',
                }}
              >
                {/* Animated Glow Effect */}
                <div
                  className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
                  }}
                />

                {/* Chess Pattern Overlay */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px),
                      repeating-linear-gradient(-45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)
                    `,
                  }}
                />

                {/* Button Content */}
                <span className="relative z-10 tracking-wide">
                  Start Training
                </span>
              </button>
            </div>

            {/* About Us & Contact Buttons */}
            <div className="flex gap-3 md:gap-4 flex-wrap justify-center animate-fade-in mb-4">
              {/* ABOUT US BUTTON */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAbout(true);
                }}
                type="button"
                className="group relative overflow-hidden bg-card/80 backdrop-blur-md border-2 border-primary/30 text-foreground font-body font-semibold px-5 sm:px-6 md:px-8 py-2 md:py-3 rounded-xl shadow-lg transition-all duration-300 hover:border-primary/60 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Info className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-sm md:text-base">About Us</span>
                </span>
              </button>

              {/* CONTACT US BUTTON */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowContact(true);
                }}
                type="button"
                className="group relative overflow-hidden bg-card/80 backdrop-blur-md border-2 border-primary/30 text-foreground font-body font-semibold px-5 sm:px-6 md:px-8 py-2 md:py-3 rounded-xl shadow-lg transition-all duration-300 hover:border-primary/60 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Mail className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-sm md:text-base">Contact Us</span>
                </span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* WHAT ARE CHESS LINES DIALOG (Mobile) */}
      <Dialog open={showChessLines} onOpenChange={setShowChessLines} modal>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-2 border-primary/20 sm:rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl md:text-3xl font-bold text-primary flex items-center gap-3">
              <Lightbulb className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              What are Chess Lines?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-foreground/90 font-body leading-relaxed text-sm md:text-base">
                A chess line is like a possible story of how a game can unfold. Each move leads to
                different paths, and over time you start to recognize which paths appear most often
                in your own games.
              </p>

              <p className="text-foreground/90 font-body leading-relaxed text-sm md:text-base">
                This app is designed to help you learn and improve your own lines — the positions
                and move sequences that frequently occur in games you've already played.
              </p>

              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg my-4">
                <p className="text-foreground/90 font-body leading-relaxed text-sm md:text-base mb-2">
                  <strong className="text-primary">How Chess Growth Works:</strong>
                </p>
                <p className="text-foreground/80 font-body leading-relaxed text-sm">
                  Chess growth happens in stages. It doesn't begin with memorizing openings.
                  First, you learn how to handle the middlegame and endgame. Eventually, you
                  realize that the key to success is simply surviving the opening with an equal
                  position or a small advantage.
                </p>
              </div>

              <p className="text-foreground/90 font-body leading-relaxed text-sm md:text-base">
                That understanding comes from analyzing your own games. By reviewing them, you
                identify recurring patterns and critical moments. This app lets you practice
                those exact lines, so repetition builds memory, decision-making becomes faster,
                and playing those positions starts to feel natural.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ABOUT US DIALOG */}
      <Dialog open={showAbout} onOpenChange={setShowAbout} modal>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-2 border-primary/20 sm:rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-bold text-primary flex items-center gap-3">
              <span className="text-4xl">♔</span>
              About Us
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-foreground/90 font-body leading-relaxed text-base">
                This chess training platform was created with a simple goal: to help players practice
                and master their prepared lines in a focused, distraction-free environment.
              </p>

              <p className="text-foreground/90 font-body leading-relaxed text-base">
                The application is designed specifically for opening and line training, allowing users
                to repeatedly practice their variations, improve recall, and build confidence over the
                board. Rather than overwhelming players with endless features, the platform emphasizes
                clarity, precision, and purposeful practice.
              </p>

              <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg my-6">
                <p className="text-foreground/90 font-body leading-relaxed text-base mb-2">
                  <strong className="text-primary">Development:</strong>
                </p>
                <p className="text-foreground/80 font-body leading-relaxed text-sm">
                  Development of this project is led by <strong className="text-primary">Elias Metsing</strong>,
                  a member of the <strong className="text-primary">Dev Tech Squad</strong>, a collaborative
                  community of developers passionate about building practical, well-engineered software solutions.
                </p>
              </div>

              <p className="text-foreground/90 font-body leading-relaxed text-base">
                Being part of Dev Tech Squad encourages continuous learning, clean design, and thoughtful
                problem-solving — values that strongly influence the way this platform is built.
              </p>

              <p className="text-foreground/90 font-body leading-relaxed text-base">
                This project is continuously evolving, with future improvements focused on usability,
                performance, and enhanced training insights, while always preserving the integrity of
                the chess experience.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONTACT US DIALOG */}
      <Dialog open={showContact} onOpenChange={setShowContact} modal>
        <DialogContent
          className="max-w-md bg-card/95 backdrop-blur-xl border-2 border-primary/20 sm:rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-bold text-primary flex items-center gap-3">
              <Mail className="w-10 h-10 text-primary" />
              Contact Us
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-body mt-2">
              Get in touch with the development team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6">

            {/* Email Contact */}
            <a
              href="mailto:metsingelias@gmail.com"
              className="flex items-center gap-4 p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all duration-300 group"
            >
              <Mail className="w-8 h-8 group-hover:scale-110 transition-transform text-primary" />
              <div>
                <p className="font-semibold text-foreground font-body">Email</p>
                <p className="text-sm text-muted-foreground">metsingelias@gmail.com</p>
              </div>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/elias-metsing-316b2120a/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all duration-300 group"
            >
              <Briefcase className="w-8 h-8 group-hover:scale-110 transition-transform text-primary" />
              <div>
                <p className="font-semibold text-foreground font-body">LinkedIn</p>
                <p className="text-sm text-muted-foreground">Elias Metsing</p>
              </div>
            </a>

            {/* Developer Info */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground font-body text-center">
                Developed by <span className="text-primary font-semibold">Elias Metsing</span>
                <br />
                <span className="text-xs">Member of Dev Tech Squad</span>
              </p>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;