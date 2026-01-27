# Input Validation - Quick Reference

## 🎯 Summary: What Was Added

**Validation Rules Implementation using Joi library**

---

## 📊 Quick Comparison: Before vs After

### REGISTER Endpoint

#### ❌ BEFORE
```javascript
POST http://localhost:5000/api/auth/register
Content-Type: application/json

// User sends this (INVALID DATA)
{
  "username": "ab",              // Too short!
  "email": "notanemail",         // Invalid format!
  "password": "123",             // Too short!
  "isAdmin": true                // Extra field!
}

// Response: Created user anyway 😱
```

#### ✅ AFTER
```javascript
POST http://localhost:5000/api/auth/register
Content-Type: application/json

// Same request above
{
  "username": "ab",
  "email": "notanemail",
  "password": "123",
  "isAdmin": true
}

// Response: VALIDATION ERROR ✅
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "username",
      "message": "Username must be at least 3 characters"
    },
    {
      "field": "email",
      "message": "Email must be a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

---

## 📋 All Validation Rules

### 1️⃣ AUTHENTICATION

#### REGISTER
```
✅ username:
   - Min: 3 characters
   - Max: 30 characters
   - Allowed: Letters & numbers only (no special chars)
   - Example: "john123" ✅, "ab" ❌, "j@hn" ❌

✅ email:
   - Format: Valid email (name@domain.com)
   - Max: 100 characters
   - Example: "user@example.com" ✅, "notanemail" ❌, "user@" ❌

✅ password:
   - Min: 6 characters
   - Max: 100 characters
   - Example: "mypass123" ✅, "123" ❌
```

#### LOGIN
```
✅ email:
   - Format: Valid email
   - Example: "user@example.com" ✅, "notanemail" ❌

✅ password:
   - Min: 6 characters
   - Example: "mypass123" ✅, "123" ❌
```

---

### 2️⃣ CHAT MANAGEMENT

#### CREATE CHAT
```
✅ userId:
   - Format: Valid MongoDB ObjectId
   - Example: "507f1f77bcf86cd799439011" ✅, "invalid" ❌

✅ otherUserId:
   - Format: Valid MongoDB ObjectId
   - Example: "507f1f77bcf86cd799439012" ✅

⚠️ CUSTOM RULE: Cannot chat with yourself
   - userId must NOT equal otherUserId
```

#### GET CHATS
```
✅ userId (in URL params):
   - Format: Valid MongoDB ObjectId
   - Example: GET /api/chat/my/507f1f77bcf86cd799439011 ✅
```

#### SEND MESSAGE
```
✅ chatId:
   - Format: Valid MongoDB ObjectId
   - Example: "507f1f77bcf86cd799439011" ✅

✅ text:
   - Min: 1 character (not empty)
   - Max: 5000 characters
   - Example: "Hello!" ✅, "" ❌, "Very long..." (5001 chars) ❌
```

#### ADD REACTION
```
✅ messageId:
   - Format: Valid MongoDB ObjectId
   - Example: "507f1f77bcf86cd799439011" ✅

✅ emoji:
   - Min: 1 character
   - Max: 10 characters
   - Example: "😊" ✅, "👍" ✅, "" ❌
```

---

### 3️⃣ USER MANAGEMENT

#### GET USER
```
✅ id (in URL params):
   - Format: Valid MongoDB ObjectId
   - Example: GET /api/users/507f1f77bcf86cd799439011 ✅
```

#### UPDATE PROFILE
```
✅ username (OPTIONAL):
   - Min: 3 characters (if provided)
   - Max: 30 characters
   - Allowed: Letters & numbers only
   - Example: "newusername" ✅, "ab" ❌
```

---

## 🧪 Real Test Cases

### Test 1: Invalid Email on Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bad-email",
    "password": "password123"
  }'

# Response: 400 Bad Request
{
  "message": "Validation failed",
  "errors": [{
    "field": "email",
    "message": "Email must be a valid email address"
  }]
}
```

