import { PLANS, LOADING_FACTOR } from './cityData';
import { getRiskScore } from './riskEngine';

/**
 * Calculate dynamic premium using formula:
 * Premium = (Base × RiskScore) + (ExpectedLoss × Probability)
 */
export function calculatePremium(planId, cityRisk = 1.0, aqi = 0, rain = 0, heat = 25, stressMultiplier = 1.0) {
  const plan = PLANS[planId];
  if (!plan) return 35;

  const BASE_PRICES = { basic: 35, pro: 50, max: 65 };
  const base = BASE_PRICES[planId] || 35;

  const riskScore = getRiskScore(aqi, rain, heat);
  const expectedLoss = plan.prob * plan.loss * plan.days * stressMultiplier;
  const dynamicPremium = (base * (1 + riskScore * 0.3)) + (expectedLoss * plan.prob * cityRisk);

  // Clamp into realistic range
  return parseFloat(Math.min(75, Math.max(20, dynamicPremium)).toFixed(1));
}

/**
 * Calculate expected loss for a plan
 */
export function getExpectedLoss(planId, stressMultiplier = 1.0) {
  const plan = PLANS[planId];
  if (!plan) return 0;
  return Math.round(plan.prob * plan.loss * plan.days * stressMultiplier * 10);
}

/**
 * Apply loyalty discount if trust score is high
 */
export function applyLoyaltyDiscount(premium, trustScore) {
  if (trustScore != null && trustScore > 0.88) {
    return parseFloat((premium * 0.9).toFixed(1));
  }
  return premium;
}

/**
 * Calculate Burning Cost Ratio
 */
export function calcBCR(totalClaims, totalPremium) {
  if (!totalPremium) return 0;
  return parseFloat((totalClaims / totalPremium).toFixed(3));
}
