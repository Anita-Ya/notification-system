import React, { useState } from 'react';
import { X, Send, Smartphone, Mail, Globe, CheckCircle2, AlertTriangle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function TestSendModal({ isOpen, onClose, template, trigger, channelKey, onSendTest, onSubscribePush }) {
  if (!isOpen || !template) return null;

  const [recipient, setRecipient] = useState(
    channelKey === 'whatsapp' ? '+919001050074' : (channelKey === 'email' ? 'yanitay1215@gmail.com' : 'Browser Client')
  );
  const [customUsername, setCustomUsername] = useState('Anita');
  const [customOrder, setCustomOrder] = useState('ORD-5541');
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    setRecipient(
      channelKey === 'whatsapp' ? '+919001050074' : (channelKey === 'email' ? 'yanitay1215@gmail.com' : 'Browser Client')
    );
    setResult(null);
  }, [channelKey, template?.id]);

  const channelMeta = {
    whatsapp: { 
      name: 'WhatsApp Cloud API', 
      icon: Smartphone, 
      color: 'text-emerald-400', 
      recipientLabel: 'Recipient Phone Number (E.164 with country code):',
      help: 'In Meta Sandbox, make sure this phone number is added to your Allowed Test Recipient list in Meta App Dashboard.' 
    },
    email: { 
      name: 'Email (Postmark / Resend)', 
      icon: Mail, 
      color: 'text-blue-400', 
      recipientLabel: 'Recipient Email Address:',
      help: 'Sends a transactional email with the rendered subject and body.' 
    },
    web_push: { 
      name: 'Web Push (Browser)', 
      icon: Globe, 
      color: 'text-purple-400', 
      recipientLabel: 'Push Target:',
      help: 'Directly triggers a browser push pop-up on all subscribed browser clients.' 
    }
  }[channelKey] || { name: 'Channel', icon: Mail, color: 'text-slate-400', recipientLabel: 'Recipient:', help: '' };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await onSendTest(template.id, recipient, {
        username: customUsername,
        order_id: customOrder
      });
      setResult(response);
    } catch (err) {
      setResult({
        success: false,
        error: err.message || 'Failed to dispatch test notification'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReSubscribe = async () => {
    setSubscribing(true);
    try {
      if (onSubscribePush) {
        await onSubscribePush();
        setResult({
          success: true,
          results: {
            web_push: {
              status: 'sent',
              note: 'Browser successfully re-subscribed with fresh VAPID key! Now click "Send Test Message" below.'
            }
          }
        });
      }
    } catch (err) {
      alert('Subscription error: ' + err.message);
    } finally {
      setSubscribing(false);
    }
  };

  const IconComponent = channelMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header - Fixed */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-slate-800 border border-slate-700 ${channelMeta.color}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Test Send Cell</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
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

        {/* Content - Scrollable */}
        <form id="test-send-form" onSubmit={handleSend} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Channel OFF Warning */}
          {!template.is_enabled && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-200">Channel is currently toggled OFF in the Matrix</span>
                <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                  Notifications for {channelMeta.name} are disabled. To send messages or test notifications, please switch the toggle <strong>ON</strong> in the Admin Notification Matrix table.
                </p>
              </div>
            </div>
          )}

          {/* Template Info Card */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
            <div className="font-semibold text-slate-300">Template to Send:</div>
            {template.title && <div className="text-indigo-300 font-medium">{template.title}</div>}
            <div className="text-slate-400 font-mono line-clamp-2">{template.body}</div>
          </div>

          {/* Recipient Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {channelMeta.recipientLabel}
            </label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={channelKey === 'web_push'}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none transition disabled:opacity-60"
            />
            <p className="text-[11px] text-slate-400 mt-1">{channelMeta.help}</p>

            {/* Direct Re-Subscribe button for Web Push */}
            {channelKey === 'web_push' && (
              <button
                type="button"
                onClick={handleReSubscribe}
                disabled={subscribing}
                className="mt-2.5 w-full py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center space-x-2 transition"
              >
                {subscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Click here to Refresh Browser Push Subscription</span>
              </button>
            )}
          </div>

          {/* Dynamic Test Variables */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Test Username {'{{username}}'}:</label>
              <input
                type="text"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Test Order {'{{order_id}}'}:</label>
              <input
                type="text"
                value={customOrder}
                onChange={(e) => setCustomOrder(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Result Card */}
          {result && (() => {
            const chRes = result.results?.[channelKey] || {};
            const chStatus = chRes.status || result.status || (result.success ? 'sent' : 'failed');
            const isSkipped = chStatus === 'skipped';
            const isSent = chStatus === 'sent';
            const isFailed = (chStatus === 'failed' || result.success === false) && !isSkipped;
            const isSimulated = chStatus === 'simulated';

            return (
              <div className={`p-3.5 rounded-xl border mt-2 text-xs space-y-2 transition-all ${
                isSkipped
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                  : (isSent 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
                      : (isFailed 
                          ? 'bg-rose-950/40 border-rose-500/30 text-rose-200' 
                          : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'))
              }`}>
                <div className="flex items-center space-x-2 font-semibold">
                  {isSkipped && (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Notification Skipped (Channel Toggle is OFF)</span>
                    </>
                  )}
                  {isSent && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Message Sent Successfully via Live Provider!</span>
                    </>
                  )}
                  {isFailed && (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>Delivery Failed via Live Provider</span>
                    </>
                  )}
                  {isSimulated && (
                    <>
                      <AlertTriangle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span>Dispatched via Sandbox Simulation Mode</span>
                    </>
                  )}
                </div>

                {chRes.note && (
                  <div className="text-[11px] text-slate-300">
                    {chRes.note}
                  </div>
                )}

                {(chRes.error || result.error || chRes.message) && (
                  <div className={`text-[11px] font-mono p-2 rounded border max-h-24 overflow-y-auto ${
                    isSkipped 
                      ? 'bg-amber-950/40 text-amber-200 border-amber-800/40' 
                      : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                  }`}>
                    <div className="font-bold mb-0.5">{isSkipped ? 'Status Detail:' : 'Provider Error:'}</div>
                    <div className="whitespace-pre-wrap">{chRes.error || result.error || chRes.message}</div>
                  </div>
                )}

                {chRes.troubleshooting && (
                  <div className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded border border-amber-500/20">
                    <span className="font-bold">Troubleshooting: </span>
                    {chRes.troubleshooting}
                  </div>
                )}
              </div>
            );
          })()}

        </form>

        {/* Footer - Fixed at bottom */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
          >
            Close
          </button>

          <button
            type="submit"
            form="test-send-form"
            disabled={loading || !template.is_enabled}
            title={!template.is_enabled ? "Enable channel toggle in Matrix to send" : ""}
            className={`px-5 py-2 rounded-lg text-white text-sm font-semibold transition flex items-center space-x-2 ${
              !template.is_enabled
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30'
            } disabled:opacity-60`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : !template.is_enabled ? (
              <>
                <span>Channel is OFF</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Test Message</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