### Test 2: Empty Message
```bash
curl -X POST http://localhost:5000/api/chat/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "507f1f77bcf86cd799439011",
    "text": ""
  }'

# Response: 400 Bad Request
{
  "message": "Validation failed",
  "errors": [{
    "field": "text",
    "message": "Message cannot be empty"
  }]
}
```

### Test 3: Username Too Short on Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "user@example.com",
    "password": "password123"
  }'

# Response: 400 Bad Request
{
  "message": "Validation failed",
  "errors": [{
    "field": "username",
    "message": "Username must be at least 3 characters"
  }]
}
```

### Test 4: Invalid MongoDB ID
```bash
curl http://localhost:5000/api/users/not-a-valid-id

# Response: 400 Bad Request
{
  "message": "Validation failed",
  "errors": [{
    "field": "id",
    "message": "id must be a valid MongoDB ID"
  }]
}
```

### Test 5: Valid Request (PASS ✅)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john",
    "email": "user@example.com",
    "avatar": "..."
  }
}
```

---

## 🛡️ Security Features

### What Gets Rejected?
- ❌ Empty fields (when required)
- ❌ Invalid email formats
- ❌ Passwords shorter than 6 characters
- ❌ Usernames with special characters
- ❌ Usernames shorter than 3 characters
- ❌ Messages longer than 5000 characters
- ❌ Invalid MongoDB ObjectIds
- ❌ Attempting to chat with yourself
- ❌ Extra/unknown fields in request

### What Gets Cleaned?
- ✅ Whitespace trimmed from strings
- ✅ Unknown fields removed from request
- ✅ Data type coerced safely
- ✅ All errors collected and shown at once

---

## 📁 New Files Added

```
chat-server/
├── middleware/
│   └── validate.js                          ← Middleware
├── validations/                             ← New folder
│   ├── authValidation.js                    ← Auth rules
│   ├── chatValidation.js                    ← Chat rules
│   └── userValidation.js                    ← User rules
└── routes/
    ├── auth.js                              ← Updated
    ├── chat.js                              ← Updated
    └── users.js                             ← Updated
```

---

## 🚀 How Validation Works

### Flow Diagram

```
User sends request
       ↓
Middleware receives body/params/query
       ↓
Validation schema checks data
       ↓
Has errors?
    ↓ YES → Return 400 Bad Request with errors
    ↓ NO
       ↓
Data sanitized & cleaned
       ↓
req.body/params/query updated with valid data
       ↓
Route handler called with guaranteed valid data
       ↓
Process request safely
```

---

## 💡 Quick Examples of Valid Requests

### Register
```json
{
  "username": "john123",
  "email": "john@example.com",
  "password": "securepass123"
}
```

### Login
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

### Create Chat
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "otherUserId": "507f1f77bcf86cd799439012"
}
```

### Send Message
```json
{
  "chatId": "507f1f77bcf86cd799439013",
  "text": "Hello, how are you?"
}
```

### Update Profile
```json
{
  "username": "newname456"
}
```

---

## ✨ Benefits

✅ **Security** - Prevents invalid data reaching database
✅ **Consistency** - All data meets same standards
✅ **Clarity** - Users know exactly what's wrong
✅ **Performance** - Fails fast before DB queries
✅ **Maintainability** - Validation in one place
✅ **Reusability** - Easy to add same rules to new routes

---

## 🔗 Dependencies

All validation happens using **Joi** library:
- Already installed: `npm install joi`
- No additional packages needed
- Zero runtime performance impact

---

## 📞 Need to Add More Validation?

Use this template:

```javascript
// 1. Create schema
const Joi = require("joi");
const mySchema = Joi.object({
  field1: Joi.string().required(),
  field2: Joi.number().min(0).max(100)
});

// 2. Use in route
const { validate } = require("../middleware/validate");

router.post("/endpoint", validate(mySchema), async (req, res) => {
  // Safe data here
});
```

That's it! 🎉

