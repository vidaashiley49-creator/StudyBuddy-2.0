import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { PLANS } from '../constants/index.ts';
import { PlanTier } from '../types/index.ts';
import { Crown, Check, Zap, AlertCircle, ShieldCheck, X } from 'lucide-react';

export const UpgradeView: React.FC = () => {
  const { plan, setPlanTier, addToast } = useApp();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanTier | null>(null);
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'telecel' | 'at' | 'card'>('mtn');
  const [momoNumber, setMomoNumber] = useState('0244123456');

  const handleCheckoutConfirm = () => {
    if (!selectedPlanForCheckout) return;
    setPlanTier(selectedPlanForCheckout, isAnnual);
    setSelectedPlanForCheckout(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Title & Billing Toggle */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <Crown className="w-3.5 h-3.5" />
          <span>Flexible Revision Subscriptions</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Choose Your Study Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Start free today. Upgrade anytime you need unlimited AI explanations, deeper mock tests, and full exam prep toolkits.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span
            className={`text-xs font-bold cursor-pointer ${
              !isAnnual ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
            }`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly Billing
          </span>

          <button
            type="button"
            onClick={() => setIsAnnual(!isAnnual)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              isAnnual ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          <span
            className={`text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
              isAnnual ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
            }`}
            onClick={() => setIsAnnual(true)}
          >
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(PLANS) as PlanTier[]).map((tierKey) => {
          const p = PLANS[tierKey];
          const isCurrent = plan.tier === tierKey;
          const isPlus = tierKey === 'plus';

          const monthlyPrice = p.price;
          const annualDiscountedPrice = Math.round(p.price * 12 * 0.8);
          const displayPrice = isAnnual ? annualDiscountedPrice : monthlyPrice;

          return (
            <div
              key={tierKey}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all bg-white dark:bg-slate-900 border ${
                isPlus
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl shadow-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {isPlus && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                      {p.name.replace('StudyBuddy ', '')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.tagline}</p>
                  </div>

                  {isCurrent && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Active
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    {p.price > 0 && <span className="text-sm font-bold text-slate-400">GH₵</span>}
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                      {p.price === 0 ? 'Free' : displayPrice}
                    </span>
                    {p.price > 0 && (
                      <span className="text-xs text-slate-400 font-semibold">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {isAnnual && p.price > 0 && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      Save 20% vs monthly
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    What's included:
                  </div>
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => {
                    if (tierKey === 'starter') {
                      setPlanTier('starter');
                    } else {
                      setSelectedPlanForCheckout(tierKey);
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : isPlus
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : tierKey === 'starter' ? 'Downgrade to Free' : `Select ${p.name.replace('StudyBuddy ', '')}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Gateway Info Notice */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900 dark:text-white">
            Test Mode Gateway & Entitlements Simulation
          </div>
          <p className="leading-relaxed">
            Plan upgrades run in simulation test mode with Ghanaian Mobile Money (MTN MoMo, Telecel Cash, AT Money) and Visa/Mastercard. Selecting a plan grants immediate quota access so you can evaluate the experience without live merchant fees.
          </p>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-indigo-500" />
                Upgrade to {PLANS[selectedPlanForCheckout].name}
              </h3>
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price line */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isAnnual ? 'Annual Membership (Save 20%)' : 'Monthly Revision Plan'}
              </span>
              <span className="font-black text-indigo-700 dark:text-indigo-300 text-lg">
                GH₵
                {isAnnual
                  ? Math.round(PLANS[selectedPlanForCheckout].price * 12 * 0.8)
                  : PLANS[selectedPlanForCheckout].price}
              </span>
            </div>

            {/* Payment channel select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Select Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'mtn' as const, label: 'MTN Mobile Money' },
                  { id: 'telecel' as const, label: 'Telecel Cash' },
                  { id: 'at' as const, label: 'AT Money' },
                  { id: 'card' as const, label: 'Debit / Credit Card' },
                ].map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setMomoProvider(channel.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                      momoProvider === channel.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account / Phone input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {momoProvider === 'card' ? 'Card Number (Demo)' : 'Mobile Money Wallet Number'}
              </label>
              <input
                type="text"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                placeholder={momoProvider === 'card' ? '4111 2222 3333 4444' : '024 400 0000'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Evaluation Test Mode:</strong> Confirming activates the higher quota limits immediately without charging real money.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckoutConfirm}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md"
              >
                Confirm & Activate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
