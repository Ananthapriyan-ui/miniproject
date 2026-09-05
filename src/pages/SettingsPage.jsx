import React, { useState } from 'react';
import {
  Settings,
  Cloud,
  Bell,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';

export const SettingsPage = () => {
  const { addToast } = useToast();

  const [awsRole, setAwsRole] = useState('');
  const [azureSub, setAzureSub] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');

  const [activeTab, setActiveTab] = useState('cloud');

  const handleSave = (e) => {
    e.preventDefault();
    addToast('Platform settings saved successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
          <Settings className="w-7 h-7 text-cyan-400" />
          <span>Platform & Cloud Integrations</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Configure cloud provider IAM credentials, automated cron scan schedules, and Slack/PagerDuty alert webhooks.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('cloud')}
          className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'cloud'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Cloud Providers</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alert Channels</span>
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'schedules'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Scan Schedules</span>
        </button>
      </div>

      {/* Tab 1: Cloud Credentials */}
      {activeTab === 'cloud' && (
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader action={<Badge variant={awsRole ? "success" : "ghost"} size="sm" dot={!!awsRole}>{awsRole ? "CONFIGURED" : "NOT CONFIGURED"}</Badge>}>
              <CardTitle icon={Cloud} subtitle="IAM Cross-Account Trust Policies">
                Amazon Web Services (AWS) Account Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="AWS Cross-Account IAM Role ARN"
                placeholder="arn:aws:iam::123456789012:role/CloudVulnScanRole"
                value={awsRole}
                onChange={(e) => setAwsRole(e.target.value)}
                helperText="CloudVuln assumes this role with SecurityAudit read-only permissions."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader action={<Badge variant={azureSub ? "success" : "ghost"} size="sm" dot={!!azureSub}>{azureSub ? "CONFIGURED" : "NOT CONFIGURED"}</Badge>}>
              <CardTitle icon={Cloud} subtitle="Service Principal & Management Groups">
                Microsoft Azure Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Azure Subscription ID"
                placeholder="e.g. 8f2a9910-c112-4091-a110-8841b9c991a"
                value={azureSub}
                onChange={(e) => setAzureSub(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" icon={Save}>
              Save Integration Parameters
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Notification Channels */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader action={<Badge variant={slackWebhook ? "success" : "ghost"} size="sm" dot={!!slackWebhook}>{slackWebhook ? "CONFIGURED" : "NOT CONFIGURED"}</Badge>}>
              <CardTitle icon={Bell} subtitle="Instant critical CVE alert routing">
                Slack & Webhook Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Slack Incoming Webhook URL"
                placeholder="https://hooks.slack.com/services/T00/B00/XXXXXX"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                helperText="Critical and High severity findings will be dispatched to this channel."
              />

              <div className="space-y-2 pt-2">
                <span className="block text-xs font-semibold text-slate-300 uppercase">
                  Alert Triggers
                </span>
                <div className="space-y-2 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-cyan-400 rounded" />
                    <span>Notify immediately on CRITICAL CVE detection</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-cyan-400 rounded" />
                    <span>Send daily executive posture digest email</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" icon={Save}>
              Save Alert Preferences
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Scan Schedules */}
      {activeTab === 'schedules' && (
        <Card>
          <CardHeader>
            <CardTitle icon={Clock} subtitle="Automated periodic vulnerability auditing">
              Cron Scan Schedules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Automated Audit Frequency"
              options={[
                { value: 'daily', label: 'Daily at midnight UTC' },
                { value: 'weekly', label: 'Weekly on Sundays at 02:00 UTC' },
                { value: 'monthly', label: 'Monthly compliance run' }
              ]}
            />
            <p className="text-xs text-slate-400">
              Next scheduled run: <span className="font-mono text-cyan-400">2026-07-28 00:00 UTC</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
