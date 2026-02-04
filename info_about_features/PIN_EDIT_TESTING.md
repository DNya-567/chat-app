# Pin & Edit Feature - Testing Guide

## Quick Test (5 minutes)

### Test 1: Pin a Message

**Setup:** 2 browsers with different users in same chat

**Steps:**
```
Browser 1 (User A):
1. Send a message: "This is a test message"
2. Click ⋮ (three dots) on the message
3. Click "Pin"

Expected Results:
- ✅ Message shows 📌 Pinned badge
- ✅ Message appears in Pinned Section at top
- ✅ Pin button changes to "Unpin"

Browser 2 (User B):
4. Watch the chat
- ✅ See the message become pinned instantly
- ✅ Pinned section appears at top
- ✅ No refresh needed!
```

### Test 2: Unpin a Message

**Steps:**
```
Browser 1 (User A):
1. Find a pinned message
2. Click ⋮ (three dots)
3. Click "Unpin"

Expected Results:
- ✅ 📌 Pinned badge disappears
- ✅ Message removed from Pinned Section
- ✅ Button changes back to "Pin"
- ✅ User B sees change instantly
```

### Test 3: Edit a Message

**Steps:**
```
Browser 1 (User A):
1. Send a message: "Original text"
2. Click ⋮ (three dots) on YOUR message
3. Click "Edit"

Expected:
- ✅ Edit preview appears above input bar
- ✅ Original text shows in input field
- ✅ Placeholder changes to "Edit your message..."
- ✅ Button changes to "Save"

4. Change text to: "Edited text"
5. Press Enter or click Save

Expected Results:
- ✅ Message updates to "Edited text"
- ✅ "(edited)" indicator appears next to time
- ✅ Edit preview disappears
- ✅ User B sees change instantly!
```

### Test 4: Cancel Edit

**Steps:**
```
1. Click ⋮ on your message
2. Click "Edit"
3. Click ✕ (close button) in edit preview

Expected:
- ✅ Edit preview disappears
- ✅ Input field clears
- ✅ Placeholder returns to "Type a message..."
- ✅ Button returns to "Send"
```

### Test 5: Edit Restrictions

**Steps:**
```
Browser 1 (User A):
1. Find a message sent by User B
2. Click ⋮ (three dots)

Expected:
- ✅ "Edit" option is NOT visible (only sender can edit)
- ✅ "Pin" option IS visible (anyone can pin)
```

---

## Verification Checklist

### Pin Feature
- [ ] Pin button visible on all messages
- [ ] Clicking Pin adds message to pinned section
- [ ] Clicking Unpin removes from pinned section
- [ ] Pinned badge shows on message bubble
- [ ] Other user sees pin/unpin instantly
- [ ] Pinned messages survive page refresh

### Edit Feature
- [ ] Edit button only on own messages
- [ ] Edit preview appears when editing
- [ ] Input shows original text
- [ ] Cancel button clears edit mode
- [ ] Save button updates message
- [ ] "(edited)" indicator shows
- [ ] Other user sees edit instantly
- [ ] Edit survives page refresh

### UI Components
- [ ] Pinned section at top of chat
- [ ] Edit preview has orange styling
- [ ] Pin/Unpin toggle works correctly
- [ ] All animations are smooth

---

## Test Scenarios

### Scenario 1: Multiple Pinned Messages

```
1. Pin 3 different messages
2. Verify all appear in pinned section
3. Verify order (newest first or oldest first)
4. Unpin middle one
5. Verify it's removed from section
```

### Scenario 2: Edit Pinned Message

```
1. Send and pin a message
2. Edit the pinned message
3. Verify pinned section updates with new text
4. Verify "(edited)" badge shows in pinned section
5. Verify other user sees all changes
```

### Scenario 3: Pin Then Delete

```
1. Pin a message
2. Delete the same message
3. Verify message removed from pinned section
4. Verify message shows as deleted in chat
```

### Scenario 4: Rapid Edits

```
1. Edit message: "Edit 1"
2. Quickly edit again: "Edit 2"
3. Edit again: "Edit 3"
4. Verify only "Edit 3" shows
5. Verify "(edited)" shows
6. Verify edit history contains all versions (in DB)
```

---

## Troubleshooting

### Pin doesn't work
**Check:**
1. Console for errors
2. Socket connection is active
3. Backend running
4. Message ID is valid

### Edit doesn't save
**Check:**
1. You own the message (only sender can edit)
2. Message is not deleted
3. New text is not empty
4. Socket connection is active

### Changes not visible to other user
**Check:**
1. Both users connected via socket
2. Both in same chat room
3. `message_updated` event firing
4. Console for socket events

### Pinned section not showing
**Check:**
1. At least one message is pinned
2. CSS is loaded correctly
3. `messages.filter(m => m.pinned)` returns items

---

## Console Logs to Check

### Successful Pin
```
[pin_message] emitting: { messageId, userId, chatId }
[socket] message_updated received: ...
```

### Successful Edit
```
[edit_message] emitting: { messageId, userId, newText }
[socket] message_updated received: ...
```

### Error Cases
```
⛔ Cannot pin temporary message
⛔ Cannot edit temporary message
[socket] server error: { message: "..." }
```

---

## Database Verification

### Check Pinned Message in MongoDB
```javascript
db.messages.findOne({ _id: ObjectId("...") })
// Should show:
{
  pinned: true,
  pinnedBy: ObjectId("userId"),
  pinnedAt: ISODate("..."),
  ...
}
```

### Check Edited Message in MongoDB
```javascript
db.messages.findOne({ _id: ObjectId("...") })
// Should show:
{
  text: "New edited text",
  edited: true,
  editHistory: [
    { text: "Original text", editedAt: ISODate("...") }
  ],
  ...
}
```

### Check Chat's Pinned Messages
```javascript
db.chats.findOne({ _id: ObjectId("...") })
// Should show:
{
  pinnedMessages: [ObjectId("msgId1"), ObjectId("msgId2")],
  ...
}
```

---

## Performance Notes

- Pin/Unpin: < 200ms response
- Edit save: < 200ms response
- Real-time update: < 100ms to other user
- Pinned section renders: < 50ms
- No page reload needed

---

## Success Criteria

✅ All 5 test cases pass
✅ Both users see changes instantly
✅ Changes persist after refresh
✅ UI indicators work correctly
✅ Error handling works
✅ Console shows correct logs

---

## Summary

Test these features by:

1. **Pin:** Click ⋮ → Pin → Watch both users
2. **Unpin:** Click ⋮ → Unpin → Watch both users
3. **Edit:** Click ⋮ → Edit → Type → Save → Watch both users
4. **Cancel:** Start edit → Click ✕ → Verify cleared
5. **Restrictions:** Try editing other's message → Should fail

All features update in real-time across all connected users!
