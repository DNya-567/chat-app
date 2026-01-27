# Input Validation Implementation Guide

## ✅ What Was Added

I've implemented comprehensive input validation using **Joi** across your entire backend. Here's exactly what was added:

---

## 📦 Files Created

### 1. **Validation Schemas** (3 files)

#### `chat-server/validations/authValidation.js`
Validates authentication requests with these rules:

**REGISTER validation:**
- ✅ `username`: 3-30 characters, alphanumeric only
- ✅ `email`: Valid email format, max 100 chars
- ✅ `password`: Min 6 characters, max 100 chars
- ❌ Rejects: empty fields, invalid emails, short passwords, special chars in username

**LOGIN validation:**
- ✅ `email`: Valid email format
- ✅ `password`: Min 6 characters
- ❌ Rejects: empty fields, invalid email formats

**Example validation error:**
```javascript
// If user sends: { username: "ab", email: "notanemail", password: "123" }
{
  "message": "Validation failed",
  "errors": [
    { "field": "username", "message": "Username must be at least 3 characters" },
    { "field": "email", "message": "Email must be a valid email address" },
    { "field": "password", "message": "Password must be at least 6 characters" }
  ]
}
```

---

#### `chat-server/validations/chatValidation.js`
Validates chat-related requests:

**CREATE CHAT validation:**
- ✅ `userId`: Valid MongoDB ObjectId (24 hex chars)
- ✅ `otherUserId`: Valid MongoDB ObjectId
- ❌ Custom rule: Cannot chat with yourself
- ❌ Rejects: Invalid IDs, same userId and otherUserId

**GET CHATS validation:**
- ✅ `userId`: Valid MongoDB ObjectId
- ❌ Rejects: Invalid IDs, malformed requests

**SEND MESSAGE validation:**
- ✅ `chatId`: Valid MongoDB ObjectId
- ✅ `text`: Non-empty, min 1 char, max 5000 chars
- ❌ Rejects: Empty messages, messages > 5000 chars, invalid chat IDs

**ADD REACTION validation:**
- ✅ `messageId`: Valid MongoDB ObjectId
- ✅ `emoji`: Non-empty string, max 10 chars
- ❌ Rejects: Empty emoji, invalid message IDs

---

#### `chat-server/validations/userValidation.js`
Validates user-related requests:

**GET USER validation:**
- ✅ `id`: Valid MongoDB ObjectId
- ❌ Rejects: Invalid IDs, malformed requests

**UPDATE PROFILE validation:**
- ✅ `username`: 3-30 chars, alphanumeric (optional field)
- ❌ Rejects: Too short/long usernames, special characters

**SEARCH USERS validation:**
- ✅ `query`: 1-100 chars, non-empty search string (optional)
- ✅ `limit`: 1-100 results (optional, defaults to 10)
- ❌ Rejects: Empty query, limit > 100, invalid limits

---

### 2. **Validation Middleware** (1 file)

#### `chat-server/middleware/validate.js`
Provides reusable middleware functions for all route validations:

**Three validators:**
1. `validate()` - Validates `req.body`
2. `validateParams()` - Validates `req.params`
3. `validateQuery()` - Validates `req.query`

**Features:**
- ✅ Stops processing immediately if validation fails
- ✅ Returns detailed error messages per field
- ✅ Strips unknown/extra fields (security)
- ✅ Sanitizes data (removes whitespace)
- ✅ Shows ALL errors at once (not just first)

---

## 🔄 Routes Updated

### **Auth Routes** (`chat-server/routes/auth.js`)

#### Before (Vulnerable):
```javascript
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  
  // ❌ Only checks if fields exist, nothing else!
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }
  // ❌ No validation for:
  // - Email format
  // - Password strength
  // - Username format
  // - String lengths
});
```

