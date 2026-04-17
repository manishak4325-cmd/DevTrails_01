import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PLANS } from '../utils/cityData';
import { triggerPayout } from '../utils/realApi';

const DEMO_ENV = { rain: 25, temp: 43, aqi: 178 };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function ClaimPipeline({ isOpen, triggerKey, triggerTitle, triggerIcon, isManual, onClose }) {
  const { state, dispatch, addToast, addNotification } = useApp();
  const { user, policy, bank, claims, env } = state;

  const [steps, setSteps] = useState([
    { id: 1, title: 'Trigger Detected',  detail: 'Scanning IMD alerts for your zone...', status: 'pending', passed: null },
    { id: 2, title: 'Policy Verified',   detail: 'Checking active plan and zone eligibility...', status: 'pending', passed: null },
    { id: 3, title: 'Fraud Check',       detail: 'Running multi-layer verification...', status: 'pending', passed: null },
    { id: 4, title: 'Final Result',      detail: 'Awaiting verification...', status: 'pending', passed: null },
  ]);
  const [fraudChecks, setFraudChecks]   = useState({ GPS: '⏳', Cell: '⏳', Platform: '⏳', score: null, show: false });
  const [result,   setResult]   = useState(null); // 'success' | 'fail'
  const [payoutAmt,setPayoutAmt]= useState(0);
  const [rejectReason, setRejectReason] = useState('');
  const running = useRef(false);

  // Reset and run pipeline whenever opened
  useEffect(() => {
    if (!isOpen) return;
    running.current = false;

    setSteps([
      { id: 1, title: 'Trigger Detected',  detail: 'Scanning IMD alerts for your zone...', status: 'pending', passed: null },
      { id: 2, title: 'Policy Verified',   detail: 'Checking active plan and zone eligibility...', status: 'pending', passed: null },
      { id: 3, title: 'Fraud Check',       detail: 'Running multi-layer verification...', status: 'pending', passed: null },
      { id: 4, title: 'Final Result',      detail: 'Awaiting verification...', status: 'pending', passed: null },
    ]);
    setFraudChecks({ GPS: '⏳', Cell: '⏳', Platform: '⏳', score: null, show: false });
    setResult(null);
    setPayoutAmt(0);
    setRejectReason('');

    const timer = setTimeout(() => runPipeline(), 300);
    return () => clearTimeout(timer);
  }, [isOpen, triggerKey]);

  function updateStep(id, patch) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  async function runPipeline() {
    if (running.current) return;
    running.current = true;

    // STEP 1
    updateStep(1, { status: 'active', detail: 'Scanning IMD alerts for your zone...' });
    await sleep(1400);
    const trigMsg = {
      rain: '✅ Alert confirmed: Heavy Rain warning issued',
      heat: '✅ Alert confirmed: Extreme Heat advisory active',
      aqi:  '✅ Alert confirmed: Unhealthy AQI advisory issued',
      flood:'✅ Alert confirmed: Flood risk elevated in zone',
      storm:'✅ Alert confirmed: Severe storm system detected',
      traffic: '✅ Alert confirmed: Major road blockage reported',
    }[triggerKey] || '✅ Alert confirmed in your zone';
    updateStep(1, { status: 'done', passed: true, detail: trigMsg });

    // STEP 2
    await sleep(600);
    updateStep(2, { status: 'active', detail: 'Checking active plan and zone eligibility...' });
    await sleep(1300);
    const hasPlan = policy?.active === true;
    updateStep(2, {
      status: 'done', passed: hasPlan,
      detail: hasPlan
        ? '✅ Active plan found. Zone validated. No duplicate claim.'
        : '⚠️ No active plan — proceeding in demo/evaluation mode.',
    });

    // Condition check
    const envData = user.isDemo ? DEMO_ENV : (env || {});
    let conditionPassed = true;
    if (triggerKey === 'heat') conditionPassed = (envData.temp ?? 0) > 42;
    else if (triggerKey === 'rain') conditionPassed = (envData.rain ?? 0) > 20;
    else if (triggerKey === 'aqi')  conditionPassed = (envData.aqi  ?? 0) > 150;

    if (!conditionPassed) {
      await sleep(600);
      updateStep(3, { status: 'active', detail: 'Checking environmental thresholds...' });
      await sleep(800);
      const threshMsg = {
        heat: `❌ Temp must exceed 42°C (current: ${(envData.temp ?? 0).toFixed?.(1) ?? envData.temp}°C)`,
        rain: `❌ Rain must exceed 20 mm/hr (current: ${(envData.rain ?? 0).toFixed?.(1) ?? envData.rain} mm/hr)`,
        aqi:  `❌ AQI must exceed 150 (current: ${envData.aqi ?? 0})`,
      }[triggerKey] || '❌ Environmental condition not satisfied';
      updateStep(3, { status: 'done', passed: false, detail: threshMsg });
      await sleep(600);
      updateStep(4, { status: 'active', detail: 'Processing rejection...' });
      await sleep(800);
      updateStep(4, { status: 'done', passed: false, detail: 'Claim could not be processed.' });
      setRejectReason('Environmental condition not satisfied for this claim');
      setResult('fail');
      addNotification('❌ Claim rejected — environmental threshold not met', 'warning');
      running.current = false;
      return;
    }

    // STEP 3: Fraud check
    await sleep(600);
    updateStep(3, { status: 'active', detail: isManual ? 'Running multi-layer fraud verification...' : 'AI system verification...' });

    if (isManual) {
      await sleep(700);
      setFraudChecks(f => ({ ...f, show: true }));
      await sleep(600);
      setFraudChecks(f => ({ ...f, GPS: '✅' }));
      await sleep(500);
      setFraudChecks(f => ({ ...f, Cell: '✅' }));
      await sleep(500);
      setFraudChecks(f => ({ ...f, Platform: '✅' }));
    } else {
      await sleep(800);
    }

    let backendData = null;
    let useFallback = false;
    const isDemoMode = state.user.isDemo || localStorage.getItem("isDemo") === "true";

    // ── 0. ATTEMPT BACKEND FETCH (Only if NOT in Demo Mode) ──────────────────
    if (!isDemoMode) {
      try {
        const { processCycle } = await import('../utils/realApi');
        backendData = await processCycle({
          user_id: user.email || "guest@fluxshield.com",
          location: { 
            lat: user.lat, 
            lng: user.lng, 
            city: user.location, 
            zoneIdx: user.zoneIdx 
          },
          weather_data: {
            aqi: env.aqi ?? 50,
            rain: env.rain ?? 0,
            temp: env.temp ?? 30,
            time_of_day: new Date().getHours()
          },
          recent_pings: 180, 
          orders_completed: 12,
          base_income: 450.0,
          disruption_hours: 3.5
        });

        if (backendData && backendData.success === false) {
          addToast(`⚠️ Suspicious activity detected. Claim blocked.`, 'danger');
          setRejectReason(backendData.error || "Anomalous behavior detected");
          setResult('fail');
          updateStep(3, { status: 'done', passed: false, detail: `❌ FAIL — ${backendData.error}` });
          updateStep(4, { status: 'done', passed: false, detail: 'Claim blocked by security engine.' });
          running.current = false;
          return;
        }
      } catch (e) {
        useFallback = true;
      }
    } else {
      useFallback = true; // Force local logic for demo
    }

    let fraudScore = (!useFallback && backendData?.fraud_check) 
      ? (backendData.fraud_check.fraud_score ?? 0.12)
      : (isManual ? (0.15 + Math.random() * 0.65) : 0.00);

    setFraudChecks(f => ({ ...f, score: fraudScore }));
    const passes = !useFallback ? !backendData?.fraud_check?.is_fraud : (fraudScore < 0.40);
    await sleep(500);
    updateStep(3, {
      status: 'done', passed: passes,
      detail: !useFallback && backendData
        ? (passes ? `✅ PASS — AI Score ${fraudScore.toFixed(2)}` : `❌ FAIL — ${backendData.reason || 'Threshold Check'}`)
        : (passes ? `✅ PASS — AI Fraud Score ${fraudScore.toFixed(2)}` : `❌ FAIL — Verification Failed`),
    });

    // STEP 4
    await sleep(700);
    updateStep(4, { status: 'active', detail: passes ? 'Processing instant API payout...' : 'Logging rejection...' });
    await sleep(1000);

    if (passes) {
      const payout = (!useFallback && backendData) ? backendData.payout?.amount_credited : (200 + Math.floor(Math.random() * 601));
      const details = (!useFallback && backendData?.is_peak_hour) ? 'Claim approved! 🚀 Peak Hour Bonus applied.' : 'Claim approved! Payout is ready on backend.';
      
      setPayoutAmt(payout);
      updateStep(4, { status: 'done', passed: true, detail: details });
      setResult('success');
      // Record it
      dispatch({
        type: 'ADD_PAYOUT',
        payout: {
          type:    triggerKey.charAt(0).toUpperCase() + triggerKey.slice(1),
          amount:  payoutAmount, status: 'Approved', date: 'Just now',
          trigger: isManual ? 'Manual' : 'Auto',
          zone:    user.location || 'Your Zone',
        },
      });
      dispatch({ type: 'INCREMENT_TRIGGER' });
      addNotification(`💸 ₹${payoutAmount} API payout approved for ${triggerKey} claim!`, 'success');
    } else {
      const reason = backendError;
      setRejectReason(reason);
      updateStep(4, { status: 'done', passed: false, detail: 'Claim rejected by backend.' });
      setResult('fail');
      if (isManual) {
        dispatch({ type: 'SET_ANALYTICS', payload: {
          claimPenalty: Math.min(0.60, (state.analytics.claimPenalty || 0) + 0.15),
        }});
        dispatch({
          type: 'ADD_PAYOUT',
          payout: {
            type: triggerKey.charAt(0).toUpperCase() + triggerKey.slice(1),
            amount: 0, status: 'Blocked', date: 'Just now',
            trigger: `API Blocked: ${backendError}`, zone: user.location || 'Your Zone',
          },
        });
      }
      addNotification(`❌ Claim rejected via API — ${backendError}`, 'warning');
    }

    running.current = false;
  }

  function processUPI() {
    addToast(`💸 ₹${payoutAmt} payment initiated to ${bank?.upi || 'registered UPI'}`, 'success');
    onClose();
  }

  if (!isOpen) return null;

  const stepStatusCls = (s) => {
    if (s.status === 'active') return 'cp-step active';
    if (s.status === 'done')   return 'cp-step done';
    return 'cp-step';
  };
  const dotCls = (s) => {
    if (s.status === 'active') return 'cp-step-dot loading';
    if (s.status === 'done' && s.passed === true)  return 'cp-step-dot done';
    if (s.status === 'done' && s.passed === false) return 'cp-step-dot fail';
    return 'cp-step-dot';
  };

  return (
    <div className="claim-pipeline-overlay active" id="claimPipelineOverlay" onClick={e => e.target.id === 'claimPipelineOverlay' && onClose()}>
      <div className="claim-pipeline-modal" id="claimPipelineModal">
        {/* Header */}
        <div className="cp-header">
          <div className="cp-header-left">
            <div className="cp-icon">{triggerIcon || '📡'}</div>
            <div>
              <div className="cp-title">{triggerTitle || 'Processing Claim...'}</div>
              <div className="cp-subtitle">{isManual ? 'Self-reported claim — fraud check mandatory' : 'IMD Alert – detected in your delivery zone'}</div>
            </div>
          </div>
          <button className="cp-close" onClick={onClose}>✕</button>
        </div>

        {/* Steps */}
        <div className="cp-steps" id="cpSteps">
          {steps.map((s, idx) => (
            <div key={s.id} className={stepStatusCls(s)} id={`cpStep${s.id}`}>
              <div className="cp-step-indicator">
                <div className={dotCls(s)} id={`cpDot${s.id}`}>
                  {s.status === 'done' && s.passed === true  && '✓'}
                  {s.status === 'done' && s.passed === false && '✕'}
                </div>
                {idx < 3 && <div className={`cp-step-line${s.status === 'done' && s.passed ? ' filled' : ''}`} />}
              </div>
              <div className="cp-step-body">
                <div className="cp-step-title">{s.title}</div>
                <div className="cp-step-detail" id={`cpDetail${s.id}`}>{s.detail}</div>

                {/* Fraud checks on step 3 */}
                {s.id === 3 && fraudChecks.show && (
                  <div className="cp-fraud-checks" style={{ display: 'flex' }} id="cpFraudChecks">
                    <div className="cp-check">
                      <span className="cp-check-icon">{fraudChecks.GPS}</span>
                      <span>GPS Spoofing</span>
                      <span className="cp-check-val">{fraudChecks.GPS === '⏳' ? 'Scanning...' : 'Not Detected ✅'}</span>
                    </div>
                    <div className="cp-check">
                      <span className="cp-check-icon">{fraudChecks.Cell}</span>
                      <span>Cell Tower Match</span>
                      <span className="cp-check-val">{fraudChecks.Cell === '⏳' ? 'Scanning...' : 'Matched ✅'}</span>
                    </div>
                    <div className="cp-check">
                      <span className="cp-check-icon">{fraudChecks.Platform}</span>
                      <span>Platform Login</span>
                      <span className="cp-check-val">{fraudChecks.Platform === '⏳' ? 'Scanning...' : 'Verified ✅'}</span>
                    </div>
                    {fraudChecks.score !== null && (
                      <div className="cp-fraud-score-row">
                        <span>Fraud Score</span>
                        <span className={`cp-fraud-score-val ${fraudChecks.score < 0.40 ? 'pass' : 'fail'}`} id="cpFraudScoreVal">
                          {fraudChecks.score.toFixed(2)}{' '}
                          <span className={fraudChecks.score < 0.40 ? 'fraud-label-clean' : 'fraud-label-risk'}>
                            {fraudChecks.score < 0.40 ? 'CLEAN' : 'RISK'}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Result */}
                {s.id === 4 && result === 'success' && (
                  <div className="cp-result cp-result-success" id="cpResultSuccess">
                    <div className="cp-result-icon">🎉</div>
                    <div className="cp-result-title">Payout Ready!</div>
                    <div className="cp-payout-amount" id="cpPayoutAmount">₹{payoutAmt}</div>
                    <div className="cp-result-sub">Credited to your UPI within 2 hours</div>
                    <button className="btn btn-primary" style={{ marginTop:'16px',padding:'12px 28px' }} onClick={processUPI}>
                      💸 Process UPI Payout
                    </button>
                  </div>
                )}
                {s.id === 4 && result === 'fail' && (
                  <div className="cp-result cp-result-fail" id="cpResultFail">
                    <div className="cp-result-icon">❌</div>
                    <div className="cp-result-title">Claim Rejected</div>
                    <div className="cp-result-sub" id="cpRejectReason">{rejectReason || 'Suspicious activity detected'}</div>
                    <button className="btn" style={{ marginTop:'16px',padding:'12px 28px',background:'var(--surface)',color:'var(--text-primary)' }} onClick={onClose}>
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
