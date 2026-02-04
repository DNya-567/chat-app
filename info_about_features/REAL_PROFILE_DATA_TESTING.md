# Real-Time User Profile Data - Testing Guide

## Quick Verification (3 minutes)

### Test 1: Real Message Count

**Setup:** Active chat with message history

**Steps:**
```
1. Send 3-5 messages in a chat
2. Click on the other user's username in header
3. Check the "Messages" count in their profile
4. Send 2 more messages
5. Close and reopen their profile
6. Verify message count increased by 2
```

**Expected Result:**
- ✅ Message count reflects actual messages sent by that user
- ✅ Count updates when new messages are sent
- ✅ Only non-deleted messages are counted

### Test 2: Real Chat Count

**Steps:**
```
1. Start a chat with User A
2. Start a chat with User B  
3. Click on User B's username → View profile
4. Check "Chats" count (should be at least 2)
5. Start chat with User C
6. View User C's profile
7. Check their chat count
```

**Expected Result:**
- ✅ Chat count shows actual number of chats user participates in
- ✅ Each new chat increases the count
- ✅ Count is accurate across different users

### Test 3: Online Status Accuracy

**Steps:**
```
1. Open chat app in Browser 1 (User A)
2. Open chat app in Browser 2 (User B)  
3. From Browser 1: Click User B's name → Check profile
4. Should show "🟢 Online"
5. Close Browser 2 completely
6. Wait 30 seconds
7. From Browser 1: View User B's profile again
8. Should now show "⚫ [time] ago"
```

**Expected Result:**
- ✅ Shows "🟢 Online" when user is connected
- ✅ Shows "⚫ X minutes ago" when user disconnects
- ✅ Last seen time is accurate

---

## Comprehensive Testing

### Database Accuracy
- [ ] **Message count**: Matches actual messages in database
- [ ] **Chat count**: Matches actual chat participations
- [ ] **Deleted messages**: Not included in message count
- [ ] **Real-time updates**: Counts update immediately
- [ ] **Multiple users**: Each user has correct individual counts

### Online Status Tracking
- [ ] **Connection tracking**: Online when socket connected
- [ ] **Disconnection tracking**: Offline when socket disconnects
- [ ] **Activity updates**: Last activity updates on actions
- [ ] **5-minute rule**: Shows offline if inactive >5 minutes
- [ ] **Last seen accuracy**: Shows correct disconnect time

### Real-Time Behavior
- [ ] **Send message**: Increases sender's message count
- [ ] **React to message**: Updates user's last activity
- [ ] **Join chat**: Marks user as online
- [ ] **Leave app**: Marks user as offline
- [ ] **Profile refresh**: Shows updated counts

---

## Test Scenarios

### Scenario 1: New User Profile
```
Goal: Verify profile data for brand new user

Setup: Create new account and immediately check profile

Expected Data:
- Message count: 0
- Chat count: 0 (or 1 if in a chat)
- Online status: 🟢 Online
- Member since: Today's date
- Last seen: "Online now"

Test: ✅ New users show accurate zero counts
```

### Scenario 2: Active User Profile
```
Goal: Test profile for user with activity

Setup: User who has sent messages and joined multiple chats

Steps:
1. Count actual messages sent by user in database
2. Count actual chats user participates in
3. Check profile shows exact matching numbers
4. Verify online status reflects current connection

Expected: ✅ Profile shows exact database counts
```

### Scenario 3: Offline User Profile
```
Goal: Test profile for disconnected user

Setup: User who was online but closed their browser

Steps:
1. User A connects and sends messages
2. User A disconnects (close browser)
3. Wait 1 minute
4. User B views User A's profile
5. Check shows "Last seen 1 minute ago"

Expected: ✅ Accurate offline status and last seen time
```

### Scenario 4: Real-Time Updates
```
Goal: Test that counts update in real-time

Setup: Two users, both online

Steps:
1. User A views User B's profile (note message count)
2. User B sends 3 messages
3. User A refreshes User B's profile
4. Message count should increase by 3

Expected: ✅ Profile data updates immediately
```

---

## Database Verification

### Check Message Count in MongoDB
```javascript
// Count messages for specific user
db.messages.countDocuments({ 
  sender: ObjectId("userId"), 
  deleted: { $ne: true } 
});
```

