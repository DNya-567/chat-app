# Read Receipts Testing Guide

## Prerequisites

- Backend running: `npm run dev` (from chat-server directory)
- Frontend running: `npm run dev` (from root directory)
- Two browsers or tabs open with different user accounts

## Test Scenarios

### Test 1: Basic Read Receipt (✓ → ✓✓)

**Setup:**
- Browser 1: User A logged in, any chat opened
- Browser 2: User B logged in, same chat opened

**Steps:**
1. In Browser 1 (User A), send message: "Hello from A"
2. Observe in Browser 1: Message shows ✓ (gray checkmark)
3. Switch to Browser 2 (User B) - it should already have the message
4. Return to Browser 1
5. Observe: Checkmark changes to ✓✓ (blue)

**Expected Result:** ✓ changes to ✓✓ when User B views the chat
**Status:** ✅ PASS / ❌ FAIL

---

### Test 2: Auto-Read on Chat Open

**Setup:**
- Browser 1 & 2 in same chat room
- User A has unread messages from User B

**Steps:**
1. In Browser 1, send message: "Test message"
2. Observe ✓ (gray)
3. In Browser 2, close this chat (switch to different chat or settings)
4. In Browser 2, re-open the chat with Browser 1 user
5. In Browser 1, observe the message

**Expected Result:** ✓✓ (blue) appears automatically
**Status:** ✅ PASS / ❌ FAIL

---

### Test 3: Multiple Messages

**Setup:**
- Open same chat in two browser windows

**Steps:**
1. In Browser 1 (User A), send 3 messages:
   - "Message 1"
   - "Message 2"
   - "Message 3"
2. Observe all show ✓ (gray)
3. In Browser 2 (User B), stay in the chat (auto-read should trigger)
4. In Browser 1, observe all three messages

**Expected Result:** All three change from ✓ to ✓✓
**Status:** ✅ PASS / ❌ FAIL

---

### Test 4: Received Messages Don't Show Read Status

**Setup:**
- Both users in same chat

**Steps:**
1. In Browser 1 (User A), send message: "Test"
2. In Browser 2 (User B), send message: "Reply"
3. In Browser 1, observe User B's message
4. Check if any indicator appears on User B's message

**Expected Result:** No ✓ or ✓✓ indicator on received messages (only on sent)
**Status:** ✅ PASS / ❌ FAIL

---

### Test 5: Own Messages Can't Be Marked as Read

**Setup:**
- Single user, two connections to same account

**Steps:**
1. Send message as User A
2. View from another connection of same user
3. Check server logs

**Expected Result:** Server logs should show "cannot read own message"
**Status:** ✅ PASS / ❌ FAIL

---

### Test 6: Read Status Persists After Refresh

**Setup:**
- Both users in chat
- User B has read messages from User A

**Steps:**
1. In Browser 1 (User A), send message
2. In Browser 2 (User B), observe message loads and is auto-read
3. In Browser 1, observe ✓✓
4. Refresh Browser 1
5. Open the same chat again

**Expected Result:** ✓✓ still shows (persisted in database)
**Status:** ✅ PASS / ❌ FAIL

---

### Test 7: Deleted Messages Clear Read Receipts

**Setup:**
- Message with read receipts
- User has permission to delete

**Steps:**
1. Send message and let it be read (✓✓)
2. Click 3 dots menu → Delete
3. Observe message text changes to "This message was deleted"
4. Observe read receipts are cleared

**Expected Result:** Message shows as deleted, ✓ reappears (not ✓✓)
**Status:** ✅ PASS / ❌ FAIL

---

### Test 8: Read Receipts with Reactions

**Setup:**
- Message with reactions
- Message with read receipts

**Steps:**
1. Send message, let it be read (✓✓)
2. Click reaction button, add emoji
3. Observe both ✓✓ and emoji reaction appear
4. Confirm read status doesn't change

**Expected Result:** Reaction added, ✓✓ persists
**Status:** ✅ PASS / ❌ FAIL

---

### Test 9: Read Receipts with Reply

**Setup:**
- Message with reply preview
- Message with read receipts

**Steps:**
1. Send original message: "Original"
2. Have other user reply: "This is a reply"
3. Send another message: "Got it"
4. Let other user read all messages
5. Observe all show ✓✓

**Expected Result:** All messages show ✓✓, replies still show correctly
**Status:** ✅ PASS / ❌ FAIL

---

### Test 10: Cross-Device Read Receipts

**Setup:**
- Two different browsers/devices
- Same user account logged in
- Different user in same chat

