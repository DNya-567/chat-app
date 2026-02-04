# Clickable Username & Profile Testing Guide

## Quick Test (2 minutes)

### Test 1: Basic Clickable Username

**Setup:** Open any active chat

**Steps:**
```
1. Look at chat header: "Chat with [Username]"
2. Notice username is underlined (indicates clickable)
3. Hover over username
4. Click on the username
5. Profile modal should open
6. Click ✕ or outside modal to close
```

**Expected Results:**
- ✅ Username is underlined and looks clickable
- ✅ Hover shows background highlight
- ✅ Click opens profile modal with smooth animation
- ✅ Modal shows user's avatar and information
- ✅ Modal closes when clicking outside or ✕ button

### Test 2: Profile Information Display

**Steps:**
```
1. Open user profile modal
2. Verify all information sections are present:
   - Large profile picture
   - Online/offline status
   - Username and email
   - Member since date
   - Last seen time
   - Bio (if available)
   - Statistics (messages, chats, friends)
   - Action buttons
```

**Expected Results:**
- ✅ Profile picture displays correctly (120px)
- ✅ Online status shows with green/black indicator
- ✅ All user information fields are populated
- ✅ Statistics show real numbers from database
- ✅ Action buttons are clickable

### Test 3: Responsive Design

**Steps:**
```
1. Open profile on desktop
2. Resize window to mobile size (or test on mobile)
3. Open profile modal again
4. Check layout and button placement
```

**Expected Results:**
- ✅ Modal adapts to screen size
- ✅ Avatar size adjusts appropriately
- ✅ Buttons stack vertically on mobile
- ✅ Text remains readable
- ✅ Touch targets are finger-friendly

---

## Comprehensive Testing

### Visual Elements
- [ ] **Username clickable**: Underlined in chat header
- [ ] **Hover effect**: Background highlight on hover
- [ ] **Click feedback**: Brief press animation
- [ ] **Modal animation**: Smooth slide-up entrance
- [ ] **Backdrop blur**: Background blurred when modal open
- [ ] **Profile picture**: Large, circular, proper aspect ratio
- [ ] **Status indicator**: Green dot for online, black for offline
- [ ] **Information cards**: Clean layout with icons
- [ ] **Statistics section**: Numbers prominently displayed
- [ ] **Action buttons**: Styled with gradients and hover effects

### Information Accuracy
- [ ] **Username**: Matches chat partner's name
- [ ] **Email**: Shows user's email address
- [ ] **Avatar**: Displays user's profile picture
- [ ] **Member since**: Shows account creation date
- [ ] **Message count**: Real count from database
- [ ] **Chat count**: Real count of user's chats
- [ ] **Last seen**: Appropriate timestamp format
- [ ] **Online status**: Reflects current connection (mock data)
- [ ] **Bio**: Shows user's bio if available

### Interaction Testing
- [ ] **Username click**: Opens profile modal
- [ ] **Modal close (✕)**: Closes modal
- [ ] **Modal close (outside)**: Click outside closes modal
- [ ] **Escape key**: Closes modal (if supported)
- [ ] **Send Message button**: Clickable (functionality placeholder)
- [ ] **Block User button**: Clickable (functionality placeholder)
- [ ] **Multiple opens**: Can open/close multiple times
- [ ] **Different users**: Works with different chat partners

### Responsive Behavior
- [ ] **Desktop (>1024px)**: Full modal width, side-by-side buttons
- [ ] **Tablet (768-1024px)**: Adapted sizing, readable text
- [ ] **Mobile (<768px)**: Stacked buttons, smaller avatar
- [ ] **Portrait mode**: Proper layout in portrait orientation
- [ ] **Landscape mode**: Appropriate sizing in landscape
- [ ] **Touch interactions**: Buttons respond to touch
- [ ] **Scroll behavior**: Modal content scrolls if needed

---

## Test Scenarios

### Scenario 1: First-time User Profile View
```
Goal: Test profile viewing for new user

Setup: Chat with user who just registered

Steps:
1. Click username in chat header
2. Verify profile shows default/empty values:
   - Message count: 0 or low number
   - Chat count: 1 (current chat)
   - Bio: Empty or default text
   - Member since: Recent date
3. Check avatar shows default image if none set
4. Verify all sections display properly

Expected: ✅ Profile handles new users gracefully
```

### Scenario 2: Active User with Rich Profile
```
Goal: Test profile with established user

Setup: Chat with user who has been active

Steps:
1. Click username in chat header  
2. Verify profile shows realistic data:
   - Message count: Higher number
   - Chat count: Multiple chats
   - Custom avatar displayed
   - Bio with personal message
3. Check statistics reflect actual usage
4. Verify online status indicator

Expected: ✅ Profile shows rich, accurate information
```

### Scenario 3: API Failure Handling
```
Goal: Test graceful degradation when API fails

Setup: Disconnect from internet or block API calls

Steps:
1. Click username in chat header
2. Wait for profile load attempt
3. Verify fallback behavior:
   - Modal still opens
   - Basic user info displayed
   - Mock statistics shown
   - Error handled gracefully
4. Profile should not crash or show errors

Expected: ✅ Graceful fallback with mock data
```

