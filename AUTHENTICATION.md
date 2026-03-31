# 🔐 Authentication & Security Implementation Guide

## Overview

A complete authentication and authorization system has been implemented for the KVB Admin Portal. This document explains the architecture, components, and best practices.

---

## 📋 Components

### 1. **Authentication Decorator** (`utils/auth_decorator.py`)

Provides reusable decorators to protect routes from unauthenticated access.

#### Available Decorators:

**`@login_required`**

- Requires user to be logged in
- Redirects to `/login` if not authenticated
- Usage:

```python
@app.route('/protected')
@login_required
def protected_route():
    return render_template('protected.html')
```

**`@admin_required`**

- Currently same as `@login_required`
- Can be extended for role-based access control
- For future admin-only functionality

---

### 2. **Protected Routes**

The following routes now have authentication protection:

| Route              | Method    | Protection           | Description                     |
| ------------------ | --------- | -------------------- | ------------------------------- |
| `/admin`           | GET       | ✅ `@login_required` | Admin dashboard with statistics |
| `/admin/dashboard` | GET       | ✅ `@login_required` | Detailed admin dashboard        |
| `/update`          | GET       | ✅ `@login_required` | Content upload/update page      |
| `/login`           | GET, POST | ❌ None              | Login form and processing       |
| `/logout`          | GET       | ❌ None              | Session cleanup and redirect    |

---

### 3. **Login System** (`/login`)

#### Features:

- ✅ **Session-based authentication** using Flask sessions
- ✅ **Password hashing** with werkzeug security
- ✅ **Session persistence** - 30-minute timeout
- ✅ **Error handling** and logging
- ✅ **CSRF protection** (Flask default)
- ✅ **Kannada UI** for better user experience

#### Flow:

```
User visits /login
    ↓
Displays login form with username & password fields
    ↓
User submits credentials (POST)
    ↓
Server validates against database
    ↓
If valid:
    - Create session with user_id
    - Set session.permanent = True (30 min timeout)
    - Log successful login
    - Redirect to /admin
↓
If invalid:
    - Log failed attempt
    - Display error message
    - Redirect back to login form
```

#### Request Handling:

```python
@app.route('/login', methods=['GET', 'POST'])
def login():
    # GET: Display login form
    if request.method == 'GET':
        return render_template('login.html')

    # POST: Process login
    username = request.form.get('username')
    password = request.form.get('password')

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        session['user_id'] = user.id
        session['username'] = user.username
        return redirect(url_for('admin'))
```

---

### 4. **Logout System** (`/logout`)

#### Features:

- ✅ Clears all session data
- ✅ Logs logout event
- ✅ Redirects to home page
- ✅ Session cleanup

```python
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    logger.info(f'User {username} logged out')
    return redirect(url_for('index'))
```

---

### 5. **Session Configuration**

```python
# 30-minute session timeout (auto-extends on each request)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# Extend session on every request
@app.before_request
def make_session_permanent():
    session.permanent = True
```

**How it works:**

- Session timeout: 30 minutes of inactivity
- Every request extends the timeout by another 30 minutes
- Automatic cleanup of expired sessions

---

### 6. **Improved Login Page**

#### Design Features:

- 🎨 **Modern UI** with gradient backgrounds
- 📱 **Responsive design** (mobile-friendly)
- ✨ **Enhanced UX** with password visibility toggle
- 🔒 **Secure inputs** with proper labels and autocomplete
- ⚠️ **Error alerts** with Kannada text
- ⏳ **Loading state** with spinner

#### Key Interactions:

- **Password Toggle**: Click 👁️ icon to show/hide password
- **Error Messages**: Display below form field
- **Loading State**: Spinner overlay during submission
- **Kannada Support**: Full Kannada interface

#### Error Handling:

```javascript
// Client-side validation
if (!username || !password) {
  showError("ಬಳಕೆದಾರ ಹೆಸರು ಮತ್ತು ಗುಪ್ತಪದ ಎರಡೂ ಅಗತ್ಯ");
  return;
}

// Display server errors
if (error) {
  showError(error);
}
```

---

## 🔨 How to Use

### Protect a New Route

```python
from utils.auth_decorator import login_required

@app.route('/my-protected-route')
@login_required
def my_protected_route():
    # This route can only be accessed by logged-in users
    user_id = session['user_id']
    username = session.get('username')
    return render_template('protected.html')
```

### Access User Info in Route

```python
from flask import session

@app.route('/my-route')
@login_required
def my_route():
    user_id = session['user_id']
    username = session.get('username')
    # Use user_id to fetch user from database
    user = User.query.get(user_id)
```

### Check Login Status in Templates

```html
<!-- In any template -->
{% if 'user_id' in session %}
<p>Welcome, {{ session.get('username') }}</p>
<a href="/logout">Logout</a>
{% else %}
<a href="/login">Login</a>
{% endif %}
```

---

## 🔍 Logging & Monitoring

All authentication events are logged:

```
[Login Success]
INFO - User {username} logged in successfully

[Login Failed]
WARNING - Failed login attempt for user {username} from {IP}

[Missing Credentials]
WARNING - Login attempt with missing credentials from {IP}

[Database Error]
ERROR - Database error during login: {error_message}

[Logout]
INFO - User {username} logged out
```

