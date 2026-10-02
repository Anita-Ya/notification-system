import React, { useState } from 'react';
import { 
  LogIn, 
  LogOut, 
  User, 
  Lock, 
  ShoppingBag, 
  Clock, 
  Key, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Mail,
  Globe
} from 'lucide-react';

export default function UserPortal({ currentUser, onLogin, onLogout, onSimulateEvent }) {
  const [username, setUsername] = useState('anita');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [lastEventFired, setLastEventFired] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLastEventFired(null);
    try {
      const res = await onLogin(username, password);
      setLastEventFired(res);
    } catch (err) {
      alert('Login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    setLoading(true);
    setLastEventFired(null);
    try {
      const res = await onLogout();
      setLastEventFired(res);
    } catch (err) {
      alert('Logout error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSimulate = async (slug, context = {}) => {
    setLoading(true);
    setLastEventFired(null);
    try {
      const res = await onSimulateEvent(slug, context);
      setLastEventFired(res);
    } catch (err) {
      alert(`Simulation error on ${slug}: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-6 rounded-2xl border border-indigo-700/40 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span>Website Trigger Simulator</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Live Interactive Playground
          </span>
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          This portal simulates the actual consumer-facing website where user events occur.
          Performing actions here triggers the corresponding notification row configured in the Admin Matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Auth Actions (Login / Logout) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <span>User Session Simulation</span>
            </h3>
            {currentUser ? (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Active Session: {currentUser.username}
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Logged Out
              </span>
            )}
          </div>

          {!currentUser ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Signing in triggers the <strong>"Login"</strong> trigger row across WhatsApp, Email, and Web Push simultaneously!
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>Simulate User Login &bull; Fire "Login" Trigger</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div>Logged in as: <strong className="text-white">{currentUser.username}</strong></div>
                <div>Email: <strong className="text-white">{currentUser.email || 'user@example.com'}</strong></div>
                <div className="text-emerald-400 font-medium">Session is active & ready to fire triggers.</div>
              </div>
              <button
                onClick={handleLogoutClick}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Simulate User Logout &bull; Fire "Logout" Trigger</span>
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Inactivity & Business Triggers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Event & Condition Triggers</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Fire custom events and inactivity conditions directly:
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleTriggerSimulate('not-logged-in-for-1-day')}
              disabled={loading}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                    Not Logged In for 1 Day
                  </div>
                  <div className="text-[11px] text-slate-400">User away for 24 hours</div>
                </div>
              </div>
              <span className="text-xs font-medium text-indigo-400">Fire &rarr;</span>
            </button>

            <button
              onClick={() => handleTriggerSimulate('not-logged-in-for-1-week')}
              disabled={loading}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                    Not Logged In for 1 Week
                  </div>
                  <div className="text-[11px] text-slate-400">User away for 7 days</div>
                </div>
              </div>
              <span className="text-xs font-medium text-indigo-400">Fire &rarr;</span>
            </button>

            <button
              onClick={() => handleTriggerSimulate('password-reset')}
              disabled={loading}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <Key className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                    Password Reset Requested
                  </div>
                  <div className="text-[11px] text-slate-400">User initiates credential reset</div>
                </div>
              </div>
              <span className="text-xs font-medium text-indigo-400">Fire &rarr;</span>
            </button>

            <button
              onClick={() => handleTriggerSimulate('order-placed', { order_id: 'ORD-7749' })}
              disabled={loading}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition">
                    Order Placed (#ORD-7749)
                  </div>
                  <div className="text-[11px] text-slate-400">User completes checkout</div>
                </div>
              </div>
              <span className="text-xs font-medium text-indigo-400">Fire &rarr;</span>
            </button>
          </div>

        </div>

      </div>

      {/* Live Dispatched Event Result Card */}
      {lastEventFired && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">
                Trigger Executed: <span className="text-indigo-400 capitalize">{lastEventFired.trigger_fired}</span>
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">Dispatched Across Configured Channels</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {['whatsapp', 'email', 'web_push'].map((ch) => {
              const res = lastEventFired.notification_dispatch?.results?.[ch];
              const isSkipped = res?.status === 'skipped';
              const isSent = res?.status === 'sent';
              const isSimulated = res?.status === 'simulated';

              return (
                <div key={ch} className={`p-3 rounded-xl border text-xs ${
                  isSent 
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                    : isSimulated 
                      ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-300' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                  <div className="font-semibold uppercase tracking-wider text-[10px] mb-1">
                    {ch.replace('_', ' ')}
                  </div>
                  <div>
                    {isSkipped && 'Channel Disabled (Skipped)'}
                    {isSent && '✓ Sent via Live API'}
                    {isSimulated && '✓ Dispatched (Sandbox Mode)'}
                    {!res && 'Not Configured'}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 pt-1">
            Check the <strong className="text-white">Delivery Logs</strong> tab to inspect the raw provider headers and payloads.
          </p>
        </div>
      )}

    </div>
  );
}
