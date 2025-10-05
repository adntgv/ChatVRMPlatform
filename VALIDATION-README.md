# ChatVRM Platform - Validation Experiment

This implementation transforms the ChatVRM Platform into a lean validation experiment designed to test three critical gates: **Interest → Use → Money**.

## 🎯 Validation Gates

### Gate A: Interest (Top-of-Funnel)
**Target Metrics:**
- Landing page → Demo CTA: **15-25% click rate**
- Time on page: **≥30-45s median**

**Tracking:**
- Landing page views
- Demo CTA clicks
- Waitlist signups
- Session duration

### Gate B: Use (Product Signal)
**Target Metrics:**
- Demo click → Interaction start: **≥40%**
- Median session: **≥3-5 minutes**
- Message exchanges: **≥2 back-and-forth**
- Wizard attempts: **≥20% of demo users**

**Tracking:**
- Demo interaction starts
- Messages sent
- Session duration
- Wizard starts and drop-offs

### Gate C: Money (Real Validation)
**Target Metrics:**
- **3-5 paid pilots** from cold traffic, OR
- **10+ users** finish trial and agree to pay, OR
- **1+ signed LOI** from business user

**Tracking:**
- Payment intents
- Completed payments
- Pilot inquiries (LOIs)
- Trial-to-paid conversions

---

## 🚀 New Features

### 1. No-Friction Demo (`/demo`)
- **3 preconfigured assistants** ready to use
- **No signup required** - instant interaction
- **Rate-limited** (10 messages per hour per user)
- Auto-tracks usage and engagement
- CTAs appear after 3+ messages

**Assistants:**
1. **VTuber Co-host** - Streaming companion
2. **Course Tutor** - Educational assistant
3. **Website Greeter** - Lead capture assistant

### 2. Validation-Focused Landing Page (`/`)
- **Outcome-driven copy** (not feature lists)
- **Clear CTAs**: "Try Live Demo" + "Build My Own"
- **Waitlist capture** with email collection
- **Use case showcase** with real results
- **Final CTA**: "We'll Build It For You" option

### 3. Money Gate Pages

#### Reservation Page (`/reserve`)
- **$49 one-time setup fee**
- 1-hour personalized setup call
- Custom assistant configured to needs
- Form captures: use case, team size, timeline
- Tracks payment intents and completions

#### Pilot Inquiry (`/pilot-inquiry`)
- **Enterprise solutions** ($500-$5,000 range)
- Captures: company, role, requirements
- Qualified lead generation for large deals
- LOI (Letter of Intent) collection

### 4. Analytics Dashboard (`/admin`)
- **Password protected** (default: `chatvrm2025`)
- Real-time gate metrics
- Conversion funnel visualization
- Export data to JSON
- Clear all data (for testing)

**Access:** Visit `/admin` with password

### 5. Instrumented Wizard (`/create`)
- **Drop-off tracking** per step
- Captures: Name → API → Model → Voice → Personality
- Records completion and abandonment rates
- Identifies friction points

---

## 📊 Tracking & Analytics

All events are stored in **localStorage** and can be:
- Viewed in `/admin` dashboard
- Exported as JSON
- Analyzed for validation metrics

### Key Events Tracked:
```typescript
// Gate A
'landing_page_view'
'demo_cta_click'
'waitlist_submit'

// Gate B
'demo_interaction_start'
'demo_message_sent'
'demo_session_end'
'wizard_start'
'wizard_step_complete'
'wizard_step_abandon'

// Gate C
'payment_intent_start'
'payment_complete'
'pilot_inquiry_submit'
'trial_to_paid_conversion'
```

---

