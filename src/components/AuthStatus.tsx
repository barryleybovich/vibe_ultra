import React from 'react';
import { User, LogOut, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthStatusProps {
  user: SupabaseUser;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ user }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <User className="w-4 h-4" />
        <span>{user.email}</span>
      </div>
      
      <button
        onClick={handleSignOut}
        className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </div>
  );
};