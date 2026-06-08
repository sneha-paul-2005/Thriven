import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { LogoIcon } from '../components/LogoIcon';
import { api, saveToken } from '../services/api';

function getPasswordStrength(password: string) {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, checks } = getPasswordStrength(password);
  const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? strengthColor[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 2 ? 'text-red-500' : score === 3 ? 'text-yellow-500' : score === 4 ? 'text-blue-500' : 'text-green-500'}`}>
        {strengthLabel[score]}
      </p>
      <div className="grid grid-cols-2 gap-1">
        {[
          { key: 'length', label: '8+ characters' },
          { key: 'uppercase', label: 'Uppercase letter' },
          { key: 'lowercase', label: 'Lowercase letter' },
          { key: 'number', label: 'Number' },
          { key: 'special', label: 'Special character' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1">
            <span className={`text-xs ${checks[key as keyof typeof checks] ? 'text-green-500' : 'text-gray-400'}`}>
              {checks[key as keyof typeof checks] ? '✓' : '○'} {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Signup() {
  const navigate = useNavigate();
  const [startupName, setStartupName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { score } = getPasswordStrength(password);
  const isPasswordStrong = score >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isPasswordStrong) {
      setError('Please choose a stronger password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.signup(startupName, email, password);
      if (data.access_token) {
        saveToken(data.access_token, data.startup_name);
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

          <h2 className="text-2xl font-semibold text-center mb-2">Get started</h2>
          <p className="text-center text-muted-foreground mb-8">
            Create your account to start growing
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="startupName" className="block mb-2 text-foreground">Startup name</label>
              <input
                id="startupName"
                type="text"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Acme Inc"
                required
              />
            </div>

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
              <PasswordStrengthBar password={password} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block mb-2 text-foreground">Confirm password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || !isPasswordStrong}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}