#### After (Secure):
```javascript
router.post("/register", validate(registerSchema), async (req, res) => {
  // ✅ Data automatically validated by middleware before reaching here
  // ✅ Input guaranteed to be safe: valid email, strong password, clean username
  const { username, email, password } = req.body;
  
  // Now safe to use the data
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hashed });
});
```

**What happens now:**
1. User sends: `{ username: "ab", email: "bad-email", password: "123" }`
2. Middleware validates → Finds errors
3. Returns: `{ message: "Validation failed", errors: [...] }`
4. Route handler never runs ✅

---

### **Chat Routes** (`chat-server/routes/chat.js`)

```javascript
// CREATE CHAT - Now validates MongoDB IDs and prevents self-chat
router.post("/create", validate(createChatSchema), async (req, res) => {
  // ✅ userId & otherUserId guaranteed valid & different
});

// GET CHATS - Now validates user ID
router.get("/my/:userId", validateParams(getChatsByUserSchema), async (req, res) => {
  // ✅ userId guaranteed valid MongoDB ID
});
```

---

### **User Routes** (`chat-server/routes/users.js`)

```javascript
// GET USER - Now validates ID format
router.get("/:id", validateParams(getUserByIdSchema), async (req, res) => {
  // ✅ id guaranteed valid MongoDB ID
});

// UPDATE PROFILE - Now validates username
router.post(
  "/update-profile",
  auth,
  upload.single("avatar"),
  validate(updateProfileSchema), // ✅ NEW
  async (req, res) => {
    // ✅ username (if provided) is 3-30 chars & alphanumeric
  }
);
```

---

## 🛡️ Security Improvements

### **Before:**
```javascript
POST /register
Body: {
  username: "123456789012345678901234567890123",  // ❌ 33 chars, allowed!
  email: "not an email",                           // ❌ Invalid format, allowed!
  password: "123",                                 // ❌ 3 chars, allowed!
  isAdmin: true,                                   // ❌ Extra field, stored!
  role: "admin"                                    // ❌ Extra field, stored!
}
```

### **After:**
```javascript
POST /register
Body: {
  username: "123456789012345678901234567890123",  // ❌ REJECTED - max 30 chars
  email: "not an email",                           // ❌ REJECTED - invalid format
  password: "123",                                 // ❌ REJECTED - min 6 chars
  isAdmin: true,                                   // ❌ STRIPPED - unknown field
  role: "admin"                                    // ❌ STRIPPED - unknown field
}

Response: {
  message: "Validation failed",
  errors: [
    { field: "username", message: "Username must not exceed 30 characters" },
    { field: "email", message: "Email must be a valid email address" },
    { field: "password", message: "Password must be at least 6 characters" }
  ]
}
```

---

## 📋 Complete Validation Rules Reference

### **AUTHENTICATION**

| Field | Register | Login | Rules |
|-------|----------|-------|-------|
| username | ✅ Required | ❌ | 3-30 chars, alphanumeric only |
| email | ✅ Required | ✅ Required | Valid email format, max 100 chars |
| password | ✅ Required | ✅ Required | Min 6 chars, max 100 chars |

### **CHAT MANAGEMENT**

| Field | Create Chat | Get Chats | Send Message | Add Reaction |
|-------|-------------|-----------|--------------|--------------|
| userId | ✅ | - | - | - |
| otherUserId | ✅ | - | - | - |
| userId (param) | - | ✅ | - | - |
| chatId | - | - | ✅ | - |
| text | - | - | ✅ | - |
| messageId | - | - | - | ✅ |
| emoji | - | - | - | ✅ |

**All ObjectId fields** must be 24 hexadecimal characters
**All string lengths** checked and bounded
**Custom rule** for create-chat: userId ≠ otherUserId

### **USER MANAGEMENT**

| Field | Get User | Update Profile |
|-------|----------|-----------------|
| id (param) | ✅ | - |
| username | - | ✅ Optional |

**Rules:**
- Username: 3-30 alphanumeric chars (only if updating)
- ID: 24 hex chars (MongoDB ObjectId format)

