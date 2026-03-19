# 🛡️ HyperNova — AI-Powered Income Protection for Gig Workers

> AI-driven parametric insurance that ensures gig workers never lose income due to real-world disruptions.

---

## 🚨 Problem

- No income protection for gig workers  
- Weather & pollution force sudden logoff  
- Safety risks (especially for women at night)  
- Platform dependency → zero fallback  
- ₹3,000–₹6,000 monthly income loss  

---

## 👤 Persona

| Attribute | Detail |
|----------|--------|
| Name | Arjun Verma |
| Age | 23 |
| Role | Delivery Partner (Blinkit/Zepto) |
| Work Hours | 9–11 hrs/day |
| Weekly Earnings | ₹3,500–₹5,000 |
| Risk | Weather + Safety |

---

## ⚠️ Core Problem

| Disruption | Example | Impact |
|-----------|--------|--------|
| Air Pollution | AQI > 400 | Unsafe to work |
| Rain/Flood | Roads blocked | No deliveries |
| Heat | > 45°C | Health risk |
| Safety Risk | Night shifts | Unsafe |
| Platform Issues | App downtime | Zero income |

---

## 💡 Solution

HyperNova uses **AI + real-time data** to detect disruptions, estimate income loss, and trigger **instant payouts — no claims required**.

![image alt](https://github.com/manishak4325-cmd/DevTrails_01/blob/1ca03bd53742b27ea155f6909128f88befe3ba8e/solutionoverview.png)

---

### 🔽 Solution Flow

![image alt](https://github.com/manishak4325-cmd/DevTrails_01/blob/8c2c0ef2ec24fd8cdcb850c548e28f2f737e6294/applicationworkflow.png)

---

## 🔥 Key Features

| Feature | Description |
|--------|------------|
| 🔄 Rollback | Restores income for partial-day disruptions |
| 🎁 Gifting | Workers can sponsor coverage for others |
| 🏆 Rewards | Safe behavior → lower premiums |
| 🚨 SOS Mode | Emergency trigger + instant protection |
| ⚡ Instant Payout | UPI payout within minutes |

---

## 🧠 How It Works

1. User onboarding  
2. AI risk profiling  
3. Premium assignment  
4. Continuous monitoring  
5. Trigger detection  
6. Loss estimation  
7. Instant payout


---

### 🔽 Workflow Diagram

![image alt](https://github.com/manishak4325-cmd/DevTrails_01/blob/11a318f399ed103625921ee36e4f83d7c1c75dd3/howitworks.png)

---

## ⚙️ Scenario

**Delhi | AQI 420**

- Worker logs off  
- System detects disruption  
- AI calculates ₹520 loss  
- 💰 Instant payout  

---


### Example Pricing

| Season | Weekly Premium |
|--------|---------------|
| Normal | ₹30 |
| Monsoon | ₹50 |
| Smog Peak | ₹70 |

---

## ⚡ Trigger System

| Trigger | Threshold |
|--------|----------|
| AQI | > 400 |
| Rain | Heavy |
| Heat | > 45°C |
| SOS | Manual |
| Platform | Downtime |

---

## 🤖 AI & ML Integration

- **XGBoost** → Risk prediction  
- **Regression Models** → Income loss estimation  
- **Isolation Forest** → Fraud detection  

---

## 🛡️ Fraud Protection

### Detection Signals

| Signal | Genuine | Fraud |
|-------|--------|-------|
| GPS | Movement | Spoof |
| Activity | Normal | None |
| Velocity | Realistic | Impossible |

---

### Defense Strategy

- Multi-signal validation  
- AI anomaly detection  
- Manual review for flagged cases  
- No auto-rejection of genuine users  

---

### 🔽 Fraud Detection Flow

## 🛡️ Fraud Detection Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRAUD DETECTION PIPELINE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│   │   INPUT      │────▶│   ANOMALY    │────▶│   ENSEMBLE   │     │
│   │   SIGNALS    │     │  DETECTION   │     │  VALIDATION  │     │
│   └──────────────┘     └──────────────┘     └──────────────┘     │
│           │                    │                     │           │
│           ▼                    ▼                     ▼           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                MULTI-LAYER FRAUD DETECTION                  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │  ┌─────────────────┐     ┌─────────────────┐               │ │
│ │  │     LAYER 1     │     │     LAYER 2     │               │ │
│ │  │  GPS Spoofing   │     │ Pattern-Based   │               │ │
│ │  │ • Movement      │     │ • Historical    │               │ │
│ │  │ • Velocity      │     │ • Behavioral    │               │ │
│ │  │   Analysis      │     │   Clustering    │               │ │
│ │  └─────────────────┘     └─────────────────┘               │ │
│ │                                                             │ │
│ │  ┌─────────────────┐     ┌─────────────────┐               │ │
│ │  │     LAYER 3     │     │     LAYER 4     │               │ │
│ │  │ Isolation       │     │ Cross-User      │               │ │
│ │  │ Forest          │     │ Collusion       │               │ │
│ │  │ • Unsupervised  │     │ Detection       │               │ │
│ │  │   Anomaly       │     │ • Network       │               │ │
│ │  │   Detection     │     │   Analysis      │               │ │
│ │  └─────────────────┘     └─────────────────┘               │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                             │                                   │
│                             ▼                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                     DECISION ENGINE                         │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │  ┌────────────┐   ┌────────────┐   ┌────────────┐          │ │
│ │  │ AUTO-      │   │ MANUAL     │   │ ESCALATION │          │ │
│ │  │ APPROVE    │   │ REVIEW     │   │ TO ADMIN   │          │ │
│ │  └────────────┘   └────────────┘   └────────────┘          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                             │                                   │
│                             ▼                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                 FRAUD SIGNAL MATRIX                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

![image alt](https://github.com/manishak4325-cmd/DevTrails_01/blob/ec232ba7d9d37eecf4a31f1621407e72df03aba8/frauddetectionflow.png)

---

## 🏗️ System Architecture

![image alt](https://github.com/manishak4325-cmd/DevTrails_01/blob/ec232ba7d9d37eecf4a31f1621407e72df03aba8/systemarchitecture.png)

---

## 🔄 Application Workflow

Onboarding → Risk Profiling → Monitoring → Trigger → Payout  

---

## 📱 Platform Choice — PWA

- Works on low-end devices  
- No install required  
- Low data usage  
- Fast access  

---

## 🧱 Tech Stack

| Layer | Tech |
|------|------|
| Frontend | PWA (HTML, JS) |
| Backend | FastAPI |
| AI | XGBoost, Scikit-learn |
| Fraud | Isolation Forest |
| DB | MongoDB |
| Payments | Razorpay |

---

## 📊 Impact

- Eliminates zero-income days  
- Improves financial stability  
- Enhances women safety  
- Fully automated insurance model  

---

## 🚀 Roadmap

- Phase 1: Concept ✅  
- Phase 2: Backend 🚧  
- Phase 3: ML Scaling ⏳  

---

## 🧾 Closing

> Gig workers don’t need charity.  
> They need predictable income protection.

---

## 📌 Project Info

- **Hackathon:** Guidewire DevTrails 2026  
- **Platform:** Progressive Web App  
- **Status:** Phase 1 Complete  

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