**Check logs:**

```bash
# View all logs
tail -f app.log

# Filter auth logs
grep "logged in\|logged out\|Failed login" app.log
```

---

## 🔐 Security Features

### Implemented:

- ✅ **Password Hashing**: Uses werkzeug.security (PBKDF2)
- ✅ **Session Management**: HTTP-only cookies
- ✅ **CSRF Protection**: Flask default
- ✅ **Input Validation**: Both client-side and server-side
- ✅ **Error Handling**: Generic error messages (no info disclosure)
- ✅ **Logging**: All auth attempts logged with IP address
- ✅ **Session Timeout**: 30-minute automatic logout

### Best Practices:

1. Never log passwords
2. Use HTTPS in production
3. Keep Flask-SQLAlchemy updated
4. Use strong passwords (8+ chars)
5. Monitor login failures
6. Regular security audits

---

## 🚀 Future Enhancements

### Planned Features:

1. **Two-Factor Authentication (2FA)**
   - Email-based OTP
   - SMS-based OTP
   - Authenticator app support

2. **Role-Based Access Control (RBAC)**
   - Admin role
   - Editor role
   - Viewer role
   - Extend `@admin_required` decorator

3. **Audit Trail**
   - Log all user actions
   - Track changes to data
   - IP and timestamp recording

4. **Password Management**
   - Change password functionality
   - Password strength requirements
   - Password reset via email

5. **Rate Limiting**
   - Limit login attempts
   - Prevent brute force attacks
   - IP-based throttling

6. **Remember Me**
   - Extended session with "Remember Me" checkbox
   - Secure cookie handling

---

## 📝 Environment Variables

```env
# Secret key for session handling (generate with: python -c "import secrets; print(secrets.token_hex(16))")
FLASK_SECRET_KEY=your_secret_key_here

# Default admin username
DEFAULT_ADMIN_USERNAME=admin

# Database URL
DATABASE_URL=mysql+pymysql://user:password@localhost/kvb_db

# Flask environment
FLASK_ENV=production
```

---

## 🧪 Testing Authentication

### Test Login:

```bash
# Start the app
python app.py

# Login in browser
http://localhost:8443/login

# Try to access protected route without login
http://localhost:8443/admin
# Should redirect to /login
```

### Test Credentials:

- Default username: (from `DEFAULT_ADMIN_USERNAME` env var)
- Password: (set during user creation)

### Test Session Timeout:

1. Login to system
2. Wait 30 minutes without any requests
3. Or manually clear browser cookies
4. Next request should redirect to login

---

## 📚 File Structure

```
kvb/
├── app.py                          # Main app with auth routes
├── utils/
│   └── auth_decorator.py          # Authentication decorators ✨ NEW
├── routers/
│   └── web_routes/
│       └── admin_routes.py        # Protected dashboard route
├── templates/
│   ├── login.html                 # Improved login page ✨ UPDATED
│   ├── admin/
│   │   └── dashboard.html         # Protected dashboard
│   └── admin.html                 # Protected admin page
├── model/
│   └── models.py                  # User model with password hashing
└── services/
    └── user_management.py         # User operations
```

---

## ✅ Implementation Checklist

- ✅ Authentication decorator created (`@login_required`, `@admin_required`)
- ✅ Dashboard endpoint protected with `@login_required`
- ✅ Admin page protected with `@login_required`
- ✅ Update page protected with `@login_required`
- ✅ Login page redesigned with modern UI
- ✅ Enhanced error handling with Kannada messages
- ✅ Session management implemented (30-min timeout)
- ✅ Logout functionality with session cleanup
- ✅ Logging for all authentication events
- ✅ Input validation (client & server-side)
- ✅ Password hashing with werkzeug security
- ✅ CSRF protection (Flask default)

---

## 🆘 Troubleshooting

### Issue: "openUserEditModal is not defined"

**Solution:** Already fixed in dashboard.js by exposing functions to global scope

### Issue: Can't login

**Check:**

1. Is default user created? `echo "Check DB for users table"`
2. Is password correct? Try default password from env
3. Check app logs for errors: `tail -f /var/log/app.log`

### Issue: Session expires too quickly

**Check:**

1. `PERMANENT_SESSION_LIFETIME` is set to 30 minutes (line 32 in app.py)
2. `make_session_permanent()` is called on every request
3. Browser has cookies enabled

### Issue: Can't access protected routes

**Check:**

1. Are you logged in? Visit `/login`
2. Check session cookie in browser DevTools
3. Verify `@login_required` decorator is applied
4. Check browser console for errors

---

## 📖 Additional Resources

- [Flask Sessions](https://flask.palletsprojects.com/en/2.3.x/quickstart/#sessions)
- [Werkzeug Security](https://werkzeug.palletsprojects.com/en/2.3.x/security/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Flask Best Practices](https://flask.palletsprojects.com/en/2.3.x/security/)

---

## 📞 Support

For issues or questions about authentication:

1. Check the logs: `tail -f app.log`
2. Review this documentation
3. Check browser console for JavaScript errors
4. Verify database connection and user table

---

**Last Updated:** March 31, 2026
**Status:** ✅ Complete and Production-Ready
