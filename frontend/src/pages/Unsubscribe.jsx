import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MailCheck, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

const Unsubscribe = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`/api/unsubscribe/${token}`);
        if (res.data.success) {
          setInfo(res.data);
          setUnsubscribed(res.data.unsubscribed);
        }
      } catch (err) {
        setError('This unsubscribe link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [token]);

  const handleConfirmUnsubscribe = async () => {
    setProcessing(true);
    try {
      const res = await axios.post(`/api/unsubscribe/${token}`);
      if (res.data.success) {
        setUnsubscribed(true);
      }
    } catch (err) {
      setError('Failed to process unsubscribe request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a11] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Theme Background Video */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-25 filter blur-[1px] scale-105"
        >
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#070a11]/85 via-[#070a11]/70 to-[#070a11]/90" />
      </div>

      <div className="w-full max-w-md glass-panel border border-white/15 rounded-3xl p-8 shadow-2xl z-10 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30 border border-white/20">
          <MailCheck className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-xl font-extrabold text-white tracking-tight mb-2">Email Preference Center</h1>

        {loading ? (
          <p className="text-xs text-slate-400">Verifying recipient token...</p>
        ) : error ? (
          <div className="p-4 rounded-2xl glass-badge-rose text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : unsubscribed ? (
          <div className="p-6 rounded-3xl glass-badge-emerald text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
            <h3 className="font-extrabold text-sm text-white">Unsubscribed Successfully</h3>
            <p className="text-slate-300">
              <code className="font-mono text-emerald-300 font-bold">{info?.email}</code> will no longer receive automated outreach messages.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to unsubscribe <strong className="text-indigo-300 font-mono font-bold">{info?.email}</strong> from future email campaigns?
            </p>

            <button
              onClick={handleConfirmUnsubscribe}
              disabled={processing}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {processing ? 'Unsubscribing...' : 'Confirm Unsubscribe'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
