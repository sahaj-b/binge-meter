<div align="center">
  <img src="icon.svg" width="100" height="100" alt="Binge Meter Logo">
  <h1>Binge Meter</h1>
</div>

<h3 align="center">
  This extension shoves your wasted time in your face
</h3>

Tired of falling down rabbit holes on YouTube, Reddit, or X and wondering where the hell your day went? <br /> **Binge Meter** is a browser extension that tracks your time on distracting sites and uses (optional) AI to classify what's a waste of time, so you can actually get your work done

---

## Features

- 🧠 **Self-Improving AI**: Uses Google's Gemini to figure out if current page is *productive* or *distracting*. It learns from your manual classifications and your Custom Instructions

- ⏱️ **On-Screen Timer**: A customizable overlay that shows your binge time in real-time on distracting sites

- 🚫 **Site Blocking**: Locks you out of distracting sites when the daily time limit is reached. Can also grant a grace period

- 📊 **Analytics Dashboard**: Get a reality check with charts showing total binge times and a breakdown of your top time-wasting sites

- 📝 **Granular Control**: Manually mark specific URLs, YouTube channels, or subreddits as productive, and create exceptions for the blocking

- 🔎 **Smart URL Matching**: Ignores query params and it can use wildcards (`*`)

- 🔐 **Per-Site Permissions**: Only asks permissions for the sites you explicitly tell it to track

---

> [!NOTE]
> ### A Quick Heads-Up on the opt-in AI Feature
>
> - **BYOK (Bring Your Own Key):** You'll need to provide your own Google AI API key to enable it. The extension uses the **Gemini 2.0 Flash model**
> - **Rate Limits:** See [Free tier Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
> - Each **new** page you visit on a tracked site counts as one request (if it doesn't match any existing rules)
> - In future, I will add support for other gemini/gemma models (configurable), and fallback models so you don't have to care about rate limits


## Get Started 🚀

1. **Install the Extension**: 
   - Chromium-based browsers: [Chrome Web Store](https://chromewebstore.google.com/detail/binge-meter/jlbijnlhiaaophloidngjkdfmdopnagh)
   - Firefox/Firefox-based: Awaiting review on Firefox Add-ons... will be available soon

2. **Track Your First Site**
   - Go to a site you want to monitor (e.g., `youtube.com`)
   - Click the **Binge Meter icon** in your browser's toolbar (Pin it for quick access)
   - Click **"Grant Permission"**, then **"Track"**. The extension will now monitor this domain

3. **Just Browse**
   - Drag and resize the Overlay, it will remember your preferences per site
   - You can click the extension icon for granular control over classification and exceptions

4. **Tweak the Settings (Recommended)**
   - Click the **Settings** button in the popup
   - **Enable AI Classification**  Set your Gemini API key and optionally, custom instructions
   - **Set Your Limit:** In Blocking section, enable Blocking and set your daily time limit
   - **Customize Overlay**: Set threshold time and colors, make it your own

5. **Check Your Stats**
   - After a few days, open the **Analytics** page from the popup to see a breakdown of where your time *really* goes

---

## Tech Stack 🛠️

- **Core**: TypeScript (Background and Content Scripts)
- **UI** (Popup, Settings, Analytics):
  - React
  - Tailwind CSS
  - Zustand
  - Shadcn UI
  - Recharta
- **Build**: Vite + CRXJS

---

## Building From Source 👨‍💻

**Prerequisites:**

- Node.js (v18 or higher)
- pnpm

```bash
# Clone the repo
git clone https://github.com/sahaj-b/binge-meter.git
cd binge-meter

# Install dependencies
pnpm install

# Run the dev server
pnpm dev
# This will create unpacked extension in dist/ dir and watch for changes

# Create a production build for chromium-based browsers
pnpm build
# OR for firefox-based browsers
pnpm build:firefox
# This will generate a production-ready, zipped package in the release/ directory, and an unpacked version in dist/
```

> [!NOTE]
>
> - Dev mode is only supported in Chromium-based browsers
> - For enabling debug messages in production build, set `VITE_DEBUG_MODE` environment variable to `true` before building

## Planned stuff for Future 🚧

- Allow users to choose between different Gemini/Gemma models
- Use a fallback model when the primary one hits rate limits
- Display (in popup) whether the classifcation was done by AI or manually
- Add a "Delete Data" button in Analytics page
- Require unlimited storage permission (or delete old data) when analytics data grows too large
- Double-click overlay to mark as distracting
