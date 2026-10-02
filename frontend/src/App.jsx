import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import NotificationMatrixTable from './components/NotificationMatrixTable';
import TemplateModal from './components/TemplateModal';
import TestSendModal from './components/TestSendModal';
import TriggerModal from './components/TriggerModal';
import NotificationLogs from './components/NotificationLogs';
import UserPortal from './components/UserPortal';
import TaskDExplanationModal from './components/TaskDExplanationModal';
import { api, urlB64ToUint8Array } from './api';
import { CheckCircle2, AlertCircle, Info, BellRing } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'portal' | 'logs' | 'taskd'
  const [triggers, setTriggers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Web Push State
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState('');

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [selectedChannelKey, setSelectedChannelKey] = useState('whatsapp');

  const [isTestSendModalOpen, setIsTestSendModalOpen] = useState(false);
  const [isCreateTriggerOpen, setIsCreateTriggerOpen] = useState(false);
  const [isTaskDOpen, setIsTaskDOpen] = useState(false);

  // Alert Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [triggersRes, logsRes, statusRes, userRes] = await Promise.all([
        api.getTriggers().catch(() => []),
        api.getLogs().catch(() => []),
        api.getStatus().catch(() => null),
        api.getMe().catch(() => ({ authenticated: false, user: null }))
      ]);

      setTriggers(triggersRes);
      setLogs(logsRes);
      setStatusData(statusRes);
      if (userRes.authenticated) {
        setCurrentUser(userRes.user);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      showToast('Could not reach backend API. Ensure Django is running.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Register Service Worker & Check Web Push Permission
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setPushSubscribed(true);
          }
          // Fetch VAPID Key
          try {
            const res = await api.getVapidKey();
            if (res.vapid_public_key) {
              setVapidPublicKey(res.vapid_public_key);
            }
          } catch (e) {
            console.warn('Could not fetch VAPID key:', e);
          }
        })
        .catch(err => console.error('Service worker registration failed:', err));
    }
  }, []);

  const handleSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Web Push is not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied. Please allow notifications in browser settings.');
        return;
      }

      // Always fetch the freshest VAPID key from the server
      const res = await api.getVapidKey();
      const vapidKey = res.vapid_public_key;
      setVapidPublicKey(vapidKey);

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      const convertedVapidKey = urlB64ToUint8Array(vapidKey);

      if (subscription) {
        try {
          await subscription.unsubscribe();
        } catch (e) {
          console.warn('Unsubscribe old push error:', e);
        }
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      const subData = subscription.toJSON();
      await api.subscribePush(subData);

      setPushSubscribed(true);
      showToast('Web Push enabled! You will now receive desktop pop-ups.', 'success');

      // Test display notification
      registration.showNotification('Web Push Activated! 🎉', {
        body: 'Your browser is subscribed to real-time notification alerts.',
        icon: '/favicon.svg'
      });

      // Reload status
      const statusRes = await api.getStatus();
      setStatusData(statusRes);
    } catch (err) {
      console.error('Subscription error:', err);
      showToast('Web push subscription failed: ' + err.message, 'error');
    }
  };

  // Toggle channel on/off
  const handleToggleChannel = async (templateId) => {
    try {
      const res = await api.toggleTemplate(templateId);
      showToast(res.message || 'Channel status toggled', 'success');
      // Refresh triggers
      const updatedTriggers = await api.getTriggers();
      setTriggers(updatedTriggers);
    } catch (err) {
      showToast('Failed to toggle channel: ' + err.message, 'error');
    }
  };

  // Save template edit/creation
  const handleSaveTemplate = async (payload) => {
    try {
      if (selectedTemplate && selectedTemplate.id) {
        await api.updateTemplate(selectedTemplate.id, payload);
        showToast('Template updated successfully!', 'success');
      } else {
        // Find existing template for trigger + channel or update
        const trig = triggers.find(t => t.id === payload.trigger_id);
        const existing = trig?.template_matrix?.[payload.channel];
        if (existing?.id) {
          await api.updateTemplate(existing.id, payload);
        }
        showToast('Template saved successfully!', 'success');
      }
      setIsTemplateModalOpen(false);
      const updatedTriggers = await api.getTriggers();
      setTriggers(updatedTriggers);
    } catch (err) {
      showToast('Error saving template: ' + err.message, 'error');
    }
  };

  // Create new Trigger
  const handleCreateTrigger = async (data) => {
    try {
      await api.createTrigger(data);
      showToast(`Trigger "${data.name}" added with 3 default channel templates!`, 'success');
      setIsCreateTriggerOpen(false);
      const updatedTriggers = await api.getTriggers();
      setTriggers(updatedTriggers);
    } catch (err) {
      showToast('Error creating trigger: ' + err.message, 'error');
    }
  };

  // Delete Trigger
  const handleDeleteTrigger = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete trigger "${name}"?`)) return;
    try {
      await api.deleteTrigger(id);
      showToast(`Trigger "${name}" deleted.`, 'info');
      const updatedTriggers = await api.getTriggers();
      setTriggers(updatedTriggers);
    } catch (err) {
      showToast('Error deleting trigger: ' + err.message, 'error');
    }
  };

  // Fire all channels for a trigger
  const handleFireTrigger = async (slug) => {
    try {
      const res = await api.fireTrigger(slug);
      showToast(`Trigger "${res.trigger || slug}" fired across all active channels!`, 'success');
      const [updatedLogs, statusRes] = await Promise.all([
        api.getLogs(),
        api.getStatus()
      ]);
      setLogs(updatedLogs);
      setStatusData(statusRes);
    } catch (err) {
      showToast('Error firing trigger: ' + err.message, 'error');
    }
  };

  // WhatsApp Sync / Approve Template
  const handleSyncWhatsApp = async (templateId) => {
    try {
      const res = await api.syncWhatsAppTemplate(templateId);
      showToast(res.message, 'success');
      const updatedTriggers = await api.getTriggers();
      setTriggers(updatedTriggers);
    } catch (err) {
      showToast('Failed to sync WhatsApp template: ' + err.message, 'error');
    }
  };

  // Test Send Cell
  const handleSendTest = async (templateId, recipient, customVars) => {
    const res = await api.testSendTemplate(templateId, recipient, customVars);
    // Reload logs
    const updatedLogs = await api.getLogs();
    setLogs(updatedLogs);
    return res;
  };

  // Auth & Trigger Actions from User Playground
  const handleLogin = async (username, password) => {
    const res = await api.login(username, password);
    if (res.user) {
      setCurrentUser(res.user);
    }
    showToast(`Logged in as ${username}. "Login" trigger fired!`, 'success');
    const updatedLogs = await api.getLogs();
    setLogs(updatedLogs);
    return res;
  };

  const handleLogout = async () => {
    const res = await api.logout();
    setCurrentUser(null);
    showToast('Logged out. "Logout" trigger fired!', 'info');
    const updatedLogs = await api.getLogs();
    setLogs(updatedLogs);
    return res;
  };

  const handleSimulateEvent = async (slug, context) => {
    const res = await api.simulateEvent(slug, context);
    showToast(`Simulated event "${slug}" fired!`, 'success');
    const updatedLogs = await api.getLogs();
    setLogs(updatedLogs);
    return res;
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!window.confirm('Clear all notification audit logs?')) return;
    try {
      await api.clearLogs();
      setLogs([]);
      showToast('Audit logs cleared.', 'info');
    } catch (err) {
      showToast('Error clearing logs: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      
      {/* Toast Banner */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-slideUp border ${
          toast.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
            : (toast.type === 'info' 
                ? 'bg-blue-950/90 text-blue-200 border-blue-500/30' 
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30')
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'taskd') {
            setIsTaskDOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        statusData={statusData}
        pushSubscribed={pushSubscribed}
        onSubscribePush={handleSubscribePush}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'matrix' && (
          <NotificationMatrixTable
            triggers={triggers}
            loading={loading}
            onRefresh={loadInitialData}
            onOpenCreateTrigger={() => setIsCreateTriggerOpen(true)}
            onOpenEditTemplate={(template, trigger, channelKey) => {
              setSelectedTemplate(template);
              setSelectedTrigger(trigger);
              setSelectedChannelKey(channelKey);
              setIsTemplateModalOpen(true);
            }}
            onOpenTestSend={(template, trigger, channelKey) => {
              setSelectedTemplate(template);
              setSelectedTrigger(trigger);
              setSelectedChannelKey(channelKey);
              setIsTestSendModalOpen(true);
            }}
            onToggleChannel={handleToggleChannel}
            onFireTrigger={handleFireTrigger}
            onDeleteTrigger={handleDeleteTrigger}
            onSyncWhatsApp={handleSyncWhatsApp}
          />
        )}

        {activeTab === 'portal' && (
          <UserPortal
            currentUser={currentUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onSimulateEvent={handleSimulateEvent}
          />
        )}

        {activeTab === 'logs' && (
          <NotificationLogs
            logs={logs}
            loading={loading}
            onRefresh={async () => {
              setLoading(true);
              const updated = await api.getLogs();
              setLogs(updated);
              setLoading(false);
            }}
            onClearLogs={handleClearLogs}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Notification Management System &bull; WhatsApp Cloud API &bull; Postmark &bull; Web Push</span>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsTaskDOpen(true)} className="text-indigo-400 hover:underline">
              Task D Interview Q&A
            </button>
            <span>&bull;</span>
            <span className="text-slate-400">Deployed on Render + Vercel</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
        template={selectedTemplate}
        trigger={selectedTrigger}
        channelKey={selectedChannelKey}
      />

      <TestSendModal
        isOpen={isTestSendModalOpen}
        onClose={() => setIsTestSendModalOpen(false)}
        template={selectedTemplate}
        trigger={selectedTrigger}
        channelKey={selectedChannelKey}
        onSendTest={handleSendTest}
        onSubscribePush={handleSubscribePush}
      />

      <TriggerModal
        isOpen={isCreateTriggerOpen}
        onClose={() => setIsCreateTriggerOpen(false)}
        onCreateTrigger={handleCreateTrigger}
      />

      <TaskDExplanationModal
        isOpen={isTaskDOpen}
        onClose={() => setIsTaskDOpen(false)}
      />

    </div>
  );
}
