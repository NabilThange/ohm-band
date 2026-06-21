# 🎬 Demo Mode Setup Guide

## What is Demo Mode?

Demo Mode allows you to create promotional videos without calling AI APIs. You get:
- ✅ Pre-scripted responses that stream naturally
- ✅ Real tool calls (drawer opens, files write)
- ✅ **ZERO API calls = No money wasted**

Perfect for recording demo videos, presentations, and promotional content.

---

## Quick Setup (3 Steps)

### 1. Enable Demo Mode

Add this to your `.env.local` file:

```bash
# Demo Mode (set to true for videos, false for real AI)
DEMO_MODE=true
```

If you don't have a `.env.local` file, create one in the project root.

### 2. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Test It!

Go to your OHM build page and type:

```
I want to build a DIY autonomous drone that can patrol my farm, stream video to my phone, and return to its charging station automatically.
```

You should see:
- Project title updates to "Farm Patrol Autonomous Drone Build"
- Fake AI response streams in (no API call!)
- Context drawer opens automatically
- Technical Architecture and MVP get written

---

## How to Record Your Demo Video

1. **Start recording** (OBS, ScreenFlow, etc.)
2. **Type the drone prompt** (see above)
3. **Watch the magic happen** (streaming, tool calls, drawer opens)
4. **Stop recording**

No API credits burned! 🔥

---

## How to Disable Demo Mode

When you're done recording and want real AI back:

```bash
# In .env.local
DEMO_MODE=false

# Or just delete the line entirely
```

Restart your dev server.

---

## Adding More Demo Responses

Edit `lib/agents/demo-responses.ts` to add more scripted responses:

```typescript
// Match different prompts
if (normalizedMessage.includes('web app')) {
    return WEB_APP_RESPONSE;
}

if (normalizedMessage.includes('mobile game')) {
    return MOBILE_GAME_RESPONSE;
}
```

Each response includes:
- `textChunks`: Array of strings that stream in sequence
- `toolCalls`: Array of tool calls to execute
- `title`: Optional project title update
- `agentType`, `agentName`, `agentIcon`: Agent metadata

---

## Troubleshooting

**Problem:** Still calling AI API even with DEMO_MODE=true

**Solution:**
- Check `.env.local` has `DEMO_MODE=true` (not .env.example)
- Restart dev server after changing .env.local
- Check console logs for `[DEMO MODE]` messages

**Problem:** No scripted response found

**Solution:**
- Check the prompt matches the pattern in `getDemoResponse()` function
- Look for console message: `[DEMO MODE] ⚠️ No scripted response found`
- Verify prompt contains keywords like "autonomous drone" and "farm"

---

## Current Demo Scenarios

### ✅ Scenario 1: Farm Patrol Drone (READY)

**Trigger Prompt:**
```
I want to build a DIY autonomous drone that can patrol my farm, stream video to my phone, and return to its charging station automatically.
```

**What Happens:**
- Project title → "Farm Patrol Autonomous Drone Build"
- Agent → The Project Initializer 🚀
- Drawer → Context opens
- Files → Technical Architecture + MVP written

**Coming Soon:**
- Scenario 2: Second message response ("Yes, create the PRD...")
- Scenario 3: More project types

---

## Tips for Better Demo Videos

1. **Clear your chat** before recording for a clean slate
2. **Type slowly** like a real user would
3. **Pause briefly** after responses to show the drawer updates
4. **Use fullscreen mode** for cleaner recordings
5. **Disable notifications** on your system

---

## Need Help?

- Check `lib/agents/demo-responses.ts` to see/edit scripted responses
- Check `app/api/agents/chat/route.ts` to see the interception logic
- Console logs show `[DEMO MODE]` messages when active
