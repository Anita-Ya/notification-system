import React from 'react';
import { 
  Plus, 
  RefreshCw, 
  Send, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Smartphone, 
  Mail, 
  Globe, 
  Trash2, 
  Info,
  Clock
} from 'lucide-react';

export default function NotificationMatrixTable({
  triggers,
  loading,
  onRefresh,
  onOpenCreateTrigger,
  onOpenEditTemplate,
  onOpenTestSend,
  onToggleChannel,
  onFireTrigger,
  onDeleteTrigger,
  onSyncWhatsApp
}) {
  const channels = [
    { key: 'whatsapp', label: 'WhatsApp', icon: Smartphone, color: 'text-emerald-400', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { key: 'email', label: 'Email', icon: Mail, color: 'text-blue-400', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { key: 'web_push', label: 'Web Push', icon: Globe, color: 'text-purple-400', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Table Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Admin Notification Matrix</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              1 Screen Management
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Row = Trigger &bull; Column = Channel &bull; Cell = Template. Configure, toggle, and test send all templates in one place.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
            title="Refresh Table Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onOpenCreateTrigger}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Trigger</span>
          </button>
        </div>
      </div>

      {/* The Central Notification Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400">
              <th className="py-4 px-5 w-64">
                <span className="font-semibold text-slate-300">Trigger Event</span>
              </th>
              {channels.map((ch) => {
                const IconComponent = ch.icon;
                return (
                  <th key={ch.key} className="py-4 px-5 min-w-[280px]">
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`w-4 h-4 ${ch.color}`} />
                      <span className="font-semibold text-slate-200">{ch.label}</span>
                    </div>
                  </th>
                );
              })}
              <th className="py-4 px-5 text-right w-36">
                <span className="font-semibold text-slate-300">Quick Test</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {triggers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>Loading notification matrix...</span>
                    </div>
                  ) : (
                    <div>No triggers found. Click "Add New Trigger" to create your first event!</div>
                  )}
                </td>
              </tr>
            ) : (
              triggers.map((trigger) => (
                <tr key={trigger.id} className="hover:bg-slate-800/30 transition-colors group">
                  
                  {/* Column 1: Trigger Details */}
                  <td className="py-5 px-5 align-top">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-base">{trigger.name}</span>
                        {trigger.is_active ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" title="Active" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-rose-400" title="Inactive" />
                        )}
                      </div>
                      <div className="inline-block px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[11px] font-mono text-indigo-300">
                        slug: {trigger.slug}
                      </div>
                      {trigger.description && (
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                          {trigger.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Columns 2, 3, 4: Channels (WhatsApp, Email, Web Push) */}
                  {channels.map((ch) => {
                    const template = trigger.template_matrix?.[ch.key];
                    if (!template) {
                      return (
                        <td key={ch.key} className="py-5 px-5 align-top">
                          <div className="p-4 rounded-lg border border-dashed border-slate-800 bg-slate-900/30 text-center">
                            <span className="text-xs text-slate-500 block mb-2">No template configured</span>
                            <button
                              onClick={() => onOpenEditTemplate(null, trigger, ch.key)}
                              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center justify-center space-x-1 mx-auto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create Template</span>
                            </button>
                          </div>
                        </td>
                      );
                    }

                    const isEnabled = template.is_enabled;

                    return (
                      <td key={ch.key} className="py-5 px-5 align-top">
                        <div className={`p-4 rounded-xl border transition-all duration-200 ${
                          isEnabled 
                            ? 'bg-slate-800/40 border-slate-700/80 hover:border-slate-600 shadow-sm' 
                            : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        }`}>
                          
                          {/* Cell Header: On/Off Switch & Status */}
                          <div className="flex items-center justify-between mb-2.5">
                            {/* Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={() => onToggleChannel(template.id)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                              <span className="ml-2 text-xs font-medium text-slate-300">
                                {isEnabled ? 'ON' : 'OFF'}
                              </span>
                            </label>

                            {/* WhatsApp Approval / Channel Status Badge */}
                            {ch.key === 'whatsapp' ? (
                              <button
                                onClick={() => onSyncWhatsApp && onSyncWhatsApp(template.id)}
                                title="Click to sync / approve WhatsApp template with Meta"
                                className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border transition flex items-center space-x-1 ${
                                  template.status === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                }`}
                              >
                                {template.status === 'approved' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>Approved</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>Sync Approval</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${ch.badgeColor}`}>
                                {ch.label}
                              </span>
                            )}
                          </div>

                          {/* Template Content Preview */}
                          <div className="space-y-1 mb-3">
                            {template.title && (
                              <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                                {template.title}
                              </div>
                            )}
                            <div className="text-xs text-slate-400 line-clamp-2 font-sans leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800/80">
                              {template.body || <span className="italic text-slate-600">No message text</span>}
                            </div>
                          </div>

                          {/* Cell Actions: Edit & Test Send */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                            <button
                              onClick={() => onOpenEditTemplate(template, trigger, ch.key)}
                              className="flex items-center space-x-1.5 text-slate-300 hover:text-indigo-400 font-medium transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => onOpenTestSend(template, trigger, ch.key)}
                              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition"
                            >
                              <Send className="w-3 h-3 text-indigo-400" />
                              <span>Test Send</span>
                            </button>
                          </div>

                        </div>
                      </td>
                    );
                  })}

                  {/* Column 5: Trigger Row Action (Fire all 3 channels & Delete) */}
                  <td className="py-5 px-5 align-top text-right">
                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={() => onFireTrigger(trigger.slug)}
                        title="Fire all enabled channels for this trigger"
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Fire All</span>
                      </button>

                      <button
                        onClick={() => onDeleteTrigger(trigger.id, trigger.name)}
                        title="Delete Trigger"
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
