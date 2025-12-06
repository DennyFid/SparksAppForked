# Connecting Development Build to Metro Server

## The Problem

When you run `npx expo run:ios --device`, it:
1. ✅ Builds the native app
2. ✅ Installs it on your device
3. ❌ **Does NOT automatically start the Metro bundler**
4. ❌ **Does NOT connect the app to the dev server**

You need to start the Metro bundler separately and connect the app to it.

## The Solution: Two-Step Process

### Step 1: Build the App (One-Time, or When Native Code Changes)

```bash
# Build and install on device
npx expo run:ios --device
```

**When to rebuild:**
- First time setup
- When you add/remove native modules
- When you change `app.json` native config
- When you modify native code (iOS/Android folders)

**When NOT to rebuild:**
- When you only change JavaScript/TypeScript code
- When you only change React components
- For regular development work

### Step 2: Start the Development Server (Every Time You Develop)

**In a separate terminal window**, run:

```bash
# Start Metro bundler with dev client support
npx expo start --dev-client
```

**What this does:**
- Starts Metro bundler on port 8081
- Shows QR code and connection options
- Enables hot reload
- Shows console logs in terminal

## Connecting the App

### Option 1: Automatic Connection (Recommended)

If your device and computer are on the **same WiFi network**, the app should automatically connect when you:
1. Open the app on your device
2. The app detects the Metro server
3. Logs appear in your terminal

### Option 2: Manual Connection via QR Code

1. **Start the dev server:**
   ```bash
   npx expo start --dev-client
   ```

2. **On your iPhone:**
   - Open the Sparks app
   - Shake the device (or press `Cmd+D` in simulator)
   - Select "Enter URL manually" or scan QR code
   - Enter the URL shown in terminal (e.g., `exp://192.168.1.100:8081`)

### Option 3: Manual Connection via URL

1. **Find your computer's IP address:**
   ```bash
   # On Mac
   ipconfig getifaddr en0
   # or
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **In the app:**
   - Shake device → "Enter URL manually"
   - Enter: `exp://YOUR_IP_ADDRESS:8081`
   - Example: `exp://192.168.1.100:8081`

## Verifying Connection

**Signs the app is connected:**
- ✅ You see logs in the terminal running `npx expo start --dev-client`
- ✅ Hot reload works (changes appear instantly)
- ✅ You see "Connected to Metro" or similar message
- ✅ Console.log statements appear in terminal

**Signs the app is NOT connected:**
- ❌ No logs in terminal
- ❌ Changes don't appear (need to rebuild)
- ❌ App shows "No development server found"
- ❌ App is using bundled JavaScript (not live)

## Complete Workflow Example

```bash
# Terminal 1: Build the app (one-time)
npx expo run:ios --device

# Wait for build to complete and app to install...

# Terminal 2: Start dev server (every time you develop)
npx expo start --dev-client

# Now:
# - Open the app on your device
# - It should auto-connect
# - You'll see logs in Terminal 2
# - Make code changes → see them instantly
```

## Troubleshooting

### App Won't Connect

1. **Check WiFi:**
   - Device and computer must be on same network
   - Try turning WiFi off/on on device

2. **Check Firewall:**
   - Mac: System Settings → Firewall → Allow Metro/Node

3. **Check Port:**
   - Metro runs on port 8081
   - Make sure nothing else is using it: `lsof -i :8081`

4. **Manual URL:**
   - Use `exp://` protocol, not `http://`
   - Include port `:8081`

### No Logs Appearing

1. **Verify connection:**
   - Shake device → Check if "Development server" is listed
   - If not, manually enter URL

2. **Check Metro bundler:**
   - Terminal should show "Metro waiting on..."
   - Should show QR code

3. **Restart both:**
   - Close app on device
   - Stop Metro (`Ctrl+C`)
   - Restart Metro: `npx expo start --dev-client`
   - Reopen app

### App Shows "No Development Server"

This means the app can't find Metro. Solutions:

1. **Start Metro first:**
   ```bash
   npx expo start --dev-client
   ```

2. **Then open the app** (or reload it)

3. **If still not found:**
   - Shake device → "Enter URL manually"
   - Use your computer's IP: `exp://192.168.1.XXX:8081`

## Quick Reference

```bash
# Build app (one-time)
npx expo run:ios --device

# Start dev server (every time)
npx expo start --dev-client

# With cache clear (if issues)
npx expo start --dev-client --clear

# Check what's running on port 8081
lsof -i :8081

# Kill Metro if stuck
killall node
```

## Key Points

1. **`npx expo run:ios --device`** = Build native app (infrequent)
2. **`npx expo start --dev-client`** = Start dev server (frequent)
3. **App must connect to Metro** to see logs and hot reload
4. **Same WiFi network** required for auto-connection
5. **Manual URL** works if auto-connection fails