---

## 🧪 Testing the Validation

### Test Case 1: Invalid Email on Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "password": "password123"}'

# Response:
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

### Test Case 2: Password Too Short on Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "email": "john@example.com", "password": "123"}'

# Response:
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

### Test Case 3: Invalid MongoDB ID on Get User
```bash
curl http://localhost:5000/api/users/invalid-id

# Response:
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "id",
      "message": "id must be a valid MongoDB ID"
    }
  ]
}
```

### Test Case 4: Empty Message
```bash
curl -X POST http://localhost:5000/api/chat/send-message \
  -H "Content-Type: application/json" \
  -d '{"chatId": "507f1f77bcf86cd799439011", "text": ""}'

# Response:
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "text",
      "message": "Message cannot be empty"
    }
  ]
}
```

---

## 🚀 Benefits Gained

✅ **Security**: Prevents injection attacks, malformed data, and invalid formats
✅ **Data Integrity**: Database only receives valid, properly-formatted data
✅ **User Experience**: Clear, specific error messages instead of vague "Invalid request"
✅ **Performance**: Fails fast at validation, doesn't hit database with bad data
✅ **Maintainability**: Centralized validation logic in schema files
✅ **Type Safety**: Data structure guaranteed before processing
✅ **API Contract**: Clear definition of what inputs are accepted

---

## 📖 How to Use in New Routes

When you add new routes, follow this pattern:

### Step 1: Create a schema in `validations/`
```javascript
// validations/newValidation.js
const Joi = require("joi");

const newSchema = Joi.object({
  field1: Joi.string().required(),
  field2: Joi.number().min(1).max(100)
});

module.exports = { newSchema };
```

### Step 2: Use in your route
```javascript
// routes/new.js
const { validate } = require("../middleware/validate");
const { newSchema } = require("../validations/newValidation");

router.post("/endpoint", validate(newSchema), async (req, res) => {
  const { field1, field2 } = req.body; // ✅ Guaranteed valid
  // ... rest of logic
});
```

---

## 🔗 File Structure

```
chat-server/
├── middleware/
│   └── validate.js                 ✅ NEW - Validation middleware
├── validations/                    ✅ NEW - Validation schemas folder
│   ├── authValidation.js           ✅ NEW
│   ├── chatValidation.js           ✅ NEW
│   └── userValidation.js           ✅ NEW
├── routes/
│   ├── auth.js                     ✅ UPDATED - Added validation
│   ├── chat.js                     ✅ UPDATED - Added validation
│   └── users.js                    ✅ UPDATED - Added validation
└── ...
```

---

## ⚠️ Important Notes

1. **Validation happens BEFORE route logic** - If validation fails, the route handler never executes
2. **Unknown fields are stripped** - Extra fields in request body are removed for security
3. **Whitespace is trimmed** - Leading/trailing spaces are automatically removed
4. **All errors shown at once** - Users see all validation errors, not just the first one
5. **MongoDB ObjectIds** must be exactly 24 hexadecimal characters
6. **Email format** follows RFC 5322 standard validation

---

## ✨ Next Steps

You can now:
1. ✅ Test the validation with the curl examples above
2. ✅ Add validation to any new routes you create
3. ✅ Enhance password validation (require uppercase, numbers, etc.) in `authValidation.js`
4. ✅ Add async validation (check if email already exists in DB) if needed
5. ✅ Update frontend to display these validation errors to users

---

## 📞 Troubleshooting

**Q: Validation middleware not being called?**
A: Make sure you import it correctly: `const { validate } = require("../middleware/validate");`

**Q: Getting 404 on validation endpoint?**
A: Check that the middleware is registered BEFORE the route handler in the route definition.

**Q: Validation errors not showing?**
A: Make sure you're sending `Content-Type: application/json` header in requests.

**Q: Custom validation rules?**
A: You can add `.external()` or `.custom()` to Joi schemas for database lookups.

