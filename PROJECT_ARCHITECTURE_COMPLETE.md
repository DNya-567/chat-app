# Chat Application - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Frontend Architecture](#frontend-architecture)
8. [Real-time Communication](#real-time-communication)
9. [Authentication & Security](#authentication--security)
10. [File Upload System](#file-upload-system)
11. [Deployment](#deployment)
12. [Features Implemented](#features-implemented)

---

## 📱 Project Overview

### What is this project?
A **modern, real-time chat application** built with React.js frontend and Node.js backend, featuring:
- Real-time messaging with Socket.IO
- User authentication and authorization
- File upload with Cloudinary integration
- Multiple themes and responsive design
- Message reactions, replies, and editing
- Read receipts and online status
- Profile management with avatar upload
- Search functionality and message actions

### Project Goals
- Create a WhatsApp-like messaging experience
- Implement modern web development best practices
- Ensure cross-platform compatibility (mobile, tablet, desktop)
- Provide real-time communication with low latency
- Maintain scalable and maintainable code architecture

---

## 🛠 Technology Stack

### Frontend (Client)
```json
{
  "framework": "React 19.2.0",
  "bundler": "Vite 7.2.4",
  "styling": "Custom CSS with CSS Variables",
  "real-time": "Socket.IO Client 4.8.3",
  "analytics": "Vercel Speed Insights 1.3.1",
  "linting": "ESLint 9.39.1"
}
```

### Backend (Server)
```json
{
  "runtime": "Node.js",
  "framework": "Express.js 5.2.1",
  "database": "MongoDB with Mongoose 9.1.1",
  "real-time": "Socket.IO 4.8.3",
  "authentication": "JWT (jsonwebtoken 9.0.3)",
  "validation": "Joi 18.0.2",
  "file-upload": "Multer 2.0.2 + Cloudinary 2.8.0",
  "password-hashing": "bcryptjs 3.0.3",
  "documentation": "Swagger UI Express 5.0.1"
}
```

### Development Tools
- **Version Control**: Git
- **Environment**: dotenv for configuration
- **API Testing**: Swagger UI + Postman integration
- **Development Server**: Nodemon for auto-restart
- **CORS**: Configured for multiple origins

---

## 🏗 Project Architecture

### High-Level Architecture
```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐
│   React Client  │ ◄─────────────────► │   Node.js API   │
│   (Frontend)    │                     │   (Backend)     │
└─────────────────┘                     └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   MongoDB       │
                                        │   (Database)    │
                                        └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   Cloudinary    │
                                        │   (File Storage)│
                                        └─────────────────┘
```

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── chat/           # Chat-specific components
│   ├── common/         # Shared components
│   ├── layout/         # Layout components
│   ├── profile/        # Profile-related components
│   └── settings/       # Settings components
├── context/            # React Context providers
│   ├── AuthContext.jsx # Authentication state
│   ├── ThemeContext.jsx # Theme management
│   └── FontThemeContext.jsx # Font theme
├── hooks/              # Custom React hooks
├── pages/              # Main page components
├── services/           # API communication
├── styles/             # Global styles
└── utils/              # Utility functions
```

### Backend Structure
```
chat-server/
├── config/             # Configuration files
│   ├── cloudinary.js   # Cloudinary setup
│   └── swagger.js      # API documentation
├── controllers/        # Request handlers
├── middleware/         # Custom middleware
│   ├── auth.js         # JWT authentication
│   ├── upload.js       # File upload handling
│   └── validate.js     # Request validation
├── models/             # Database schemas
│   ├── User.js         # User model
│   ├── Chat.js         # Chat model
│   └── Message.js      # Message model
├── routes/             # API routes
│   ├── auth.js         # Authentication routes
│   ├── chat.js         # Chat management
│   ├── messages.js     # Message handling
│   └── users.js        # User management
├── validations/        # Joi validation schemas
├── uploads/            # Local file storage
├── db.js               # Database connection
└── server.js           # Main server file
```

---

## 🔄 Data Flow

### Authentication Flow
```
1. User Registration/Login
   ├── Frontend: Send credentials to /api/auth/register or /api/auth/login
   ├── Backend: Validate data with Joi schemas
   ├── Backend: Hash password with bcryptjs (registration)
   ├── Backend: Generate JWT token
   ├── Frontend: Store token in localStorage
   └── Frontend: Initialize Socket.IO connection with token

2. Authenticated Requests
   ├── Frontend: Include JWT in Authorization header
   ├── Backend: auth.js middleware validates token
   ├── Backend: Extract user info from token
   └── Backend: Attach user to req.user for route handlers
```

### Real-time Messaging Flow
```
1. Send Message
   ├── Frontend: User types message and hits send
   ├── Frontend: Emit 'send_message' socket event
   ├── Backend: Receive socket event
   ├── Backend: Validate and save message to MongoDB
   ├── Backend: Emit 'receive_message' to chat participants
   └── Frontend: Update UI with new message

2. Receive Message
   ├── Backend: Emit message to specific users in chat
   ├── Frontend: Listen for 'receive_message' event
   ├── Frontend: Update messages state
   └── Frontend: Scroll to new message and show notification
```

### File Upload Flow
```
1. Avatar/File Upload
   ├── Frontend: User selects file
   ├── Frontend: Send multipart/form-data to API
   ├── Backend: Multer middleware processes file
   ├── Backend: Upload to Cloudinary
   ├── Backend: Save Cloudinary URL to database
   ├── Backend: Return URL to frontend
   └── Frontend: Update UI with new image
```

---

## 🗃 Database Schema

### User Model (MongoDB/Mongoose)
```javascript
{
  _id: ObjectId,                    // MongoDB generated ID
  username: String (unique),        // Display name
  email: String (unique),           // Email address
  password: String,                 // Hashed password (bcrypt)
  avatar: String,                   // Cloudinary URL or empty string
  bio: String (max 500 chars),      // User biography
  isOnline: Boolean,                // Current online status
  lastSeen: Date,                   // Last activity timestamp
  lastActivity: Date,               // Last interaction
  messageCount: Number,             // Total messages sent
  chatCount: Number,                // Total chats participated
  createdAt: Date,                  // Account creation
  updatedAt: Date                   // Last profile update
}
```

### Chat Model
```javascript
{
  _id: ObjectId,                    // MongoDB generated ID
  participants: [ObjectId],         // Array of User IDs
  type: String,                     // "private" (currently only type)
  lastMessage: {
    text: String,                   // Last message content
    sender: ObjectId,               // Who sent last message
    timestamp: Date                 // When last message was sent
  },
  createdAt: Date,                  // Chat creation time
  updatedAt: Date                   // Last chat update
}
```

### Message Model
```javascript
{
  _id: ObjectId,                    // MongoDB generated ID
  chatId: ObjectId,                 // Reference to Chat
  sender: ObjectId,                 // Reference to User who sent message
  text: String,                     // Message content
  reactions: [{                     // Message reactions
    userId: ObjectId,               // Who reacted
    emoji: String                   // Reaction emoji
  }],
  replyTo: ObjectId,                // Reference to replied message
  deleted: Boolean,                 // Soft delete flag
  edited: Boolean,                  // Edit flag
  readReceipts: [{                  // Read receipts
    userId: ObjectId,               // Who read the message
    readAt: Date                    // When they read it
  }],
  createdAt: Date,                  // Message creation time
  updatedAt: Date                   // Last message update
}
```

---

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/auth/register
├── Body: { username, email, password }
├── Validation: Joi schemas
├── Response: { token, user } or error
└── Creates new user account

POST /api/auth/login
├── Body: { email, password }
├── Validation: Email format, password comparison
├── Response: { token, user } or error
└── Returns JWT for authenticated sessions
```

### Chat Management
```
GET /api/chats
├── Headers: Authorization: Bearer <token>
├── Response: Array of user's chats with participants
└── Paginated results (if implemented)

POST /api/chats
├── Headers: Authorization: Bearer <token>
├── Body: { participantId }
├── Response: Chat object or existing chat
└── Creates new chat or returns existing one
```

### Message Operations
```
GET /api/messages/:chatId
├── Headers: Authorization: Bearer <token>
├── Response: Array of messages in chat
└── Includes sender info and reactions

POST /api/messages/:chatId
├── Headers: Authorization: Bearer <token>
├── Body: { text, replyTo? }
├── Response: Created message object
└── Sends new message to chat

PUT /api/messages/:messageId
├── Headers: Authorization: Bearer <token>
├── Body: { text }
├── Response: Updated message
└── Edits existing message (owner only)

DELETE /api/messages/:messageId
├── Headers: Authorization: Bearer <token>
├── Response: Success status
└── Soft deletes message (owner only)
```

### User Management
```
GET /api/users/profile/:userId
├── Headers: Authorization: Bearer <token>
├── Response: User profile with stats
└── Public profile information

POST /api/users/upload-avatar
├── Headers: Authorization: Bearer <token>
├── Body: multipart/form-data with avatar file
├── Response: { avatarUrl }
└── Uploads to Cloudinary and updates user profile

PUT /api/users/profile
├── Headers: Authorization: Bearer <token>
├── Body: { bio?, username? }
├── Response: Updated user object
└── Updates user profile information
```

---

## ⚛️ Frontend Architecture

### Component Hierarchy
```
App
├── AuthContext.Provider
├── ThemeContext.Provider
├── FontThemeContext.Provider
└── Routes
    ├── Login/Register (unauthenticated)
    └── Chat (authenticated)
        ├── IconNavbar (left navigation)
        ├── MiddlePanel (chat list)
        ├── ChatMain (message area)
        │   ├── ChatHeader
        │   ├── MessageList
        │   │   └── MessageItem[]
        │   │       ├── MessageActions
        │   │       └── ReactionPicker
        │   └── MessageInput
        ├── ProfilePanel (user profile)
        └── SettingsModal (app settings)
```

### State Management
```javascript
// Global State (Context)
AuthContext: {
  user: User | null,
  token: string | null,
  login: (credentials) => Promise,
  logout: () => void,
  loading: boolean
}

ThemeContext: {
  theme: 'dark' | 'light' | 'neon',
  setTheme: (theme) => void
}

FontThemeContext: {
  fontTheme: 'default' | 'professional' | 'playful' | 'sophisticated',
  setFontTheme: (theme) => void
}

// Local State (Chat Component)
Chat: {
  chats: Chat[],
  activeChat: Chat | null,
  messages: Message[],
  message: string,
  replyingTo: Message | null,
  editingMessage: Message | null,
  showSearch: boolean,
  searchQuery: string,
  highlightedMessageId: string | null
}
```

### Key Services
```javascript
// API Communication
apiService: {
  login: (credentials) => Promise<AuthResponse>,
  register: (userData) => Promise<AuthResponse>,
  getChats: () => Promise<Chat[]>,
  getMessages: (chatId) => Promise<Message[]>,
  sendMessage: (chatId, data) => Promise<Message>,
  uploadAvatar: (file) => Promise<{avatarUrl}>
}

// Real-time Communication  
socketService: {
  connect: (token) => Socket,
  disconnect: () => void,
  joinUserChats: (userId) => void,
  sendMessage: (data) => void,
  onReceiveMessage: (callback) => void,
  onUserStatusUpdate: (callback) => void
}

// Authentication
authService: {
  setToken: (token) => void,
  getToken: () => string | null,
  removeToken: () => void,
  isTokenValid: () => boolean
}
```

---

## ⚡ Real-time Communication

### Socket.IO Implementation

#### Server-side Events
```javascript
// Connection Management
io.on('connection', (socket) => {
  // User joins their chats
  socket.on('join_user_chats', async (userId) => {
    // Join all chat rooms user participates in
  });
  
  // Message Handling
  socket.on('send_message', async (messageData) => {
    // Save to database
    // Emit to chat participants
    // Update read receipts
  });
  
  // Reaction Handling
  socket.on('add_reaction', async (data) => {
    // Update message with reaction
    // Notify chat participants
  });
  
  // Status Updates
  socket.on('user_typing', (data) => {
    // Broadcast typing status
  });
  
  socket.on('disconnect', () => {
    // Update user offline status
  });
});
```

#### Client-side Events
```javascript
// Connection Setup
socket = io(SERVER_URL, {
  auth: { token: localStorage.getItem('token') }
});

// Event Listeners
socket.on('receive_message', (message) => {
  setMessages(prev => [...prev, message]);
  scrollToBottom();
});

socket.on('message_updated', (updatedMessage) => {
  setMessages(prev => prev.map(msg => 
    msg._id === updatedMessage._id ? updatedMessage : msg
  ));
});

socket.on('user_status_updated', (userData) => {
  updateUserStatus(userData);
});

// Event Emitters
const sendMessage = () => {
  socket.emit('send_message', {
    chatId,
    senderId: user._id,
    text: message,
    replyTo: replyingTo?._id
  });
};
```

---

## 🔐 Authentication & Security

### JWT Implementation
```javascript
// Token Structure
{
  header: {
    alg: "HS256",
    typ: "JWT"
  },
  payload: {
    userId: "user_object_id",
    email: "user@example.com",
    iat: issued_at_timestamp,
    exp: expiration_timestamp
  },
  signature: "HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)"
}

// Server-side Verification
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};
```

### Password Security
```javascript
// Registration - Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Login - Compare password
const isMatch = await bcrypt.compare(password, user.password);
```

### Input Validation (Joi)
```javascript
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const messageSchema = Joi.object({
  text: Joi.string().min(1).max(2000).required(),
  replyTo: Joi.string().optional()
});
```

---

## 📁 File Upload System

### Cloudinary Integration
```javascript
// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload Process
const uploadResult = await new Promise((resolve, reject) => {
  cloudinary.uploader.upload_stream(
    {
      resource_type: "auto",
      folder: "chat-avatars",
      public_id: `avatar-${Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: "fill" },
        { quality: "auto:good" }
      ]
    },
    (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }
  ).end(req.file.buffer);
});
```

### Multer Configuration
```javascript
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  }
});
```

---

## 🚀 Deployment

### Environment Configuration
```bash
# Backend (.env)
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend (.env.production)
VITE_API_URL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com
```

### Production Setup
1. **Backend Deployment** (Render.com)
   - Connect GitHub repository
   - Set environment variables
   - Configure build command: `npm install`
   - Configure start command: `npm start`

2. **Frontend Deployment** (Vercel)
   - Connect GitHub repository
   - Set environment variables
   - Automatic build and deployment on push

3. **Database** (MongoDB Atlas)
   - Create cluster
   - Configure network access
   - Update connection string in environment

---

## 🎯 Features Implemented

### Core Messaging
- ✅ Real-time messaging with Socket.IO
- ✅ Message sending, editing, and deletion
- ✅ Reply to messages functionality
- ✅ Message search with highlighting
- ✅ Emoji reactions on messages
- ✅ Read receipts system
- ✅ Message status indicators

### User Management
- ✅ User registration and authentication
- ✅ JWT-based session management
- ✅ Profile management with avatar upload
- ✅ Online/offline status tracking
- ✅ User statistics (message count, chat count)

### Chat Features
- ✅ Private chat creation
- ✅ Chat list with last message preview
- ✅ Chat search by user ID
- ✅ Clickable usernames for profile viewing

### UI/UX Features
- ✅ Multiple themes (Dark, Light, Neon)
- ✅ Font theme customization
- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ Collapsible navigation on mobile
- ✅ Settings modal with various options
- ✅ Smooth animations and transitions

### Technical Features
- ✅ Input validation with Joi
- ✅ Error handling and user feedback
- ✅ File upload with Cloudinary
- ✅ API documentation with Swagger
- ✅ CORS configuration for multiple origins
- ✅ Performance monitoring with Vercel Analytics

---

## 📊 Performance & Analytics

### Frontend Optimization
- Vite for fast development and optimized builds
- Component lazy loading where applicable
- Efficient React state management
- CSS optimization with variables and responsive design

### Backend Optimization
- MongoDB indexing for faster queries
- JWT token validation middleware
- Efficient Socket.IO room management
- File upload optimization with Cloudinary transformations

### Monitoring
- Vercel Speed Insights for frontend performance
- Console logging for server-side debugging
- Error boundaries for React error handling
- Swagger UI for API testing and documentation

---

This documentation provides a comprehensive overview of the chat application's architecture, implementation details, and how all components work together to create a modern, real-time messaging platform.
