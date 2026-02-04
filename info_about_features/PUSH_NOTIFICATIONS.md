# Push Notifications Feature

## Overview

Your chat application now supports **browser push notifications**. Users receive notifications when they get new messages, even when they're not actively looking at the chat window.

## Features

### 🔔 Browser Push Notifications
- Notifications appear when new messages arrive
- Shows sender name and message preview
- Click notification to focus the chat window
- Auto-closes after 5 seconds

### ⚙️ Notification Settings
- Enable/disable notifications
- Toggle message preview (privacy mode)
- Toggle notification sound
- Do Not Disturb mode
- Test notification button

### 🔒 Privacy & Control
- Notifications only show when page is not focused
- User controls all notification settings
- Message preview can be hidden for privacy
- Respects browser permission settings

---

## How It Works

### Automatic Permission Request
When you open the chat app, it automatically requests notification permission:
```
Browser prompt: "Allow ChatApp to send notifications?"
→ Allow: Notifications will work
→ Block: No notifications (can change in browser settings)
```

### When Notifications Appear
Notifications are shown when:
1. ✅ Browser permission is "granted"
2. ✅ User has notifications enabled in settings
3. ✅ Do Not Disturb is OFF
4. ✅ Page is NOT focused/visible
5. ✅ Message is from another user (not yourself)

### Notification Content
```
┌─────────────────────────────────────┐
│ 🔔 New message from Alice           │
│ Hey, how are you doing today?       │
└─────────────────────────────────────┘
```

If "Message Preview" is disabled:
```
┌─────────────────────────────────────┐
│ 🔔 New message from Alice           │
│ New message                         │
└─────────────────────────────────────┘
```

---

## Settings Panel

### Location
Settings → Notifications

### Options Available

| Setting | Description | Default |
|---------|-------------|---------|
| Browser Notifications | System permission status | Request on first visit |
| Enable Notifications | Master toggle for all notifications | ON |
| Message Preview | Show message content in notification | ON |
| Sound | Play sound when notification arrives | ON |
| Do Not Disturb | Temporarily disable all notifications | OFF |

### Browser Permission States
- ✅ **Allowed** - Notifications will work
- ⏳ **Not Requested** - Click button to enable
- 🚫 **Blocked** - Must enable in browser settings

---

## Technical Implementation

### Files Created/Modified

**New File:**
```
src/services/notificationService.js
- Singleton notification service
- Permission management
- Notification display logic
- Settings integration
```

**Modified Files:**
```
src/pages/Chat.jsx
- Import notificationService
- Request permission on socket init
- Show notification on new message

src/components/settings/NotificationsSettings.jsx
- Browser permission status display
- Permission request button
- Test notification button

src/components/settings/NotificationsSettings.css
- Permission section styling
- Button styles
```

### Notification Service API

```javascript
import notificationService from './services/notificationService';

// Request permission
await notificationService.requestPermission();

// Check if allowed
notificationService.isAllowed(); // boolean

// Get permission status
notificationService.getPermission(); // 'granted'|'denied'|'default'

// Show notification
notificationService.showNotification({
  title: "New message",
  body: "Hello world!",
  icon: "/avatar.png",
  tag: "unique-id",
  onClick: () => console.log("Clicked!")
});

// Show message notification
notificationService.showMessageNotification(
  message,    // message object
  sender,     // { username, avatar }
  onClick     // callback function
);
```

### LocalStorage Keys

| Key | Purpose | Values |
|-----|---------|--------|
| `notify-enabled` | Master toggle | true/false |
| `notify-sound` | Sound toggle | true/false |
| `notify-preview` | Preview toggle | true/false |
| `notify-dnd` | Do Not Disturb | true/false |

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Firefox | ✅ Full support |
| Edge | ✅ Full support |
| Safari | ⚠️ Limited (macOS only) |
| Mobile Chrome | ✅ Works (requires HTTPS) |
| Mobile Safari | ❌ Not supported |

### Requirements
- HTTPS connection (for production)
- User must grant permission
- Browser must support Notification API

---

## Security Considerations

- ✅ Only shows notifications from other users
- ✅ User controls all settings
- ✅ Preview can be disabled for privacy
- ✅ Permission can be revoked anytime
- ✅ No sensitive data stored externally

---

## Troubleshooting

### Notifications not appearing?

1. **Check browser permission**
   - Go to Settings → Notifications
   - Look at "Browser Notifications" status
   - If "Blocked", must enable in browser settings

2. **Check app settings**
   - Ensure "Enable Notifications" is ON
   - Ensure "Do Not Disturb" is OFF

3. **Check if page is focused**
   - Notifications only show when page is NOT focused
   - Minimize or switch tabs to test

4. **Check browser settings**
   - Chrome: Settings → Privacy → Site Settings → Notifications
   - Firefox: Settings → Privacy → Permissions → Notifications

### How to reset permissions?

**Chrome:**
1. Click lock icon in address bar
2. Find "Notifications"
3. Change to "Allow" or "Ask"

**Firefox:**
1. Click shield icon in address bar
2. Go to Permissions
3. Change Notifications setting

---

## User Experience Flow

### First Visit
```
1. User opens chat app
2. Browser asks for notification permission
3. User clicks "Allow"
4. Notifications are now enabled!
```

### Receiving a Notification
```
1. User is on different tab/window
2. Someone sends them a message
3. Notification appears:
   "New message from Alice: Hey there!"
4. User clicks notification
5. Window focuses on chat app
6. User can reply immediately
```

### Adjusting Settings
```
1. User opens Settings
2. Clicks on "Notifications"
3. Can toggle:
   - Enable/disable notifications
   - Show/hide message preview
   - Enable/disable sound
   - Turn on Do Not Disturb
4. Changes apply immediately
```

---

## Summary

✅ **Browser push notifications** for new messages
✅ **Customizable settings** (sound, preview, DND)
✅ **Privacy-conscious** (preview can be hidden)
✅ **Permission management** built-in
✅ **Test notification** feature
✅ **Respects user preferences** at all levels