### Scenario 4: Multiple User Profiles
```
Goal: Test switching between different user profiles

Setup: Multiple active chats with different users

Steps:
1. Open Chat A, click username → Profile A opens
2. Close profile, switch to Chat B
3. Click username → Profile B opens
4. Verify information is different for each user
5. Switch back to Chat A, open profile again

Expected: ✅ Each profile shows correct user information
```

### Scenario 5: Modal Behavior Testing
```
Goal: Test modal open/close behavior

Steps:
1. Click username → Modal opens
2. Click outside modal → Modal closes
3. Click username → Modal opens again
4. Click ✕ button → Modal closes
5. Repeat several times rapidly
6. Test with different window sizes

Expected: ✅ Consistent open/close behavior
```

---

## Performance Testing

### Load Times
- [ ] **Profile API call**: < 500ms response time
- [ ] **Modal animation**: Smooth 60fps animation
- [ ] **Image loading**: Profile pictures load quickly
- [ ] **Database queries**: Statistics calculated efficiently
- [ ] **Memory usage**: No memory leaks on repeated opens

### Database Performance
- [ ] **User lookup**: Fast user document retrieval
- [ ] **Message counting**: Efficient aggregation query
- [ ] **Chat counting**: Quick participant lookup
- [ ] **Multiple opens**: Consistent response times

---

## Browser Compatibility

### Desktop Browsers
- [ ] **Chrome**: Full functionality and animations
- [ ] **Firefox**: All features work correctly  
- [ ] **Safari**: Proper rendering and interactions
- [ ] **Edge**: Complete feature support

### Mobile Browsers  
- [ ] **Mobile Chrome**: Touch interactions work
- [ ] **Mobile Safari**: iOS-specific behavior correct
- [ ] **Samsung Internet**: Android compatibility
- [ ] **Mobile Firefox**: All features functional

---

## API Testing

### Successful Response
```javascript
// Expected response from /api/user/profile/:userId
{
  "_id": "user-id",
  "username": "Alice",  
  "email": "alice@example.com",
  "avatar": "/path/to/avatar.jpg",
  "bio": "Hey there!",
  "isOnline": true,
  "lastSeen": "2026-02-04T10:30:00Z",
  "messageCount": 142,
  "chatCount": 5,
  "friendCount": 5,
  "createdAt": "2025-01-15T09:00:00Z"
}
```

### Error Handling
- [ ] **404 User not found**: Shows fallback data
- [ ] **500 Server error**: Graceful degradation  
- [ ] **Network timeout**: Fallback to mock data
- [ ] **Invalid user ID**: Handles gracefully

---

## Console Logs to Check

### Successful Profile Load
```javascript
console.log("Fetching profile for user:", userId);
console.log("Profile data received:", userProfile);
```

### Fallback Scenarios
```javascript
console.error("Error fetching user profile:", error);
console.log("Using fallback profile data");
```

### Expected Logs
```
✅ Profile API calls logged
✅ Modal open/close events logged
✅ No JavaScript errors in console  
✅ Smooth animation performance
```

---

## Troubleshooting

### Username not clickable
**Check:**
1. CSS for `.clickable-username` class loaded
2. Click handler attached properly
3. Username text is wrapped in button element
4. No conflicting CSS preventing clicks

### Profile modal not opening
**Check:**
1. `showUserProfile` state updating correctly
2. `UserProfileModal` component imported
3. Modal overlay and content rendering
4. No JavaScript errors blocking execution

### Profile information missing
**Check:**
1. API endpoint `/api/user/profile/:userId` responding
2. User ID is valid MongoDB ObjectId
3. Database connection working
4. Fallback data generation working

### Statistics showing zero
**Check:**
1. Database has message/chat data for user
2. MongoDB aggregation queries working
3. User ID correctly passed to count queries
4. Database indexes for performance

---

## Success Criteria

✅ **Username is visibly clickable** with underline and hover
✅ **Click opens profile modal** with smooth animation
✅ **All profile information displays** correctly
✅ **Statistics show real data** from database
✅ **Modal closes properly** with ✕ or outside click
✅ **Responsive design works** on all screen sizes
✅ **API integration functional** with graceful fallbacks
✅ **No performance issues** with repeated use

---

## Quick Test Checklist

For rapid verification:

1. **Visual (30 seconds)**:
   - [ ] Username underlined in chat header
   - [ ] Hover shows background highlight
   - [ ] Click opens modal smoothly

2. **Information (30 seconds)**:
   - [ ] Profile picture displays
   - [ ] Username and email show
   - [ ] Statistics show numbers
   - [ ] Online status visible

3. **Interaction (30 seconds)**:
   - [ ] Modal closes with ✕ button
   - [ ] Modal closes clicking outside
   - [ ] Can reopen after closing

**Total test time: 90 seconds** ✅

---

## Summary

The clickable username feature provides:
- ✅ **Intuitive interaction** - Users naturally expect usernames to be clickable
- ✅ **Rich information** - Comprehensive user profiles with real statistics  
- ✅ **Professional design** - Polished modal with smooth animations
- ✅ **Mobile support** - Responsive design for all devices
- ✅ **Reliable data** - API integration with graceful fallbacks

Test using the 2-minute quick test above to verify the core functionality!
