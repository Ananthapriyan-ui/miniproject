import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Smartphone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { addToast } = useToast();
  const { user } = useAuth();

  const [name, setName] = useState(user?.full_name || 'cloud operator');
  const [email, setEmail] = useState(user?.email || 'operator@cloudvuln.io');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
          <User className="w-7 h-7 text-cyan-400" />
          <span>User Profile</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage profile details, security settings, and multi-factor authentication.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Details Card */}
        <Card className="lg:col-span-1 border-cyan-500/20">
          <CardContent className="p-6 text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-400 font-bold text-3xl mx-auto shadow-[0_0_20px_rgba(0,243,255,0.3)] overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  (name || 'OP').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#090d16] flex items-center justify-center text-black font-bold text-[10px]">
                ✓
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-100">{name}</h3>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Badge variant="cyan" dot>MFA ENABLED</Badge>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3 text-left">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} icon={User} />
              <Input label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} icon={Mail} />
              <Button
                variant="secondary"
                className="w-full mt-2"
                onClick={() => addToast('Profile changes saved', 'success')}
              >
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Security Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* MFA Hardware Keys */}
          <Card>
            <CardHeader>
              <CardTitle icon={ShieldCheck} subtitle="Hardware authenticators and TOTP apps">
                Multi-Factor Authentication (MFA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-semibold text-slate-200">TOTP Authenticator (YubiKey / Google Auth)</p>
                    <p className="text-slate-400 text-[11px]">Active since July 2026</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">ACTIVE</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
