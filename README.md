# HyperNova — AI-Powered Income Protection for Q-Commerce Workers

Guidewire DevTrails 2026 — Phase 1 Submission  
Platform: Progressive Web App  
Backend: Python | FastAPI  
AI/ML: XGBoost | Scikit-learn | Isolation Forest  
Status: Phase 1 Complete  

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
12. [Adversarial Defense & Fraud-Resistant Architecture](#12-adversarial-defense--fraud-resistant-architecture)  
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
| Safety Risk | Night shifts | Unsafe |
| Platform Issues | Downtime | Zero income |

Key Insight:
The problem is not reduced productivity — it is complete income loss during disruption periods.

---

## 5. Solution (Overview)

HyperNova introduces a parametric insurance model where payouts are triggered based on predefined real-world conditions rather than manual claims.

The system performs three core functions:

1. Detect disruptions using real-time external data (AQI, weather, platform signals)
2. Estimate income loss using AI models based on user behavior and historical earnings
3. Automatically trigger payouts when conditions are met

This removes friction, delays, and subjectivity from traditional insurance workflows.

---

## 6. Key Features

### Rollback Protection
When a worker logs off mid-day due to disruption, the system estimates the remaining expected earnings and compensates accordingly.

### Premium Gifting
Workers can sponsor coverage for others, enabling a community-driven safety net.

### Reward System
Consistent activity and safe behavior reduce risk scores, leading to lower premiums.

### SOS + Safety Mode
Allows users to manually trigger protection in unsafe situations. Especially important for women working late hours.

### Instant Payout Engine
Fully automated payout system integrated with UPI. No paperwork or manual approval required.

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

## 12. Adversarial Defense & Fraud-Resistant Architecture

The system uses multi-layer validation to prevent misuse.

| Signal | Genuine | Fraud |
|-------|--------|------|
| GPS | Continuous movement | Static spoof |
| Activity | Orders completed | No activity |
| Velocity | Realistic | Impossible jumps |

Defense layers include:
- Multi-sensor validation  
- Behavioral analysis  
- Cross-user anomaly detection  
- Manual review for edge cases  

Important:
The system prioritizes minimizing false negatives (not rejecting genuine users).

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

---

## 14. Application Workflow

Onboarding → Risk Profiling → Subscription  
→ Monitoring → Trigger Detection  
→ Loss Calculation → Fraud Validation  
→ Instant Payout  

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
