'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BellIcon,
  ShieldCheckIcon,
  EyeSlashIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/layout/ToastContext';
import { Loader } from '@/components/ui';
import silentMode from '@/lib/silentMode';
import { signOut } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Notifications
    silentMode: false,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }
    fetchSettings();
  }, [session, status, router]);

  // Listen for silent mode changes from other components (like notification bell)
  useEffect(() => {
    const cleanup = silentMode.addListener((enabled) => {
      setSettings(prev => ({ ...prev, silentMode: enabled }));
    });
    return cleanup;
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings(prev => ({ ...prev, ...data.data }));
        // Sync silent mode with the service
        if (data.data.silentMode !== silentMode.isEnabled()) {
          if (data.data.silentMode) {
            await silentMode.enable(false); // false = don't sync back to server
          } else {
            await silentMode.disable(false);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings) => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      const data = await response.json();
      
      if (data.success) {
        showToast( {text :'Settings saved successfully : success' });
      } else {
        showToast( {text :data.message || 'Failed to save settings :error' });
      }
    } catch (error) {
      showToast( {text :'Failed to save settings : error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (key) => {
    const newValue = !settings[key];
    const updated = { ...settings, [key]: newValue };
    setSettings(updated);
    
    // Special handling for silent mode
    if (key === 'silentMode') {
      if (newValue) {
        await silentMode.enable(false); // false = don't sync to server (we'll do it below)
      } else {
        await silentMode.disable(false);
      }
    }
    
    saveSettings(updated);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ WARNING: Are you absolutely sure you want to delete your account? This will permanently delete:\n\n• Your profile and all personal data\n• All your messages\n• All your chats\n• All your friends and connections\n• All your notifications\n\nThis action CANNOT be undone!')) {
      return;
    }

    // Second confirmation
    if (!confirm('This is your last chance. Type YES in the next prompt to confirm account deletion.')) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation !== 'DELETE') {
      showToast({ text: 'Account deletion cancelled', type: 'info' });
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        showToast({ text: 'Account deleted successfully. Goodbye!', type: 'success' });
        // Sign out and redirect to home
        setTimeout(() => {
          signOut({ callbackUrl: '/' });
        }, 2000);
      } else {
        showToast({ text: data.message || 'Failed to delete account', type: 'error' });
      }
    } catch (error) {
      showToast({ text: 'Failed to delete account', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account preferences and settings</p>
        </div>

        <div className="space-y-6">
          {/* Notifications Section */}
          <SettingsSection
            icon={BellIcon}
            title="Notifications"
            description="Manage notification preferences"
          >
            <ToggleSetting
              label="Silent Mode"
              description="Mute all notification sounds"
              checked={settings.silentMode}
              onChange={() => handleToggle('silentMode')}
            />
          </SettingsSection>

          {/* Account Actions Section */}
          <SettingsSection
            icon={ShieldCheckIcon}
            title="Account"
            description="Manage your account"
          >
            <ActionButton
              icon={EyeSlashIcon}
              label="Blocked Users"
              description="Manage blocked users"
              onClick={() => router.push('/settings/blocked')}
              disabled={actionLoading}
            />
            <ActionButton
              icon={ArrowRightOnRectangleIcon}
              label="Delete Account"
              description="Permanently delete your account and all data"
              onClick={handleDeleteAccount}
              danger
              disabled={actionLoading}
            />
          </SettingsSection>
        </div>

        {/* Save Indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}

// Settings Section Component
function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {children}
      </div>
    </div>
  );
}

// Toggle Setting Component
function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// Action Button Component
function ActionButton({ icon: Icon, label, description, onClick, danger, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-6 py-4 flex items-center justify-between transition-colors text-left ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-gray-600'}`} />
        <div>
          <h3 className={`text-sm font-medium ${danger ? 'text-red-600' : 'text-gray-900'}`}>
            {label}
          </h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {disabled ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
      ) : (
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
