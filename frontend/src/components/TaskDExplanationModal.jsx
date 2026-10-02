import React from 'react';
import { HelpCircle, CheckCircle2, MessageSquare, ShieldCheck, Globe, Smartphone, Mail, Zap } from 'lucide-react';

export default function TaskDExplanationModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const questions = [
    {
      id: 1,
      q: "1. What is a trigger? Give 3 examples (not only login).",
      a: "A trigger is any event or condition on the website that automatically causes a notification to be sent. It represents 'WHEN' a message should fire.",
      examples: [
        "User Logout: Fires when a user signs out to confirm session termination.",
        "Not logged in for 1 week: A scheduled condition firing when a user hasn't visited in 7 days to drive re-engagement.",
        "Order Placed: A transactional event firing when a user successfully completes a checkout."
      ]
    },
    {
      id: 2,
      q: "2. What are the three channels?",
      a: "The three channels define 'WHERE' the message goes to reach the user:",
      channels: [
        { name: "WhatsApp", icon: Smartphone, desc: "Instant mobile messaging delivered directly to the user's phone via Meta WhatsApp Cloud API." },
        { name: "Email", icon: Mail, desc: "Transactional emails delivered straight to the user's inbox via Postmark (or Resend/Brevo)." },
        { name: "Web Push", icon: Globe, desc: "Native browser pop-up notifications displayed on desktop or mobile browsers even when the tab is backgrounded." }
      ]
    },
    {
      id: 3,
      q: "3. Why create templates in the admin panel instead of Postmark / WhatsApp site?",
      points: [
        "Single Source of Truth: Admins manage all 3 channels from one single matrix table without needing 3 separate logins across Meta, Postmark, and push provider portals.",
        "Unified Dynamic Variables: Variables like {{username}}, {{time}}, and {{order_id}} are mapped consistently across WhatsApp, Email, and Push in one place.",
        "Instant On/Off Toggles: Business teams can turn a channel on or off for any trigger immediately without developer intervention or touching 3 external platforms.",
        "Decoupled Providers: You can swap from Postmark to Resend or Brevo behind the scenes without rewriting templates or re-training staff."
      ]
    },
    {
      id: 4,
      q: "4. What is Web Push?",
      a: "Web Push is a browser-standard notification technology (using W3C Push API and Service Workers) that allows a website to deliver real-time pop-up notifications to users' desktop or mobile browsers. It works without requiring an installed mobile app and can alert the user even when the browser window is inactive."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Task D &bull; Core Concepts & Verbal Q&A Guide</h3>
              <p className="text-xs text-slate-400">Quick answers in simple words for your narrated walkthrough video</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Question 1 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>{questions[0].q}</span>
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">{questions[0].a}</p>
            <div className="pt-2 space-y-1">
              {questions[0].examples.map((ex, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">&bull;</span>
                  <span>{ex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>{questions[1].q}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {questions[1].channels.map((ch, i) => {
                const IconComponent = ch.icon;
                return (
                  <div key={i} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-white">
                      <IconComponent className="w-4 h-4 text-indigo-400" />
                      <span>{ch.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{ch.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question 3 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>{questions[2].q}</span>
            </h4>
            <div className="space-y-2 pt-1">
              {questions[2].points.map((pt, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question 4 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>{questions[3].q}</span>
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">{questions[3].a}</p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}