### Check Chat Count in MongoDB
```javascript
// Count chats user participates in
db.chats.countDocuments({ 
  participants: ObjectId("userId") 
});
```

### Check User Online Status
```javascript
// Check user's current status
db.users.findOne({ _id: ObjectId("userId") }, {
  isOnline: 1,
  lastSeen: 1,
  lastActivity: 1
});
```

---

## API Response Verification

### Expected Profile API Response
```json
{
  "_id": "userId",
  "username": "Alice",
  "email": "alice@example.com", 
  "avatar": "/path/to/avatar.jpg",
  "bio": "Hey there!",
  "isOnline": true,
  "lastSeen": "2026-02-04T15:30:45.123Z",
  "lastActivity": "2026-02-04T15:30:45.123Z", 
  "messageCount": 47,
  "chatCount": 5,
  "friendCount": 5,
  "createdAt": "2025-12-01T10:00:00.000Z"
}
```

### Verify API Accuracy
- [ ] **messageCount**: Matches `db.messages.countDocuments()`
- [ ] **chatCount**: Matches `db.chats.countDocuments()`
- [ ] **isOnline**: Reflects current socket connection
- [ ] **lastSeen**: Shows actual disconnect timestamp
- [ ] **lastActivity**: Updates on user actions

---

## Console Logs to Monitor

### User Connection Tracking
```
📱 User [userId] is now online
📊 Profile for Alice: 47 messages, 5 chats, online: true
📱 User [userId] is now offline
```

### Database Queries
```
Counting messages for user: [userId]
Counting chats for user: [userId]  
Profile data accuracy verified
```

### Expected Logs
- ✅ User online/offline status changes logged
- ✅ Profile data calculations logged
- ✅ Real database counts displayed
- ✅ No mock data warnings

---

## Performance Verification

### Database Query Performance
- [ ] **Message counting**: < 100ms for users with 1000+ messages
- [ ] **Chat counting**: < 50ms for users in 50+ chats
- [ ] **User lookup**: < 25ms for profile data
- [ ] **Concurrent requests**: Handles multiple profile requests

### Real-Time Performance
- [ ] **Online status updates**: < 200ms after connection/disconnection
- [ ] **Activity tracking**: < 50ms after user action
- [ ] **Profile API response**: < 500ms total response time

---

## Troubleshooting

### Incorrect Message Count
**Check:**
1. Database query includes `deleted: { $ne: true }`
2. Messages collection has correct sender IDs
3. User ID is valid ObjectId format
4. Database connection is working

### Wrong Online Status
**Check:**
1. Socket connection/disconnection events firing
2. User ID stored on socket during join_user_chats
3. Database updates in connect/disconnect handlers
4. 5-minute activity check working correctly

### Outdated Profile Data
**Check:**
1. API endpoint returning fresh data
2. No caching interfering with requests
3. Database queries not cached
4. Profile modal refetches on each open

---

## Success Criteria

✅ **Message counts are accurate** - Match actual database counts
✅ **Chat counts are accurate** - Match actual chat participations  
✅ **Online status is real-time** - Reflects current connection state
✅ **Last seen is precise** - Shows exact disconnect time
✅ **Data updates immediately** - New messages increment counts
✅ **No mock data used** - All statistics from database
✅ **Performance is good** - Queries complete quickly

---

## Quick Verification Script

Run this test sequence to verify everything works:

```
1. Send 5 messages → Check profile shows +5 messages
2. Join new chat → Check profile shows +1 chat  
3. Close browser → Check shows "X minutes ago"
4. Reconnect → Check shows "🟢 Online"
5. React to message → Check last activity updates
```

**Time to complete: 3 minutes**
**Result: All data should be accurate and real-time! ✅**

---

## Summary

The user profile now shows:
- ✅ **Real message counts** from database queries
- ✅ **Accurate chat counts** from participation records
- ✅ **True online status** based on socket connections
- ✅ **Precise last seen** timestamps from disconnect events
- ✅ **Real-time updates** when data changes
- ✅ **No mock data** - everything from actual usage

Test with the scenarios above to verify accuracy!
