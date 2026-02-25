# Data Flow & Storage Guide

## 🏗 Architecture Overview
```
Frontend (React) ↔ Backend (Node.js) ↔ Database (MongoDB) 
                ↕                      ↕
            Socket.IO              Cloudinary
```

## 📊 Data Storage

### MongoDB Collections
1. **Users** - User accounts and profiles
2. **Chats** - Chat rooms and participants  
3. **Messages** - All chat messages with metadata

### File Storage
- **Cloudinary** - Avatar images and file uploads
- **Local uploads** - Temporary file processing

## 🔄 Data Flow Patterns

### Authentication Flow
1. User submits login/register form
2. Backend validates with Joi schemas
3. Password hashed with bcrypt
4. JWT token generated and returned
5. Frontend stores token in localStorage
6. Token included in all API requests

### Messaging Flow  
1. User types message in chat input
2. Frontend sends via Socket.IO `send_message`
3. Backend validates and saves to MongoDB
4. Backend emits to all chat participants
5. Clients receive and update UI
6. Read receipts tracked and synced

### File Upload Flow
1. User selects avatar image
2. Frontend sends multipart form data
3. Multer processes file on backend
4. Image uploaded to Cloudinary
5. Cloudinary URL saved to user profile
6. Frontend updates with new avatar URL

## 💾 Database Schema

### User Model
- Personal info (username, email, bio)
- Authentication (hashed password)
- Status (online, lastSeen)
- Stats (messageCount, chatCount)
- Media (avatar URL from Cloudinary)

### Chat Model
- Participants array (User IDs)
- Last message preview
- Chat type (currently only private)
- Timestamps

### Message Model
- Content (text, sender, chat reference)
- Interactions (reactions, replies)
- Status (deleted, edited)
- Read receipts array
- Timestamps

## 🔧 How It Was Built

### 1. Database Setup
- MongoDB Atlas cloud database
- Mongoose ODM for schema modeling
- Automatic timestamps and validation
- Indexes for performance

### 2. API Development
- Express.js REST API
- JWT authentication middleware
- Joi input validation
- CORS for cross-origin requests
- Swagger documentation

### 3. Real-time Features
- Socket.IO for bidirectional communication
- Room-based message broadcasting
- Connection authentication with JWT
- Event-driven architecture

### 4. File Handling
- Multer for multipart uploads
- Cloudinary for image processing
- Automatic resizing and optimization
- CDN delivery for fast loading

### 5. Frontend Integration
- React Context for state management
- Custom hooks for API calls
- Socket.IO client for real-time updates
- Responsive CSS with themes

## 🚀 Deployment Strategy
- **Frontend**: Vercel (automatic deployments)
- **Backend**: Render.com (Node.js hosting)
- **Database**: MongoDB Atlas (cloud database)
- **Files**: Cloudinary CDN
- **Environment**: Separate dev/production configs
