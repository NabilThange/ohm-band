# 🚀 QUICK START - Circuit Diagram Feature

## ⚡ 3-STEP DEPLOYMENT (20 minutes)

### STEP 1: Database Setup (5 min)

```bash
# Run migration on Supabase
psql -h your-db-host -U postgres -d postgres -f migrations/add_diagram_queue.sql

# Create Storage bucket via Supabase Dashboard:
# 1. Go to Storage → Create bucket
# 2. Name: circuit-diagrams
# 3. Public: ON
```

### STEP 2: Environment Variables (3 min)

Add to Vercel Dashboard:
```
CRON_SECRET=generate_random_32_char_string
```

(LLM_PROVIDER, provider API keys, and SUPABASE keys already exist)

### STEP 3: WiringDrawer Integration (2 min)

**File:** `components/tools/WiringDrawer.tsx`

**Add this import:**
```typescript
import { DiagramDisplay } from '@/components/diagrams/DiagramDisplay';
```

**Add this code after wiring instructions:**
```typescript
<div className="mt-6">
  <h3 className="text-lg font-semibold mb-3">Breadboard Diagram</h3>
  <DiagramDisplay
    artifactId={artifact?.id}
    initialUrl={artifact?.content?.fritzing_url}
    initialStatus={artifact?.content?.diagram_status}
  />
</div>
```

---

## ✅ VERIFICATION

Test locally:
```bash
npm run dev
# Ask: "Create wiring for Arduino with LED on pin 13"
# Wait 1-2 minutes → Diagram appears!
```

Deploy:
```bash
git add .
git commit -m "feat: Circuit diagram generation"
git push
```

---

## 📞 NEED HELP?

See `IMPLEMENTATION_COMPLETE.md` for:
- Full troubleshooting guide
- Detailed testing procedures
- Architecture documentation
