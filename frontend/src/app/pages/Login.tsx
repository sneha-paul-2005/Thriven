import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../components/Button';
import { LogoIcon } from '../components/LogoIcon';
import { api, saveToken } from '../services/api';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      if (data.access_token) {
        saveToken(data.access_token, data.startup_name);
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await res.json();
        const data = await fetch('http://localhost:8000/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token, email: userInfo.email, name: userInfo.name })
        }).then(r => r.json());

        if (data.access_token) {
          saveToken(data.access_token, data.startup_name);
          navigate('/dashboard');
        } else {
          setError('Google login failed. Please try again.');
        }
      } catch (err) {
        setError('Google login failed. Please try again.');
      }
    },
    onError: () => setError('Google login failed. Please try again.')
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <LogoIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-semibold">THRIVEN</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-center mb-2">Welcome back</h2>
          <p className="text-center text-muted-foreground mb-8">
            Log in to your account to continue
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={() => handleGoogleLogin()}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-secondary transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.49-1.63.78-2.7.78-2.08 0-3.84-1.4-4.47-3.29H1.88v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.51 10.54A4.8 4.8 0 0 1 4.26 9c0-.53.09-1.05.25-1.54V5.39H1.88A8 8 0 0 0 .98 9c0 1.29.31 2.51.9 3.61l2.63-2.07z"/>
              <path fill="#EA4335" d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.39l2.63 2.07c.63-1.89 2.39-3.28 4.47-3.28z"/>
            </svg>
            <span className="text-sm font-medium">Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-2 text-foreground">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-foreground">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}