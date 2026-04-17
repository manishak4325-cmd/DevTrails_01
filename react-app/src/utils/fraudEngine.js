// ===== FRAUD DETECTION ENGINE =====

const WEIGHTS = { gps: 0.30, activity: 0.30, claim: 0.20, noDup: 0.20 };

/**
 * Simulate fraud/eligibility score for a user
 */
export function simulateFraudScore(payouts = [], processedEvents = new Set(), claimPenalty = 0) {
  const gpsConsistency  = 0.5 + Math.random() * 0.5;
  const activityLevel   = 0.4 + Math.random() * 0.6;

  const totalClaims    = payouts.length;
  const approvedClaims = payouts.filter(c => c.status === 'Approved').length;
  const baseClaimAcc   = totalClaims > 0
    ? approvedClaims / totalClaims
    : 0.6 + Math.random() * 0.35;
  const claimAccuracy  = Math.max(0.05, Math.min(1, baseClaimAcc - claimPenalty));
  const noDuplicateClaims = processedEvents.size > 3 ? 0.5 : 0.7 + Math.random() * 0.3;

  const score = (
    WEIGHTS.gps      * gpsConsistency +
    WEIGHTS.activity * activityLevel  +
    WEIGHTS.claim    * claimAccuracy  +
    WEIGHTS.noDup    * noDuplicateClaims
  );

  return {
    score: parseFloat(score.toFixed(2)),
    gpsConsistency,
    activityLevel,
    claimAccuracy,
    noDuplicateClaims,
  };
}

/**
 * Classify score tier
 */
export function classifyScore(score) {
  if (score > 0.75) return { tier: 'GOOD',   cls: 'good',   emoji: '🟢', color: '#10b981' };
  if (score >= 0.4) return { tier: 'REVIEW', cls: 'review', emoji: '🟡', color: '#f59e0b' };
  return               { tier: 'RISK',   cls: 'risk',   emoji: '🔴', color: '#ef4444' };
}

/**
 * Get benefit text based on score
 */
export function getScoreBenefit(score) {
  if (score > 0.88) return {
    cls:  'good-benefit',
    html: '🏅 <strong>Trusted Rider</strong> — You qualify for a 10% premium discount on your plan!',
  };
  if (score >= 0.4) return {
    cls:  'review-benefit',
    html: '⚖️ <strong>Standard Tier</strong> — Keep riding consistently to unlock better rates.',
  };
  return {
    cls:  'risk-benefit',
    html: '⚠️ <strong>Under Review</strong> — Claims may be restricted. Improve activity score.',
  };
}

/**
 * Detect fraudulent behavior patterns
 * Returns { isFraud, reason }
 */
export function detectFraud(movementScore, activityLogs, claimHistory) {
  const noMovement = movementScore < 0.1;
  const noActivity = activityLogs.length === 0;
  const tooManyRecentClaims = claimHistory.filter(c => {
    const d = new Date(c.date);
    return !isNaN(d) && (Date.now() - d.getTime()) < 24 * 60 * 60 * 1000;
  }).length > 3;

  if (noMovement)          return { isFraud: true,  reason: 'No movement detected — possible spoofing' };
  if (noActivity)          return { isFraud: true,  reason: 'No platform activity logs found' };
  if (tooManyRecentClaims) return { isFraud: true,  reason: 'Unrealistic claim frequency detected' };
  return                          { isFraud: false, reason: null };
}

/**
 * Generate simulated activity logs for demo
 */
export function generateActivityLogs() {
  const events = ['Order pickup', 'Order delivered', 'Break started', 'Break ended', 'Route change', 'Zone entered'];
  const count = 8 + Math.floor(Math.random() * 8);
  return Array.from({ length: count }, (_, i) => ({
    time: new Date(Date.now() - (count - i) * 18 * 60000).toLocaleTimeString('en-IN'),
    event: events[Math.floor(Math.random() * events.length)],
    location: `Zone ${Math.floor(Math.random() * 7) + 1}`,
  }));
}
