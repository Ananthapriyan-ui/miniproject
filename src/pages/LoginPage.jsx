import React, { useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Shield, Mail, Key, ArrowRight, ShieldCheck, Cpu, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { GoogleIcon } from '../components/ui/GoogleIcon';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, demoLogin } = useAuth();
  const { addToast } = useToast();

  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = useCallback(() => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!validateEmail(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 3) e.password = 'Password too short';
    return e;
  }, [form]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setServerError('');

    const result = await login(form.email, form.password);
    setIsLoading(false);

    if (result.success) {
      addToast(`Welcome back, ${result.user.full_name}`, 'success', { title: 'Authentication Successful' });
      navigate(from, { replace: true });
    } else {
      setServerError(result.error);
      addToast(result.error, 'error', { title: 'Login Failed' });
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setServerError('');
    const result = await loginWithGoogle();
    if (!result.success) {
      setIsGoogleLoading(false);
      setServerError(result.error);
      addToast(result.error, 'error', { title: 'Google Sign-In Failed' });
    }
    // Browser redirects to Google OAuth consent
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      demoLogin();
      setIsLoading(false);
      addToast('Welcome to CloudVuln (Demo Mode)', 'success', { title: 'Demo Access Granted' });
      navigate('/', { replace: true });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 cyber-bg-grid relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,243,255,0.25)] text-cyan-400">
            <Shield className="w-10 h-10 animate-cyber-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-slate-100">
              CLOUD<span className="text-cyan-400">VULN</span>
            </h1>
            <p className="text-xs font-mono tracking-widest text-slate-400 uppercase mt-1">
              Cyber Vulnerability &amp; Posture Control Center
            </p>
          </div>
        </div>

        {/* Card */}
        <Card className="border-cyan-500/30 shadow-[0_0_50px_rgba(0,243,255,0.08)]">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> SecOps Authentication
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Supabase OAuth
              </span>
            </div>

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2"
              >
                <span>⚠️</span> {serverError}
              </div>
            )}

            {/* Google OAuth Login Button */}
            <button
              id="google-login"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700 hover:border-cyan-500/60 rounded-xl text-slate-200 font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(0,243,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              )}
              <span>{isGoogleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#0f172a] px-3 text-[10px] uppercase font-mono text-slate-500 relative z-10 whitespace-nowrap">
                OR SIGN IN WITH EMAIL
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                id="login-email"
                label="Email Address"
                type="email"
                placeholder="operator@cloudvuln.io"
                icon={Mail}
                value={form.email}
                onChange={handleChange('email')}
                error={errors.email}
                required
                autoComplete="email"
              />

              <Input
                id="login-password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                icon={Key}
                value={form.password}
                onChange={handleChange('password')}
                error={errors.password}
                required
                autoComplete="current-password"
              />

              <Button
                id="login-submit"
                type="submit"
                variant="primary"
                className="w-full py-3"
                isLoading={isLoading}
                iconRight={ArrowRight}
              >
                {isLoading ? 'Authenticating…' : 'Sign In with Email'}
              </Button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-[#0f172a] px-3 text-[10px] uppercase font-mono text-slate-500 relative z-10 whitespace-nowrap">
                TEST ACCESS
              </span>
            </div>

            <Button
              id="demo-login"
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleDemoLogin}
              isLoading={isLoading}
              icon={Cpu}
            >
              Quick Guest Demo
            </Button>

            <div className="text-center pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Need an account? </span>
              <Link to="/register" className="text-cyan-400 font-semibold hover:underline">
                Register
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-slate-500 font-mono">
          Authorized personnel only. All access attempts are logged.
        </p>
      </div>
    </div>
  );
};

