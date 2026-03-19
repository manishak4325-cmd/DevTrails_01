# HyperNova — FluxShield
Real-Time Income Protection for Gig Workers

Guidewire DevTrails 2026 — Phase 1 Submission  
Platform: Progressive Web App  
Backend: Python | FastAPI  
AI/ML: XGBoost | Scikit-learn | Isolation Forest 

---

## Table of Contents

1. [Title & Introduction](#1-title--introduction)  
2. [Problem Statement](#2-problem-statement)  
3. [Personas — Who We Protect](#3-personas--who-we-protect)  
4. [Core Problem](#4-core-problem)  
5. [Solution (Overview)](#5-solution-overview)  
6. [Key Features](#6-key-features)  
7. [How It Works](#7-how-it-works)  
8. [Scenario](#8-scenario)  
9. [Premium Model](#9-premium-model)  
10. [Trigger System](#10-trigger-system)  
11. [AI & ML Integration](#11-ai--ml-integration)  
12. [Adversarial Defense & Anti-Spoofing Strategy](#12-adversarial-defense--anti-spoofing-strategy) 
13. [System Architecture](#13-system-architecture)  
14. [Application Workflow](#14-application-workflow)  
15. [Platform Choice (PWA)](#15-platform-choice-pwa)  
16. [Tech Stack](#16-tech-stack)  
17. [Future Scope](#17-future-scope)  
18. [Development Roadmap](#18-development-roadmap)  
19. [Closing Note](#19-closing-note)  

---

## 1. Title & Introduction

HyperNova is an AI-powered parametric insurance platform designed to protect gig workers from income loss caused by real-world disruptions.

Unlike traditional insurance systems that require manual claims and verification, HyperNova operates automatically. It continuously monitors environmental and behavioral signals, detects disruption events, estimates income loss, and triggers instant payouts.

This approach transforms insurance from a reactive system into a proactive, real-time financial safety net.

---

## 2. Problem Statement

India’s Q-commerce ecosystem (Blinkit, Zepto, Swiggy Instamart) depends on gig workers who earn on a per-delivery basis.

This model creates a critical vulnerability:
If the worker cannot work, they earn nothing.

Disruptions include:
- Smog (AQI above safe levels)
- Heavy rain and flooding
- Extreme heat conditions
- Safety risks during night shifts
- Platform outages or forced logoffs

These disruptions are not gradual — they cause immediate work stoppage.

As a result:
- Daily income drops to zero instantly
- Workers are forced to choose between safety and survival
- There is no fallback or compensation mechanism

![](https://github.com/manishak4325-cmd/DevTrails_01/blob/7e0a4bc654120de5f05a5f36d8d3ba9587a2526b/problemstatement.png)

---

## 3. Personas — Who We Protect

### Arjun — The Daily Wager

"One bad day equals one week of groceries gone"

| Attribute | Details |
|----------|--------|
| Age | 23 |
| Work | Blinkit/Zepto, 12 hours/day |
| Earnings | ₹500–700/day |
| Annual Loss | ₹26,400 |
| Biggest Fear | AQI 400 means zero income |

Arjun represents workers whose income is directly tied to daily activity. Environmental disruptions frequently force him to stop working, resulting in immediate financial loss.

---

### Priya — The Night Worker

"I earn the same as men, but I cannot work when they can"

| Attribute | Details |
|----------|--------|
| Age | 26 |
| Work | Zepto/Blinkit, 8 hours/day (wants 12) |
| Earnings | ₹400–500/day |
| Annual Loss | ₹62,400 |
| Biggest Fear | Losing income after 7 PM daily |

Priya represents workers impacted by safety constraints. She is unable to work during high-income time slots, leading to consistent and predictable income loss.

---

## 4. Core Problem

| Disruption | Example | Impact |
|-----------|--------|--------|
| Air Pollution | AQI > 400 | Unsafe to work |
| Rain/Flood | Roads blocked | No deliveries |
| Heat | > 45°C | Health risk |
| Traffic Curfew / Restrictions | Police restrictions, VIP movement, emergency lockdowns | Forced idle time |
| Safety Risk | Night shifts | Unsafe, especially for women |
| Platform Issues | Downtime / forced logoff | Zero income |

---

### Key Insight

The problem is not reduced productivity — it is **forced inactivity**.

Gig workers do not slow down during disruptions.  
They are **forced to stop working completely** due to:

- Government restrictions (curfews, traffic blocks)
- Environmental hazards (AQI, heat, rain)
- Safety risks (especially after dark)
- Platform-level failures

---

### Why This Matters

Unlike salaried employees:

- No work = No pay  
- No compensation during disruption  
- No insurance coverage for income loss  

---

### Real Impact

- Daily loss: ₹400–₹700  
- Monthly loss: ₹3,000–₹6,000  
- Annual loss: Up to 2–5 months of income  

---

### Core Problem Statement

Gig workers face **zero-income risk during uncontrollable disruptions**,  
with no system to compensate for forced inactivity.

## 5. Solution (Overview)

HyperNova introduces a parametric insurance model where payouts are triggered based on predefined real-world conditions rather than manual claims.

The system performs three core functions:

1. Detect disruptions using real-time external data (AQI, weather, platform signals)
2. Estimate income loss using AI models based on user behavior and historical earnings
3. Automatically trigger payouts when conditions are met

This removes friction, delays, and subjectivity from traditional insurance workflows.

---

## 6. Key Features

| Feature                   | Description                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
|  Parametric Auto-Payout | Automatic compensation triggered by verified disruptions — no claims or manual process.           |
|  Hyper-Local Detection  | Detects disruptions (rain, AQI, curfew, outages) at **zone-level precision**.                     |
|  Weekly Micro-Insurance | Flexible ₹50–₹80 weekly plans aligned with gig workers’ income cycle.                             |
|  Instant Payout Engine   | UPI-based automated payouts processed within minutes.                                             |
|  Rollback Protection   | Compensates workers for **remaining expected earnings** if they stop mid-shift due to disruption. |
|  Premium Gifting        | Users can sponsor insurance for other workers, enabling a **community safety net**.               |
|  Reward System          | Consistent activity and safe behavior reduce risk score → lower premiums.                         |
|  SOS + Safety Mode      | Emergency trigger for unsafe situations, especially helpful for women workers.                    |
|  Fraud Prevention       | Movement tracking, activity validation, and anomaly detection to prevent misuse.                  |
|  AI Risk Prediction     | Predicts disruption probability for smarter pricing and early alerts.                             |


---

## 7. How It Works

The system operates as a continuous loop:

1. User onboarding captures basic profile and working patterns  
2. AI models calculate risk score and assign a premium  
3. System continuously monitors environmental and activity signals  
4. When a trigger condition is detected, the system evaluates its validity  
5. Expected income is calculated using historical patterns  
6. Actual income is compared with expected income  
7. Fraud detection layer validates authenticity  
8. If valid, payout is triggered instantly

### System Flow Diagram

![image alt](https://github.com/manishak4325-cmd/DevTrails_01/blob/0503d9000b984c8ec5677af4b0984073f1176395/systemflow.png)


---

## 8. Scenario

Location: Delhi  
Condition: AQI reaches 420  

- Worker logs off due to unsafe air quality  
- System detects AQI threshold breach  
- AI calculates expected earnings for the remaining day  
- Actual earnings are compared  
- Loss is estimated at ₹520  
- Fraud checks confirm genuine activity  
- ₹520 is credited instantly  

---

## 9. Premium Model

Premium = (Base × Risk Score) + (Expected Loss × Probability)

Explanation:

- Base: Minimum operational cost  
- Risk Score: Derived from location, time, environmental exposure  
- Expected Loss: Average income loss for similar users  
- Probability: Likelihood of disruption occurring  

This ensures:
- Fair pricing for users  
- Sustainability of the system  
- Dynamic adaptation to risk conditions  

---

## 10. Trigger System

| Trigger | Threshold | Source |
|--------|----------|--------|
| AQI | > 400 | CPCB API |
| Rain | Heavy | Weather API |
| Heat | > 45°C | Weather API |
| Safety | Manual | User input |
| Platform | Downtime | System logs |

Triggers are objective, measurable, and externally validated, ensuring transparency.

---

## 11. AI & ML Integration

### Risk Prediction (XGBoost)
Predicts the likelihood of disruption based on environmental and behavioral patterns.

### Income Loss Estimation (Regression)
Estimates expected earnings using:
- Time of day  
- Location demand  
- Historical user performance  

### Fraud Detection (Isolation Forest)
Detects anomalies such as:
- Inactive users claiming loss  
- Impossible movement patterns  
- Repeated identical claims  

---

## 12. Adversarial Defense & Anti-Spoofing Strategy
System Philosophy: From Detection to Deterrence

Most fraud systems ask: "Is this claim fake?"

We ask: "Why would anyone even try?"

Our architecture combines pre-qualification barriers, economic disincentives, and parametric automation to make fraud not just detectable, but pointless.

## Fraud Detection Flow

![image alt](https://github.com/manishak4325-cmd/DevTrails_01/blob/c0af14d9645f9e7e90423ef5dc36407ad56aa714/frauddetectionflow.png)

## THE OFFENSIVE LAYER
1. Proof-of-Work Requirement
Concept: Before payout, system verifies worker was actively working when disruption hit.

Requirement	Data Source	Why It Kills Fraud
 Order Logs	Delivery platform API	Fraudster at home = no orders
 GPS Trail	Last 30 min movement	Must show movement toward zone
 App Activity	Usage metrics	Active worker vs idle phone

Logic:

IF orders_last_60min = 0 AND app_foreground = false
    → CLAIM INVALID (No Proof-of-Work)
Fraudster's Dilemma: "I can spoof GPS, but I cannot fake delivery work I never did."

2. Zone-Level Parametric Payouts
Concept: For major disruptions, we eliminate claims entirely.

Scenario	Action	Fraud Impact
Red Alert triggered	Scan all active workers in zone	No claims filed
Workers in zone	Auto-payout 100%	Nothing to fake
Workers near zone (<2km)	Partial payout (70%)	Fairness ensured
Workers outside	No payout	Clean cutoff
Why This Works: No claims → nothing to spoof → fraud rings lose entry point

3. Economic Disincentive Layer
Fraud doesn't just fail — it becomes unprofitable.

Zone Fraud Level	Payout Impact	Community Response
<5%	100%	Normal
5-15%	80% + verification	Self-policing
15-30%	50% + manual review	Fraud becomes costly
>30%	Zone freeze (24h)	Unprofitable to attack
👉 Genuine workers compensated via adjusted future premiums

## THE DETECTION ENGINE
Tier 1: Rule-Based Filters (Instant Kill)
Rule	Threshold	Action
 Velocity	>80 km/h	Auto-Reject
 WiFi Clustering	>5 claims/same BSSID	Hold + Ring Flag
 Activity Proof	No work last 60 min	Invalid
 Device Integrity	Rooted / Mock location	High Risk + Challenge
Tier 2: AI/ML Models
Model	Purpose	Output
Isolation Forest	Anomaly detection	0-100 anomaly score
DBSCAN	Fraud ring detection	Cluster density score
XGBoost	Trust scoring	0-100 trust score

Decision Engine
Fraud Confidence = (0.4 × Anomaly) + (0.4 × RingScore) + (0.2 × (100 - Trust))

Score	Action	User Message
0-30	Instant Pay	"Payment processed instantly"
31-60	Soft Delay	"Verification in progress (≤4 hrs)"
61-85	Challenge	Selfie / liveness check
86-100	Reject	Soft rejection + support

## PARAMETRIC IDENTITY (Core Logic)
Trigger Condition = TRUE (rainfall > threshold)
AND
Worker Eligibility = TRUE (Proof-of-Work / Zone presence)
    → PAYOUT TRIGGERED

No trigger = No payout | No work = No payout

## WHY THIS SYSTEM IS UNBREAKABLE
To exploit, attacker must spoof ALL simultaneously:

. GPS location

. Sensor telemetry (movement, light)

. Network identity (WiFi, IP, cell towers)

. Behavioral history (delivery patterns)

Spoofing one signal = Easy
Spoofing ALL signals consistently = Impossible at scale

Plus:

DBSCAN detects coordinated rings

Feedback loops adapt within 24h

 Fraud becomes economically irrational, not just technically difficult

## Business Impact

| Metric           | Impact                                        |
| ---------------- | --------------------------------------------- |
| Fraud Reduction  | Near-complete elimination of low-effort fraud |
| Ring Attacks     | Structurally prevented via zone payouts       |
| Manual Reviews   | ~80% reduction                                |
| User Experience  | Instant payouts for trusted workers           |
| System Stability | Liquidity protected under attack              |

## Edge Cases Covered

| Scenario         | Problem                   | HyperNova Solution                       |
| ---------------- | ------------------------- | ---------------------------------------- |
| Trapped in flood | Can't move, GPS static    | Emergency override + zone payout         |
| Phone dead       | No app activity           | Last known location + prior work history |
| Evacuated        | Left zone during disaster | Partial payout for time worked           |
| Curfew stuck     | Can't go home, can't work | Night premium + safety bonus             |
| Smog at home     | Didn't go to work         | No payout (no work = no coverage)        |


---

## 13. System Architecture

The architecture follows a modular pipeline:

Frontend (PWA) handles user interaction  
Backend (FastAPI) processes requests  
AI Engine performs prediction and estimation  
Trigger Engine evaluates disruption conditions  
Fraud Engine validates authenticity  
Payout Engine executes transactions  
Database stores user and transaction data  

External APIs provide real-time environmental inputs.

### Architecture Diagram

![image alt](https://github.com/manishak4325-cmd/DevTrails_01/blob/c0af14d9645f9e7e90423ef5dc36407ad56aa714/systemarchitecture.png)

---

## 14. Application Workflow

Onboarding → Risk Profiling → Subscription  
→ Monitoring → Trigger Detection  
→ Loss Calculation → Fraud Validation  
→ Instant Payout  

### Application Workflow Diagram

![image alt](https://github.com/manishak4325-cmd/DevTrails_01/blob/c0af14d9645f9e7e90423ef5dc36407ad56aa714/applicationworkflow.png)
---

## 15. Platform Choice (PWA)

The system uses a Progressive Web App to ensure accessibility:

- Works on low-end Android devices  
- No installation required  
- Minimal storage usage  
- Faster load times  

---

## 16. Tech Stack

| Layer | Technology |
|------|-----------|
| Backend | FastAPI |
| AI | XGBoost, Scikit-learn |
| Fraud | Isolation Forest |
| Database | MongoDB |
| Frontend | HTML, JavaScript (PWA) |
| Payments | Razorpay |

---

## 17. Future Scope

- Native Android application  
- Predictive alerts before disruptions  
- Integration with delivery platforms  
- Expansion across cities  
- AI-driven safety routing for women  

---

## 18. Development Roadmap

| Phase | Status |
|------|--------|
| Phase 1 | Concept and architecture complete |
| Phase 2 | Backend and API development |
| Phase 3 | AI model optimization and scaling |

---

## 19. Closing Note

Gig workers do not need charity.  
They need predictable income protection.

HyperNova ensures that when disruption happens, income does not disappear.
