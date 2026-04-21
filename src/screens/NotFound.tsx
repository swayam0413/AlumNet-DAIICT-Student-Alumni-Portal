import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-8">
      <div className="text-center max-w-md space-y-8">
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
          <span className="text-5xl font-headline font-black text-primary">404</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight">Page Not Found</h1>
          <p className="text-stone-500 font-medium">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Home
          </button>
        </div>
      </div>
    </div>
  );
}
