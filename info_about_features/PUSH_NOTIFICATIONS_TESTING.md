# Push Notifications Testing Guide

## Quick Test (3 minutes)

### Step 1: Enable Notifications
1. Open the chat app
2. Go to **Settings → Notifications**
3. Click **"🔔 Enable Browser Notifications"** button
4. Click **"Allow"** in the browser popup
5. Status should show: ✅ **Allowed**

### Step 2: Test Notification (Optional)
1. In Settings → Notifications
2. Click **"🧪 Send Test Notification"**
3. You should see a browser notification appear

### Step 3: Test Real Message Notification

**Setup:** Open the app in 2 different browsers (or incognito)

```
Browser 1 (User A):
1. Login as User A
2. Open any chat

Browser 2 (User B):
1. Login as User B
2. Stay on the chat page (any chat or none)

Test:
1. Browser 1 (User A): Send a message to User B
2. Browser 2 (User B): Watch for notification

Expected Result:
✅ Browser 2 shows notification:
   "New message from [User A]"
   "[Message content...]"
```

---

## Verification Checklist

### Permission Setup
- [ ] Browser asks for notification permission
- [ ] Settings show correct permission status
- [ ] "Enable Notifications" button works
- [ ] "Test Notification" button works

### Message Notifications
- [ ] Notification appears when receiving message
- [ ] Shows sender name correctly
- [ ] Shows message preview correctly
- [ ] Clicking notification focuses the window
- [ ] Auto-closes after 5 seconds

### Settings Work
- [ ] "Enable Notifications" toggle works
- [ ] "Do Not Disturb" disables notifications
- [ ] "Message Preview" hides content when off
- [ ] "Sound" toggle controls sound (if implemented)

### Edge Cases
- [ ] No notification for own messages
- [ ] No notification when page is focused (unless forceShow)
- [ ] Works across different chats
- [ ] Works even if chat is not open

---

## Console Logs to Check

### Successful Notification
```
[socket] new_message_notification [msgId] from [username]
🔔 Notification shown: New message from [username]
```

### Permission Issues
```
🔔 Notifications not allowed, skipping
```

### Settings Issues
```
🔔 Notifications disabled in settings, skipping
```

### Page Active (Won't show unless forceShow)
```
🔔 Page is active, skipping notification
```

---

## Browser Permission States

| State | Meaning | How to Fix |
|-------|---------|------------|
| ✅ Allowed | Notifications work | - |
| ⏳ Not Requested | Need to enable | Click "Enable Notifications" |
| 🚫 Blocked | User blocked | Reset in browser settings |
| ❓ Unsupported | Browser issue | Use Chrome/Firefox |

---

## Troubleshooting

### Notification doesn't appear

1. **Check permission status**
   - Go to Settings → Notifications
   - Should show ✅ Allowed

2. **Check app settings**
   - "Enable Notifications" should be ON
   - "Do Not Disturb" should be OFF

3. **Check browser console**
   - Look for 🔔 logs
   - Check for errors

4. **Check browser settings**
   - Chrome: Settings → Privacy → Notifications
   - Make sure site is allowed

### Permission is blocked

**Chrome:**
1. Click lock 🔒 in address bar
2. Find "Notifications"
3. Change to "Allow"
4. Refresh page

**Firefox:**
1. Click shield icon
2. Go to Permissions
3. Change Notifications
4. Refresh page

### Test notification works but real messages don't

1. Check socket connection in console
2. Look for `[socket] new_message_notification` log
3. Verify user is in their personal room (joined on login)

---

## Expected Notification Appearance

### Desktop Chrome/Edge
```
┌──────────────────────────────────────┐
│ 🔔 ChatApp                     ✕    │
├──────────────────────────────────────┤
│ New message from Alice               │
│ Hey, how are you doing today?        │
└──────────────────────────────────────┘
```

### Desktop Firefox
Similar to Chrome, appears in corner of screen.

### Mobile (Chrome only)
Appears in notification tray, requires HTTPS.

---

## Socket Events Flow

```
User A sends message
        ↓
Server saves to database
        ↓
Server broadcasts to chat room (receive_message)
        ↓
Server broadcasts to participant rooms (new_message_notification)
        ↓
User B's app receives new_message_notification
        ↓
Checks: Is it from someone else? → Yes
        ↓
Calls notificationService.showMessageNotification()
        ↓
Browser shows notification! 🔔
```

---

## Settings Storage

Notifications settings are stored in localStorage:

| Key | Purpose | Default |
|-----|---------|---------|
| notify-enabled | Master toggle | true |
| notify-sound | Sound on/off | true |
| notify-preview | Show message text | true |
| notify-dnd | Do Not Disturb | false |

---

## Files Involved

### Frontend
- `src/services/notificationService.js` - Core notification logic
- `src/pages/Chat.jsx` - Socket listener for notifications
- `src/components/settings/NotificationsSettings.jsx` - Settings UI

### Backend
- `chat-server/server.js` - Broadcasts `new_message_notification` event

---

## Summary

✅ **Notifications show for incoming messages**
✅ **Works even when on different chat**
✅ **Respects user settings**
✅ **Shows sender name and preview**
✅ **Clicking focuses the window**
✅ **Test button in settings**

Test using 2 browsers with different users!
