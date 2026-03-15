import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './Home';

const Index = () => {
  const { user, isGuest, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if NOT loading, NOT logged in, AND NOT in guest mode
    if (!loading && !user && !isGuest) {
      navigate('/auth');
    }
  }, [user, isGuest, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">♔</div>
          <p className="text-muted-foreground font-body">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if user is logged in OR in guest mode
  if (!user && !isGuest) return null;

  return <Home />;
};

export default Index;