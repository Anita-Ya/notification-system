import React from 'react';
import { 
  Bell, 
  Send, 
  Layers, 
  Activity, 
  HelpCircle, 
  Smartphone, 
  Mail, 
  Globe, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  statusData, 
  pushSubscribed, 
  onSubscribePush 
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white tracking-tight">NotifEngine</span>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  Admin Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Centralized Omni-Channel Notification Management</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'matrix'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Admin Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('portal')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'portal'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>User Playground</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Delivery Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('taskd')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'taskd'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/20'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Task D Q&A</span>
            </button>
          </nav>

          {/* Right Provider Badges & Push Toggle */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* WhatsApp Status */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">WA:</span>
              <span className={statusData?.whatsapp?.configured ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                {statusData?.whatsapp?.configured ? "Live Sandbox" : "Simulated"}
              </span>
            </div>

            {/* Email Status */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Email:</span>
              <span className={statusData?.email?.configured ? "text-blue-400 font-medium" : "text-amber-400 font-medium"}>
                {statusData?.email?.active_provider || "Postmark Sim"}
              </span>
            </div>

            {/* Web Push Subscribe Button */}
            <button
              onClick={onSubscribePush}
              title={pushSubscribed ? "Web Push is enabled in this browser" : "Click to enable browser push notifications"}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                pushSubscribed
                  ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                  : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white animate-pulse'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{pushSubscribed ? '🔔 Push Enabled' : '🔔 Subscribe Web Push'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
