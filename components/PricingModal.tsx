import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Zap, Shield, CreditCard, ChevronLeft, Lock, Calendar, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { Plan, PLANS } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: Plan;
  onUpgrade: (plan: Plan) => void;
}

type Step = 'select-plan' | 'checkout' | 'processing' | 'success' | 'manage';
type PaymentMethod = 'card' | 'paypal' | 'crypto';

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, currentPlan, onUpgrade }) => {
  const [step, setStep] = useState<Step>(currentPlan !== 'free' ? 'manage' : 'select-plan');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  
  // Form State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    if (isOpen) {
        setStep(currentPlan !== 'free' ? 'manage' : 'select-plan');
        setCardNumber('');
        setExpiry('');
        setCvc('');
        setCardError('');
    }
  }, [isOpen, currentPlan]);

  if (!isOpen) return null;

  const handleSelectPlan = (plan: Plan) => {
    if (plan === currentPlan) return;
    setSelectedPlan(plan);
    setStep('checkout');
  };

  // Basic Luhn algorithm check for simulation
  const validateCard = () => {
    if (cardNumber.replace(/\s/g, '').length < 13) {
        setCardError('Invalid card number length');
        return false;
    }
    if (expiry.length < 5) {
        setCardError('Invalid expiry date');
        return false;
    }
    if (cvc.length < 3) {
        setCardError('Invalid CVC');
        return false;
    }
    return true;
  };

  const handleFormatCard = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 16) v = v.slice(0, 16);
      const parts = [];
      for (let i = 0; i < v.length; i += 4) {
          parts.push(v.slice(i, i + 4));
      }
      setCardNumber(parts.join(' '));
  };

  const handleFormatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 4) v = v.slice(0, 4);
      if (v.length >= 2) {
          setExpiry(v.slice(0, 2) + '/' + v.slice(2));
      } else {
          setExpiry(v);
      }
  };

  const handleConfirmPayment = () => {
    if (!selectedPlan) return;
    setCardError('');
    
    if (paymentMethod === 'card' && !validateCard()) {
        return;
    }

    setStep('processing');
    
    // Simulate API Payment Processing
    setTimeout(() => {
      // Simulate success
      setStep('success');
      // Update local storage and app state immediately
      onUpgrade(selectedPlan);
      
      // Auto close after success
      setTimeout(() => {
          onClose();
      }, 2500);
    }, 2000);
  };

  const handleCancelSubscription = () => {
      if (confirm("Are you sure you want to cancel your subscription? You will lose access to premium features.")) {
          setStep('processing');
          setTimeout(() => {
            onUpgrade('free');
            onClose();
          }, 1500);
      }
  };

  const planDetails = selectedPlan ? PLANS[selectedPlan] : null;
  const currentPlanDetails = PLANS[currentPlan];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white z-20"
        >
            <X size={24} />
        </button>

        {step === 'manage' ? (
             /* --- STEP: MANAGE SUBSCRIPTION --- */
             <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                 <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
                     <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${currentPlan === 'pro' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-blue-600'}`}>
                            {currentPlan === 'pro' ? <Sparkles size={24} className="text-white" /> : <Zap size={24} className="text-white" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white">Manage Subscription</h2>
                     </div>
                     <p className="text-slate-400">Manage your billing and plan details</p>
                 </div>

                 <div className="p-8 space-y-8">
                    {/* Current Plan Card */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Current Plan</div>
                                <div className="text-3xl font-bold text-white">{currentPlanDetails.name}</div>
                                <div className="text-slate-400 mt-1">{currentPlanDetails.price} / month</div>
                            </div>
                            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase">Active</span>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-slate-300 border-t border-slate-800 pt-4">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-slate-500" />
                                <span>Next billing: <strong>{new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CreditCard size={16} className="text-slate-500" />
                                <span>Visa ending in <strong>4242</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => setStep('select-plan')}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all border border-slate-700"
                        >
                            Change Plan
                        </button>
                        <button 
                            onClick={handleCancelSubscription}
                            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-all border border-red-500/20"
                        >
                             Cancel Subscription
                        </button>
                    </div>
                 </div>
             </div>

        ) : step === 'select-plan' ? (
          /* --- STEP 1: PLAN SELECTION --- */
          <div>
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Upgrade your intelligence</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">Unlock the full potential of Gemini 2.0 with larger context windows, faster reasoning, and advanced coding capabilities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(PLANS).map(([key, plan]) => {
                    const isCurrent = currentPlan === key;
                    const isPro = key === 'pro';
                    
                    return (
                        <div key={key} className={`relative bg-slate-900/60 backdrop-blur-xl border ${isCurrent ? 'border-slate-600 bg-slate-800/40' : isPro ? 'border-purple-500/50 shadow-purple-500/10 shadow-xl' : 'border-slate-700'} rounded-2xl p-6 flex flex-col transition-transform hover:scale-[1.01]`}>
                            
                            {isPro && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                    Best Value
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className={`text-xl font-semibold ${isPro ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-white'}`}>{plan.name}</h3>
                                <div className="text-3xl font-bold text-slate-100 mt-2">{plan.price} <span className="text-sm font-normal text-slate-500">/mo</span></div>
                            </div>
                            
                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                        <Check size={16} className={`${isPro ? 'text-purple-400' : 'text-slate-500'} mt-0.5 shrink-0`} />
                                        <span>{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <button 
                                disabled={isCurrent}
                                onClick={() => handleSelectPlan(key as Plan)}
                                className={`w-full py-3 rounded-xl font-medium transition-all ${
                                    isCurrent 
                                        ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700' 
                                        : isPro 
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25' 
                                            : 'bg-white text-slate-900 hover:bg-slate-200'
                                }`}
                            >
                                {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            {currentPlan !== 'free' && (
                 <div className="mt-8 text-center">
                     <button onClick={() => setStep('manage')} className="text-sm text-slate-400 hover:text-white underline">
                         Back to Subscription Management
                     </button>
                 </div>
            )}
          </div>
        ) : step === 'processing' ? (
            /* --- STEP 3: PROCESSING --- */
            <div className="max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-12 text-center shadow-2xl">
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <Lock className="absolute inset-0 m-auto text-blue-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Processing Payment</h3>
                <p className="text-slate-400">Securely verifying your credentials...</p>
            </div>
        ) : step === 'success' ? (
             /* --- STEP 4: SUCCESS --- */
            <div className="max-w-md mx-auto bg-slate-900 border border-green-500/30 rounded-2xl p-12 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/10 blur-xl"></div>
                <div className="relative z-10">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/40 animate-in zoom-in duration-300">
                        <Check size={40} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Upgrade Complete!</h3>
                    <p className="text-slate-300 mb-6">You are now on the <span className="font-bold text-white">{planDetails?.name} Plan</span>.</p>
                    <p className="text-xs text-slate-500">Redirecting...</p>
                </div>
            </div>
        ) : (
          /* --- STEP 2: CHECKOUT / PAYMENT METHODS --- */
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center gap-4">
                <button onClick={() => setStep('select-plan')} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-white">Checkout</h3>
                    <p className="text-xs text-slate-400">Complete your subscription upgrade</p>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                
                {/* Order Summary */}
                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedPlan === 'pro' ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-blue-600'}`}>
                             {selectedPlan === 'pro' ? <Sparkles size={20} className="text-white" /> : <Zap size={20} className="text-white" />}
                        </div>
                        <div>
                            <div className="font-semibold text-white">PS AI {planDetails?.name} Plan</div>
                            <div className="text-xs text-slate-400">Monthly Subscription</div>
                        </div>
                    </div>
                    <div className="text-xl font-bold text-white">{planDetails?.price}</div>
                </div>

                {/* Payment Methods */}
                <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider">Payment Method</h4>
                    <div className="space-y-2">
                        
                        {/* Credit Card */}
                        <div 
                            onClick={() => setPaymentMethod('card')}
                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                paymentMethod === 'card' 
                                    ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/50' 
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                            }`}
                        >
                            <div className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                                {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                            </div>
                            <CreditCard size={20} className="text-slate-300" />
                            <div className="flex-1">
                                <div className="text-sm font-medium text-white">Credit / Debit Card</div>
                            </div>
                            <div className="flex gap-1">
                                <div className="w-8 h-5 bg-slate-700 rounded" />
                                <div className="w-8 h-5 bg-slate-700 rounded" />
                            </div>
                        </div>
                        
                        {/* Card Details Form (Visible only if Card selected) */}
                        {paymentMethod === 'card' && (
                             <div className="pl-9 pr-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <input 
                                    type="text" 
                                    placeholder="Card number (1234 5678 1234 5678)" 
                                    value={cardNumber}
                                    onChange={handleFormatCard}
                                    className={`w-full bg-slate-950 border ${cardError && cardNumber.length < 16 ? 'border-red-500' : 'border-slate-700'} rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500`} 
                                />
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="MM / YY" 
                                        value={expiry}
                                        onChange={handleFormatExpiry}
                                        className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="CVC" 
                                        value={cvc}
                                        maxLength={3}
                                        onChange={(e) => setCvc(e.target.value.replace(/\D/g,''))}
                                        className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                                    />
                                </div>
                                {cardError && (
                                    <div className="flex items-center gap-2 text-red-400 text-xs">
                                        <AlertCircle size={12} /> {cardError}
                                    </div>
                                )}
                             </div>
                        )}

                        {/* PayPal */}
                        <div 
                            onClick={() => setPaymentMethod('paypal')}
                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                paymentMethod === 'paypal' 
                                    ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/50' 
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                            }`}
                        >
                            <div className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                                {paymentMethod === 'paypal' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                            </div>
                            <span className="font-bold text-slate-300 italic">PayPal</span>
                        </div>

                    </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-sm text-slate-400">Total due today</div>
                        <div className="text-2xl font-bold text-white">{planDetails?.price}</div>
                    </div>

                    <button 
                        onClick={handleConfirmPayment}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                    >
                        <Lock size={18} /> Confirm Subscription
                    </button>
                    <p className="text-center text-[10px] text-slate-600 mt-4">
                        By confirming, you agree to the Terms of Service. You will be charged {planDetails?.price} immediately.
                    </p>
                </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PricingModal;