# Read Receipts Implementation Guide

## Overview
Read receipts allow users to see if their messages have been delivered and read by other participants in the chat.

## Features Implemented

### 1. **Message Status Indicators**
- ✓ - Message delivered (other user hasn't read yet)
- ✓✓ - Message read (other user has seen it)

### 2. **Automatic Read Receipt Tracking**
- When a user opens a chat, all messages in that chat are automatically marked as read
- Individual messages are marked as read when viewed
- Read receipts are stored with timestamp

### 3. **Real-time Updates**
- All participants receive instant updates about message read status
- Read receipts are broadcast via WebSocket

## Backend Changes

### Message Model Update (`chat-server/models/Message.js`)
```javascript
const readReceiptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  readAt: { type: Date, default: Date.now }
}, { _id: false });

// Added to messageSchema:
readReceipts: {
  type: [readReceiptSchema],
  default: []
}
```

### Socket Events

#### 1. `mark_message_as_read`
**Emitted by:** Frontend when a message is viewed
**Data:** `{ messageId, userId }`
**Effect:** Adds user's read receipt to message and broadcasts update

#### 2. `mark_chat_as_read`
**Emitted by:** Frontend when a chat is opened
**Data:** `{ chatId, userId }`
**Effect:** Marks all messages in chat as read by user

#### 3. `chat_read_receipts_updated`
**Emitted by:** Server (broadcast)
**Data:** `{ chatId, userId, messages: [...] }`
**Effect:** Updates all participants with new read receipt information

### API Route Update (`chat-server/routes/messages.js`)
Messages endpoint now populates read receipt user information:
```javascript
.populate("readReceipts.userId", "_id username")
```

## Frontend Changes

### Chat.jsx Updates
1. **Import ReadReceipts component**
   ```javascript
   import ReadReceipts from "../components/chat/ReadReceipts";
   ```

2. **Add socket listener for read receipts**
   ```javascript
   sock.on("chat_read_receipts_updated", onChatReadReceiptsUpdated);
   ```

3. **Auto-mark chat as read when opening**
   ```javascript
   sock.emit("mark_chat_as_read", { chatId: chat._id, userId: user._id });
   ```

4. **Display read receipts in message UI**
   ```javascript
   {mine && <ReadReceipts readReceipts={msg.readReceipts} userId={otherUserId} />}
   ```

### ReadReceipts Component (`src/components/chat/ReadReceipts.jsx`)
- **Props:**
  - `readReceipts`: Array of read receipt objects
  - `userId`: ID of user to check if they've read

- **Logic:**
  - If no read receipts: Shows ✓ (not read)
  - If other user hasn't read: Shows ✓ (delivered)
  - If other user has read: Shows ✓✓ (read) in blue

## Visual Indicators

### CSS Styling (`src/components/chat/ReadReceipts.css`)
- **Gray (✓)**: Message delivered, not yet read
- **Blue (✓✓)**: Message has been read by recipient
- Hover tooltip shows status

## How It Works

### When User Opens Chat:
1. Frontend calls `openChat(chat)`
2. Emits `load_messages` to fetch messages
3. Emits `mark_chat_as_read` to backend
4. Backend marks all messages as read by this user
5. Backend broadcasts `chat_read_receipts_updated` to all participants
6. Frontend updates message list with new read receipts

### When Message is Received:
1. Message appears in chat with no read receipts
2. As other user views the message, read receipt is added
3. Original sender sees ✓✓ indicator appear on their message

### For Own Messages (sent by current user):
- Only show read receipts if message was sent by you
- Shows status of whether other user(s) have read it
- Gray ✓ = just delivered, Blue ✓✓ = read

## Database Schema Update

Messages now have this structure:
```javascript
{
  _id: ObjectId,
  chatId: ObjectId,
  sender: ObjectId,
  text: String,
  replyTo: ObjectId (optional),
  reactions: [{ emoji: String, userId: ObjectId }],
  deleted: Boolean,
  readReceipts: [{
    userId: ObjectId (ref: User),
    readAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Next Steps (Optional Enhancements)

1. **Seen by list**: Show "Seen by Alice, Bob" under messages
2. **Read receipt notification**: Notify sender when message is read
3. **Settings**: Allow users to disable read receipts
4. **Read receipts in chat list**: Show last read indicator in chat preview
5. **Typing indicators**: Show when other user is typing

## Testing

1. Start backend: `npm run dev` (from chat-server/)
2. Open chat in two browser windows/tabs
3. Send message from one account
4. Observe ✓ indicator appears
5. Switch to other account's window
6. Open the chat
7. See ✓✓ indicator appear on sender's message

## Troubleshooting

### Read receipts not appearing:
- Check browser console for errors
- Verify both users are connected to socket
- Check if messages are being loaded with `readReceipts` data

### Messages not being marked as read:
- Check server logs for `mark_chat_as_read` events
- Verify MongoDB has readReceipts field
- Check if user IDs are being passed correctly

### Performance issues:
- Consider paginating messages if chat is very long
- Batch read receipt updates for multiple messages
