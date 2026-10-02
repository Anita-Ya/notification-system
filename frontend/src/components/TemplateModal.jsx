import React, { useState, useEffect } from 'react';
import { X, Smartphone, Mail, Globe, Sparkles, Check, Eye } from 'lucide-react';

export default function TemplateModal({ isOpen, onClose, onSave, template, trigger, channelKey }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [metaTemplateName, setMetaTemplateName] = useState('');
  const [targetUrl, setTargetUrl] = useState('/');
  const [status, setStatus] = useState('approved');
  const [previewTab, setPreviewTab] = useState('edit');

  useEffect(() => {
    if (template) {
      setTitle(template.title || '');
      setBody(template.body || '');
      setMetaTemplateName(template.meta_template_name || '');
      setStatus(template.status || 'approved');
      setTargetUrl(template.extra_config?.url || '/');
    } else {
      // Default template suggestions
      const defaultTitle = channelKey === 'email' ? `${trigger?.name} Notification` : (channelKey === 'web_push' ? `${trigger?.name} Alert` : '');
      setTitle(defaultTitle);
      setBody(`Hello {{username}},\n\nThis is a notification for ${trigger?.name} triggered at {{time}}.`);
      setMetaTemplateName('');
      setStatus('approved');
      setTargetUrl('/');
    }
  }, [template, trigger, channelKey]);

  const channelMeta = {
    whatsapp: { name: 'WhatsApp', icon: Smartphone, color: 'text-emerald-400', desc: 'WhatsApp Cloud API Sandbox Template' },
    email: { name: 'Email', icon: Mail, color: 'text-blue-400', desc: 'Postmark / Resend Transactional Email Template' },
    web_push: { name: 'Web Push', icon: Globe, color: 'text-purple-400', desc: 'Browser Web Push Notification (Desktop/Mobile)' }
  }[channelKey] || { name: 'Channel', icon: Mail, color: 'text-slate-400', desc: '' };

  const availableVariables = [
    { label: '{{username}}', sample: 'Anita' },
    { label: '{{email}}', sample: 'user@example.com' },
    { label: '{{time}}', sample: '2026-09-30 21:00 UTC' },
    { label: '{{phone}}', sample: '+1234567890' },
    { label: '{{order_id}}', sample: 'ORD-8821' },
    { label: '{{trigger_name}}', sample: trigger?.name || 'Login' }
  ];

  const insertVariable = (variableStr) => {
    setBody(prev => prev + ' ' + variableStr);
  };

  const getRenderedPreview = (text) => {
    let result = text || '';
    availableVariables.forEach(v => {
      result = result.replaceAll(v.label, v.sample);
    });
    return result;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      trigger_id: trigger.id,
      channel: channelKey,
      title,
      body,
      status,
      meta_template_name: metaTemplateName,
      extra_config: { url: targetUrl }
    });
  };

  const IconComponent = channelMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-slate-800 border border-slate-700 ${channelMeta.color}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">
                  {template ? 'Edit Template' : 'Create Template'}
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {channelMeta.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">Trigger: <span className="text-indigo-400 font-medium">{trigger?.name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Edit vs Live Preview */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setPreviewTab('edit')}
            className={`pb-2 px-4 text-xs font-semibold border-b-2 transition ${
              previewTab === 'edit'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Editor & Variables
          </button>
          <button
            onClick={() => setPreviewTab('preview')}
            className={`pb-2 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-1.5 ${
              previewTab === 'preview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Rendered Preview</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {previewTab === 'edit' ? (
            <>
              {/* Title / Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {channelKey === 'email' ? 'Email Subject Line' : (channelKey === 'web_push' ? 'Notification Title' : 'WhatsApp Header (Optional)')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={channelKey === 'email' ? 'e.g. You logged in successfully' : 'e.g. Welcome back!'}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none transition"
                />
              </div>

              {/* Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Message Body <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Supports mustache placeholders</span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter message template text with variables like {{username}}..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none font-mono transition resize-none leading-relaxed"
                />
              </div>

              {/* Quick Insert Variables Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Insert Dynamic Variables:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableVariables.map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => insertVariable(v.label)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700/80 hover:border-indigo-500/40 text-xs font-mono transition"
                    >
                      + {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel-Specific Configuration */}
              {channelKey === 'whatsapp' && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Meta Sandbox WhatsApp Settings</h4>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Meta Template Name (Optional):</label>
                    <input
                      type="text"
                      value={metaTemplateName}
                      onChange={(e) => setMetaTemplateName(e.target.value)}
                      placeholder="e.g. welcome_back_login"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Approval Status:</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                    >
                      <option value="approved">Approved (Ready to Send)</option>
                      <option value="pending_approval">Pending Meta Approval</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
              )}

              {channelKey === 'web_push' && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Browser Web Push Action</h4>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Click URL Destination:</label>
                    <input
                      type="text"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="/"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Rendered Preview Card */
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Sample preview rendered using mock user <span className="text-indigo-400 font-mono">Anita</span>:
              </div>

              {channelKey === 'whatsapp' && (
                <div className="max-w-sm mx-auto bg-[#075E54] p-4 rounded-2xl shadow-xl text-white">
                  <div className="bg-[#128C7E] px-3 py-2 rounded-t-lg text-xs font-bold flex items-center justify-between">
                    <span>WhatsApp Cloud API</span>
                    <span>Online</span>
                  </div>
                  <div className="bg-[#DCF8C6] text-slate-900 p-3 rounded-b-lg rounded-tl-lg mt-1 shadow text-sm space-y-1">
                    {title && <div className="font-bold text-xs text-emerald-900">{getRenderedPreview(title)}</div>}
                    <div className="whitespace-pre-wrap">{getRenderedPreview(body)}</div>
                    <div className="text-[10px] text-slate-500 text-right">Just now &bull; ✓✓</div>
                  </div>
                </div>
              )}

              {channelKey === 'email' && (
                <div className="border border-slate-700 rounded-xl bg-white text-slate-900 p-5 shadow-lg max-w-lg mx-auto">
                  <div className="border-b pb-2 mb-3">
                    <div className="text-xs text-slate-500">From: <span className="font-medium text-slate-700">notifications@yourdomain.com</span></div>
                    <div className="text-xs text-slate-500">To: <span className="font-medium text-slate-700">user@example.com</span></div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      Subject: {getRenderedPreview(title) || 'Notification Alert'}
                    </div>
                  </div>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed py-2">
                    {getRenderedPreview(body)}
                  </div>
                  <div className="border-t pt-3 mt-4 text-[11px] text-slate-400 text-center">
                    Sent via Postmark Transactional Email
                  </div>
                </div>
              )}

              {channelKey === 'web_push' && (
                <div className="max-w-md mx-auto bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-2xl flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white truncate">
                        {getRenderedPreview(title) || 'Notification Alert'}
                      </div>
                      <span className="text-[10px] text-slate-400">now</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">
                      {getRenderedPreview(body)}
                    </p>
                    <div className="text-[10px] text-indigo-400 mt-1.5 flex items-center gap-1">
                      <span>Click opens: {targetUrl}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Template</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
