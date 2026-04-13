import { useState } from "react";
import { X, MessageSquare, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: Props) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    const text = message.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      setDone(true);
      setTimeout(onClose, 1500);
    } catch {
      // silently close on error — feedback is best-effort
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">Thanks for your feedback!</p>
            <p className="text-sm text-gray-500 mt-1">It helps us improve FactuurFlow.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Quick question</h2>
                <p className="text-xs text-gray-500 mt-0.5">Takes 10 seconds, helps a lot</p>
              </div>
            </div>

            <p className="text-sm font-medium text-gray-800 mb-3">
              What was missing or could be better?
            </p>

            <textarea
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              placeholder="e.g. I couldn't add a discount line, or the PDF font was too small..."
              rows={4}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl resize-none
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                placeholder-gray-400 bg-white"
            />
            <p className="text-xs text-gray-400 mt-1 mb-4">Ctrl+Enter to submit</p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium
                  bg-green-600 hover:bg-green-700 text-white rounded-xl transition disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Submit feedback
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-4 text-sm font-medium text-gray-500 hover:text-gray-700
                  border border-gray-200 rounded-xl transition hover:bg-gray-50"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
