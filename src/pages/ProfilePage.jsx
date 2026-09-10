import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Key,
  Lock,
  Mail,
  Copy,
  Check,
  Plus,
  Trash2,
  Clock,
  Shield,
  Smartphone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { addToast } = useToast();
  const { user } = useAuth();

  const [name, setName] = useState(user?.full_name || 'SecOps Operator');
  const [email, setEmail] = useState(user?.email || 'operator@cloudvuln.io');

  const [copiedKey, setCopiedKey] = useState(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const [apiKeys, setApiKeys] = useState([]);

  const handleCopyKey = (keyText, id) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(id);
    addToast('API key copied to clipboard', 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateKey = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newKeyName.trim()) return;
    const newEntry = {
      id: Date.now(),
      name: newKeyName,
      key: `cv_live_${Math.random().toString(36).substring(2, 12)}...${Math.random().toString(36).substring(2, 6)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };
    setApiKeys([...apiKeys, newEntry]);
    setNewKeyName('');
    setIsGenerateModalOpen(false);
    addToast('New SecOps API Access Key generated!', 'success');
  };

  const handleDeleteKey = (id) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    addToast('API key revoked', 'warning');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
          <User className="w-7 h-7 text-cyan-400" />
          <span>SecOps Operator Profile</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage credentials, hardware MFA keys, and API access tokens for automation scripts.
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
              <Badge variant="purple">SECOPS-OPERATOR</Badge>
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

        {/* Right Column: API Keys & Security Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* API Access Tokens */}
          <Card>
            <CardHeader action={
              <Button
                size="sm"
                variant="primary"
                icon={Plus}
                onClick={() => setIsGenerateModalOpen(true)}
              >
                Generate API Key
              </Button>
            }>
              <CardTitle icon={Key} subtitle="Tokens for CI/CD pipelines & scanner CLI">
                API Access Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiKeys.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl space-y-1">
                  <p className="font-semibold text-slate-300">No active API tokens</p>
                  <p className="text-[11px] text-slate-500">Generate an API key for headless CLI scanning and CI/CD security pipelines.</p>
                </div>
              ) : (
                apiKeys.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-200">{item.name}</p>
                      <p className="font-mono text-cyan-400 text-[11px]">{item.key}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Created: {item.created} • Last used: {item.lastUsed}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleCopyKey(item.key, item.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                        title="Copy Key"
                      >
                        {copiedKey === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(item.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

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

      {/* Generate API Key Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate SecOps API Key"
        subtitle="Tokens allow programmatic access to CloudVuln CLI and REST APIs."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="generate-key-form">
              Generate Key
            </Button>
          </>
        }
      >
        <form id="generate-key-form" onSubmit={handleGenerateKey} className="space-y-4">
          <Input
            label="Token Identifier / Purpose"
            placeholder="e.g. Jenkins Security Pipeline"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
          />
        </form>
      </Modal>
    </div>
  );
};