**Steps:**
1. Send message from Device A
2. Open chat in another browser (Device B)
3. In original chat view, observe status

**Expected Result:** Message marked as read when viewed on any device
**Status:** ✅ PASS / ❌ FAIL

---

## Server Log Checks

### Expected Logs When Testing

```javascript
// When mark_chat_as_read event received:
[SOCKET] join_user_chats → userId
📬 mark_chat_as_read { chatId, userId }

// When marking individual messages:
📬 mark_message_as_read { messageId, userId }

// Broadcast update:
// (No specific log, but message_updated should emit)
```

### Error Logs to Look For

```javascript
❌ mark_chat_as_read: invalid ids
❌ mark_message_as_read: message not found
❌ mark_message_as_read: cannot read own message
```

---

## Browser Console Checks

### Expected Logs (Frontend)

```javascript
// When opening chat:
✅ Chat.jsx socket available
📂 openChat called
🟢 openChat: socket connected, joining room

// Socket events:
[socket] chat_read_receipts_updated: [number] messages

// When message updates:
[socket] message_updated received: [messageId]
```

### Console Errors to Note

```javascript
❌ Chat.jsx: socket still missing
❌ React key warnings
Uncaught TypeError in ReadReceipts component
```

---

## Database Verification

### Check Message Structure in MongoDB

```javascript
// Connect to MongoDB
use chat_app_db
db.messages.findOne({ _id: ObjectId("...") })

// Should show:
{
  _id: ObjectId,
  chatId: ObjectId,
  sender: ObjectId,
  text: "Hello",
  readReceipts: [
    {
      userId: ObjectId,
      readAt: ISODate("2026-02-04T...")
    }
  ],
  ...
}
```

### Count Read Messages

```javascript
db.messages.countDocuments({ "readReceipts.0": { $exists: true } })
```

---

## Performance Testing

### Load Test: Many Messages

**Steps:**
1. Create chat with 100+ messages
2. Open chat from new user
3. Monitor time to mark all as read
4. Check memory usage

**Expected Result:**
- All marked within 5 seconds
- No memory spikes
- UI responsive

---

## Accessibility Testing

### Screen Reader Test

1. Navigate to message with read receipt
2. Confirm screen reader announces "Read" or "Delivered"

**Expected Result:** Status clearly announced

---

## Network Issues Testing

### Test Offline Scenario

**Steps:**
1. Open chat, send message (✓ appears)
2. Go offline (devtools network tab)
3. Message should stay as ✓
4. Go back online
5. Observe updates

**Expected Result:** Graceful handling of offline/online transitions

---

## Edge Cases

### Edge Case 1: Empty Chat

**Setup:**
- Open new chat with no messages

**Expected:** No read receipts shown

---

### Edge Case 2: Very Long Message

**Setup:**
- Message with 1000+ characters
- Has read receipts

**Expected:** Read receipt displays correctly, no layout breaks

---

### Edge Case 3: Rapid Messages

**Setup:**
- Send 10 messages rapidly
- Instantly open chat from other user

**Expected:** All marked as read, no duplicates, no missing receipts

---

## Cleanup After Testing

```bash
# Reset MongoDB (development only!)
# - Back up data first
# - Drop messages collection
# - Create new messages
# - Test again
```

---

## Test Summary Template

```
Date: _____________
Tester: _____________
Environment: Dev / Staging / Production

Test 1: Basic Receipt
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Test 2: Auto-Read
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Test 3: Multiple Messages
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Test 4: Received Messages
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Test 5: Own Messages
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Test 6: Persistence
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Test 7: Delete Clears
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Test 8: With Reactions
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Test 9: With Replies
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Test 10: Cross-Device
Status: ✅ PASS / ❌ FAIL
Notes: _____________

Overall Status: ✅ ALL PASS / ⚠️ SOME ISSUES / ❌ CRITICAL ISSUES

Issues Found:
1. ________________
2. ________________
3. ________________
```

---

## Troubleshooting During Tests

| Issue | Check | Solution |
|-------|-------|----------|
| No read receipts appearing | Server logs | Restart backend |
| ✓ doesn't change to ✓✓ | Socket connection | Check console for connection errors |
| Indicators missing | readReceipts data | Verify MongoDB has the data |
| Layout breaks | ReadReceipts.css | Check CSS syntax |
| Other user's receipt not showing | User ID comparison | Verify user IDs are correct |

---

## Success Criteria

✅ All 10 test cases pass
✅ No console errors
✅ Server logs show expected events
✅ Database contains readReceipts data
✅ UI indicators display correctly
✅ No performance issues
✅ Works across browsers
