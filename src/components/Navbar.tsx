
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-[#333]" />
          <span className="font-bold text-xl text-[#333]">mapmypaper</span>
        </Link>
        
        <div>
          {user ? (
            <Button 
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
            >
              Sign Out
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/auth')}
              variant="ghost"
              size="sm"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
