import React, { useState } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  MinusCircle, 
  Smartphone, 
  Mail, 
  Globe,
  Code
} from 'lucide-react';

export default function NotificationLogs({ logs, loading, onRefresh, onClearLogs }) {
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeLogDetail, setActiveLogDetail] = useState(null);

  const filteredLogs = logs.filter((log) => {
    const channelMatch = selectedChannel === 'all' || log.channel === selectedChannel;
    const statusMatch = selectedStatus === 'all' || log.status === selectedStatus;
    return channelMatch && statusMatch;
  });

  const getChannelIcon = (ch) => {
    switch (ch) {
      case 'whatsapp':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'web_push':
        return <Globe className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Sent (Live)</span>
          </span>
        );
      case 'simulated':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>Simulated</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <MinusCircle className="w-3 h-3" />
            <span>Skipped (OFF)</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Notification Delivery Audit Log</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {filteredLogs.length} Events
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time delivery verification across WhatsApp Cloud API, Postmark, and Web Push.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Channel Filter */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 outline-none"
          >
            <option value="all">All Channels</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="web_push">Web Push</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent (Live)</option>
            <option value="simulated">Simulated</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={onClearLogs}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Trigger</th>
              <th className="py-3.5 px-4">Channel</th>
              <th className="py-3.5 px-4">Recipient</th>
              <th className="py-3.5 px-4">Message Snippet</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No notification logs found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                    {log.trigger_name || 'System Test'}
                    {log.is_test && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        test
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5 capitalize text-slate-300">
                      {getChannelIcon(log.channel)}
                      <span>{log.channel.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {log.recipient}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-300" title={log.body}>
                    {log.title && <span className="font-semibold text-slate-200">[{log.title}] </span>}
                    {log.body}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setActiveLogDetail(log)}
                      className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center space-x-1 p-1"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* JSON Inspection Drawer / Modal */}
      {activeLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Log #{activeLogDetail.id} Response Details</h3>
                <p className="text-xs text-slate-400">Trigger: {activeLogDetail.trigger_name} &bull; Channel: {activeLogDetail.channel}</p>
              </div>
              <button
                onClick={() => setActiveLogDetail(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Message Content Sent:</div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap">
                {activeLogDetail.title && <div className="font-bold text-indigo-300 mb-1">{activeLogDetail.title}</div>}
                {activeLogDetail.body}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Service Response Payload:</div>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
                {JSON.stringify(activeLogDetail.service_response, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveLogDetail(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
