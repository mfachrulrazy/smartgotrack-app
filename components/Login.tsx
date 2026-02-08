import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

const Login: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // Auth state change will be handled in App.tsx
    } catch (err: any) {
      console.error("Login failed", err);
      
      // Detailed error handling for better developer experience
      if (err.code === 'auth/popup-closed-by-user') {
          setError('Sign-in cancelled.');
      } else if (err.code === 'auth/configuration-not-found') {
          setError('Firebase configuration is missing.');
      } else if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
          setError('Configuration Error: Invalid API Key. Please open "services/firebase.ts" and update the firebaseConfig object with your actual project keys.');
      } else if (err.code === 'auth/operation-not-allowed') {
          setError('Google Sign-In is not enabled. Go to Firebase Console > Authentication > Sign-in method and enable Google.');
      } else if (err.code === 'auth/unauthorized-domain') {
          setError(`Unauthorized Domain. Add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized domains.`);
      } else {
          setError(`Failed to sign in. (${err.code || err.message})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 p-6">
      
      {/* Brand Animation */}
      <div className="mb-8 text-center animate-slide-up">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <i className="fas fa-shopping-basket text-4xl text-emerald-500"></i>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">SmartGotrack</h1>
        <p className="text-emerald-100 mt-2">Intelligently Track Your Expenses</p>
      </div>

      {/* Login Card */}
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to sync your expenses</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 text-center border border-red-100 leading-relaxed">
                <i className="fas fa-exclamation-circle mb-1 text-sm"></i><br/>
                {error}
            </div>
        )}

        <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm hover:shadow-md group"
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
            ) : (
                <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="w-5 h-5"
                />
            )}
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>

        <p className="text-xs text-center text-gray-400 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
      
      <p className="text-white/60 text-xs mt-8 absolute bottom-6">
        &copy; {new Date().getFullYear()} SmartGotrack.
      </p>
    </div>
  );
};

export default Login;
