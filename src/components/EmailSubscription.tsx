import React, { useState, useEffect } from 'react';
import { Mail, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthForm } from './AuthForm';
import type { Session } from '@supabase/supabase-js';

interface EmailSubscriptionProps {
  session: Session | null;
  onAuthSuccess: () => void;
}

export const EmailSubscription: React.FC<EmailSubscriptionProps> = ({ 
  session, 
  onAuthSuccess 
}) => {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubscribe = async () => {
    if (!session) {
      setShowAuthForm(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Here you would typically save the user's email subscription preference
      // For now, we'll just simulate the subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscribed(true);
    } catch (err) {
      setError('Failed to subscribe to email notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      // Here you would typically remove the user's email subscription preference
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscribed(false);
    } catch (err) {
      setError('Failed to unsubscribe from email notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthForm(false);
    onAuthSuccess();
    // After successful auth, automatically subscribe
    setTimeout(() => {
      handleSubscribe();
    }, 500);
  };

  if (showAuthForm && !session) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-center mb-4">
          <Bell className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Sign up for Daily Workout Emails
          </h3>
          <p className="text-gray-600 text-sm">
            Get your daily workout delivered to your inbox every morning
          </p>
        </div>
        
        <AuthForm onAuthSuccess={handleAuthSuccess} />
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAuthForm(false)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (subscribed) {
    return (
      <div className="bg-green-50 rounded-lg border border-green-200 p-4">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <div className="flex-1">
            <h4 className="font-medium text-green-900">
              Email notifications enabled
            </h4>
            <p className="text-sm text-green-700">
              You'll receive daily workout emails at {session?.user.email}
            </p>
          </div>
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="text-sm text-green-700 hover:text-green-900 font-medium disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Unsubscribe'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
      <div className="flex items-start">
        <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 mb-1">
            Get Daily Workout Emails
          </h4>
          <p className="text-sm text-blue-800 mb-3">
            Receive your daily workout, fitness metrics, and training tips delivered 
            to your inbox every morning.
          </p>
          
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Subscribe to Daily Emails
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};