## 🔧 Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required for demo functionality
NEXT_PUBLIC_DEMO_OPENAI_KEY=sk-your-demo-key
NEXT_PUBLIC_DEMO_KOEIROMAP_KEY=your-demo-key
```

**⚠️ Important:** Use separate API keys for demo mode with **strict usage limits** to prevent abuse.

### 2. Rate Limiting

Demo mode limits:
- **10 messages per hour** per user (browser)
- Stored in localStorage
- Configurable in `/src/lib/rateLimit.ts`

Trial mode limits:
- **50 messages per week** per user
- 7-day reset window

### 3. Admin Dashboard

**Password:** `chatvrm2025` (change in `/src/pages/admin.tsx`)

**Features:**
- View all gate metrics
- Export analytics data
- Clear test data
- Conversion funnel visualization

---

## 🎨 Template Updates

Templates now focus on **outcomes**, not features:

1. **VTuber Co-host**
   - "Keeps chat alive 24/7, answers FAQ, runs Just Chatting streams"

2. **Course Tutor**
   - "Explains lessons, quizzes students, provides office-hours support"

3. **Website Greeter**
   - "Captures leads, books calls, answers pricing questions"

---

## 🧪 Validation Experiment Workflow

### For New Visitors:
1. **Land on `/`** → See outcome-focused copy
2. **Click "Try Live Demo"** → `/demo` with instant access
3. **Interact** → Track usage (messages, time, engagement)
4. **See CTAs** → After 3+ messages: "Build My Own" or "We'll Build It"
5. **Convert** → Either:
   - Start wizard (`/create`)
   - Reserve for $49 (`/reserve`)
   - Request pilot (`/pilot-inquiry`)

### For Existing Users:
- Still have full access to all features
- Multi-instance system intact
- Classic mode available

---

## 📈 Success Criteria

**Validation PASSES if:**
- **Gate A:** Demo CTR ≥ 15% + time on page ≥ 30s
- **Gate B:** Interaction rate ≥ 40% + median session ≥ 3min + wizard attempts ≥ 20%
- **Gate C:** 3+ paid reservations OR 1+ LOI OR 10+ trial-to-paid

**If Gates PASS:** You have a validated product worth scaling.

**If Gates FAIL:** Identify which gate failed:
- **Gate A failure** → Landing page / messaging problem
- **Gate B failure** → Product / UX problem
- **Gate C failure** → Pricing / value proposition problem

---

## 🚦 Next Steps After Validation

### If Validated:
1. Integrate real payment processor (Stripe)
2. Set up email automation (waitlist, onboarding)
3. Add CRM integration (pilot inquiries)
4. Scale traffic (Reddit, Twitter, Product Hunt)

### If Not Validated:
1. Check `/admin` to see where drop-off occurs
2. Interview users who reached but didn't convert
3. A/B test messaging, pricing, or features
4. Iterate and re-test

---

## 🔍 Monitoring Tips

1. **Daily Check:** Visit `/admin` to track gate metrics
2. **Export Data:** Download JSON for deeper analysis
3. **User Feedback:** Add Hotjar or similar for qualitative data
4. **Traffic Sources:** Track where users come from (Reddit, Twitter, etc.)

---

## 🛠 Technical Implementation

### Key Files:
- `/src/lib/analytics.ts` - Analytics service
- `/src/lib/rateLimit.ts` - Rate limiting
- `/src/pages/demo.tsx` - No-friction demo
- `/src/pages/index.tsx` - Landing page
- `/src/pages/reserve.tsx` - Payment page
- `/src/pages/pilot-inquiry.tsx` - Pilot form
- `/src/pages/admin.tsx` - Metrics dashboard
- `/src/pages/create.tsx` - Instrumented wizard

### Data Storage:
- **Analytics**: `localStorage` → `chatvrm_analytics`
- **Rate Limits**: `localStorage` → `chatvrm_demo_usage`, `chatvrm_trial_usage`
- **Session**: `sessionStorage` → `chatvrm_session_id`

---

## 📝 Notes

- All tracking is **client-side** (no server required)
- Data persists in browser localStorage
- Privacy-friendly (no external tracking services)
- Easy to export and analyze
- Works offline for development

---

## 🎯 Validation Timeline

**Week 1:** Set up demo API keys, test all flows
**Week 2:** Drive traffic (Reddit, Twitter, forums)
**Week 3-4:** Monitor metrics, iterate messaging
**By Week 4:** Should have clear gate pass/fail signals

---

## 💡 Pro Tips

1. **Start with Gate A:** If landing → demo CTR is < 15%, fix messaging before scaling traffic
2. **Track Sources:** Add UTM parameters to see which channels convert best
3. **Interview Early Users:** Talk to first 10 demo users (even if they don't pay)
4. **Price Test:** Try $49, $99, $149 to find optimal price point
5. **LOI Templates:** Create simple 1-page LOI for enterprise pilots

---

For questions or issues, see `/CLAUDE.md` for project context.
