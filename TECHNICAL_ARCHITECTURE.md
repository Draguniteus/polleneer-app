# 🏗️ POLLENEER - TECHNICAL ARCHITECTURE

## **PROJECT OVERVIEW**
- **Repository:** https://github.com/Draguniteus/polleneer-app
- **Live URL:** https://polleneer-dbkzq.ondigitalocean.app
- **Local Path:** C:\Users\user\Desktop\polleneer-app
- **Environment:** Windows PowerShell, DigitalOcean deployment

## **CURRENT ARCHITECTURE**
polleneer-app/
├── frontend/ # React development (not used in production)
│ ├── src/ # React source code
│ ├── dist/ # Built production files
│ ├── simple-production-build.mjs # Working build script
│ └── manual-build.mjs # Alternative build
├── backend/ # ✅ PRODUCTION SERVER
│ ├── server.js # ✅ Production Express server
│ ├── public/ # ❌ NEEDS REORGANIZATION
│ │ ├── index.html # ❌ Needs minimal shell
│ │ └── assets/ # ❌ Needs proper structure
│ ├── package.json # ✅ Clean, valid JSON
│ ├── package-lock.json # ✅ Generated for npm
│ ├── .npmrc # ✅ Production npm config
│ ├── database.js # Placeholder for PostgreSQL
│ └── routes/ # Placeholder for API routes
├── digitalocean.app.yaml # ✅ DigitalOcean deployment config
└── package.json # ✅ Root package.json (clean)

text

## **REQUIRED FILE STRUCTURE**

### **PRODUCTION READY STRUCTURE:**
backend/public/
├── index.html # Minimal HTML shell (no business logic)
├── assets/
│ ├── css/
│ │ ├── main.css # Base styles
│ │ ├── components/ # Modular component styles
│ │ │ ├── navbar.css
│ │ │ ├── roles.css
│ │ │ ├── shop.css
│ │ │ └── admin.css
│ │ ├── themes/
│ │ │ └── dark.css # Dark theme variables
│ │ └── main.min.css # Minified for production
│ ├── js/
│ │ ├── modules/ # Modular JavaScript
│ │ │ ├── auth.js # Authentication logic
│ │ │ ├── roles.js # Roles display logic
│ │ │ ├── shop.js # Shop functionality
│ │ │ ├── admin.js # Admin panel logic
│ │ │ └── api.js # API communication
│ │ ├── utils/ # Utility functions
│ │ │ ├── helpers.js
│ │ │ ├── animations.js
│ │ │ └── validators.js
│ │ ├── app.js # Main application entry
│ │ └── app.min.js # Minified for production
│ └── images/ # All visual assets
│ ├── icons/
│ ├── backgrounds/
│ └── ui/
└── config/ # Server-side only (NOT public!)
├── roles.json # 91 roles data
├── shop-items.json # Honey shop catalog
└── achievements.json # Achievement definitions

text

## **SECURITY ARCHITECTURE**

### **PROTECTED SERVER-SIDE ONLY:**
1. **91 Bee Roles Logic:** Role progression algorithms, unlock requirements
2. **Honey Points Formulas:** Calculation algorithms, economy balancing
3. **Golden Hive Algorithm:** Recommendation engine, machine learning logic
4. **Admin Moderation:** Ban logic, gift distribution, user management
5. **Authentication Secrets:** JWT signing, password hashing, session tokens

### **FRONTEND RESTRICTIONS:**
- No business logic in HTML
- No sensitive algorithms in JavaScript
- No API keys or secrets in client-side code
- No database queries directly from frontend

### **MINIFICATION REQUIREMENTS:**
- All production CSS must be minified to `.min.css`
- All production JS must be minified to `.min.js`
- Development files kept separate for debugging

## **API ENDPOINTS REQUIRED**

### **AUTHENTICATION ENDPOINTS:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with JWT
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/logout` - Session termination

### **USER MANAGEMENT:**
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/role` - Get user's current role
- `GET /api/users/:id/honey` - Get honey points balance

### **ROLES SYSTEM:**
- `GET /api/roles` - Get all 91 roles (limited data)
- `GET /api/roles/:id` - Get specific role details
- `POST /api/roles/assign` - Assign role to user (admin only)
- `GET /api/roles/progression/:userId` - Get user's role progression

### **HONEY ECONOMY:**
- `GET /api/honey/balance/:userId` - Get current balance
- `POST /api/honey/earn` - Add honey points (with validation)
- `POST /api/honey/spend` - Spend honey points (with validation)
- `GET /api/honey/transactions/:userId` - Get transaction history

### **SHOP SYSTEM:**
- `GET /api/shop/items` - Get available shop items
- `POST /api/shop/purchase` - Purchase item (validates balance)
- `GET /api/shop/inventory/:userId` - Get user's purchased items

### **ADMIN ENDPOINTS (PROTECTED):**
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users/:id` - Modify user (admin only)
- `POST /api/admin/gift` - Send gift to user (admin only)
- `POST /api/admin/timeout` - Timeout user (admin only)
- `POST /api/admin/ban` - Ban user (admin only)

## **DATABASE SCHEMA**

### **PostgreSQL Tables Required:**

#### **1. users Table:**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    current_role VARCHAR(50) DEFAULT 'Worker Bee',
    honey_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    ban_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_data JSONB DEFAULT '{}'
);
2. roles Table (91 Bee Roles):
sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    tier INTEGER NOT NULL,
    class VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB NOT NULL,
    perks JSONB NOT NULL,
    honey_multiplier DECIMAL(3,2) DEFAULT 1.0,
    unlock_cost INTEGER,
    is_selectable BOOLEAN DEFAULT true,
    is_seasonal BOOLEAN DEFAULT false,
    seasonal_start DATE,
    seasonal_end DATE
);
3. honey_transactions Table:
sql
CREATE TABLE honey_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    related_post_id INTEGER,
    related_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
4. user_roles Table (Many-to-Many):
sql
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (user_id, role_id)
);
#### **5. shop_purchases Table:**
```sql
CREATE TABLE shop_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    item_id VARCHAR(100) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    cost INTEGER NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    applied_at TIMESTAMP,
    data JSONB DEFAULT '{}'
);

## **TECHNOLOGY STACK**

### **BACKEND:**
- **Runtime:** Node.js 18.x (pinned in package.json)
- **Framework:** Express.js 4.18.2
- **Database:** PostgreSQL (DigitalOcean $15/month plan)
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **CORS:** cors middleware

### **FRONTEND:**
- **Core:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling:** CSS Grid, Flexbox, CSS Custom Properties
- **Fonts:** Google Fonts (Inter, Poppins, Source Code Pro)
- **Icons:** Font Awesome 6.4.0
- **Animations:** CSS Keyframes, JavaScript requestAnimationFrame

### **DEPLOYMENT:**
- **Hosting:** DigitalOcean App Platform
- **Build Command:** `npm install --production`
- **Run Command:** `npm start`
- **Configuration:** `digitalocean.app.yaml`
- **Node Version:** Explicitly set to 18.x in package.json

## **DEVELOPMENT WORKFLOW**

### **Local Development:**
```powershell
# 1. Start backend server
cd backend
npm start
# Server runs on http://localhost:8080

# 2. Test API endpoints
curl http://localhost:8080/api/test
# Should return: {"message":"API working"}

# 3. Check frontend
# Open browser to http://localhost:8080
## **PERFORMANCE REQUIREMENTS**

### **Load Times:**
- Initial page load: < 3 seconds
- API responses: < 500ms
- Image optimization: WebP format where possible
- JavaScript bundle: < 500KB minified
- CSS bundle: < 200KB minified

### **Browser Support:**
- **Chrome:** Latest 2 versions
- **Firefox:** Latest 2 versions
- **Safari:** Latest 2 versions
- **Edge:** Latest 2 versions
- **Mobile:** iOS Safari, Chrome for Android

## **TESTING REQUIREMENTS**

### **Must Work 100%:**
1. User registration and login
2. Post creation, editing, deletion
3. Like, comment, pollination system
4. Honey Points earning and spending
5. Shop item purchase and application
6. Profile customization saving
7. Admin panel all features
8. Real-time notifications
9. Responsive design on all devices

### **Data Persistence:**
- All data survives page refresh
- All data survives browser restart
- All data survives computer restart
- No data corruption
- Backup/restore functionality

## **KNOWN ISSUES & SOLUTIONS**

### **Issue 1: BOM in JSON files**
**Cause:** Windows PowerShell/editors adding Byte Order Mark  
**Solution:** Use Node.js to create JSON files:
```javascript
node -e "fs.writeFileSync('file.json', JSON.stringify(content, null, 2))"

## 🔧 MAINTENANCE SCHEDULE

### DAILY MONITORING
\\\yaml
Health Checks:
  - Time: 8:00 AM UTC
  - Check: API response times (< 200ms)
  - Check: Database connection pool (active connections < 80%)
  - Check: Error rate (< 0.1% of requests)
  - Check: Memory usage (< 70% of allocated)
  - Action: Send Slack alert if any threshold exceeded

Backup Verification:
  - Time: 2:00 AM UTC (off-peak)
  - Task: Verify database backups completed
  - Task: Test backup restore on staging
  - Task: Check backup file integrity
  - Action: Notify admin if backup fails
\\\

### WEEKLY TASKS (SUNDAY 2:00 AM UTC)
\\\yaml
Performance Review:
  - Analyze slowest 10 API endpoints
  - Review query execution plans
  - Optimize indexes if needed
  - Archive logs older than 30 days
  
Security Scan:
  - Update npm dependencies (security patches only)
  - Review access logs for anomalies
  - Rotate service tokens if applicable
  - Verify security headers
  
Data Maintenance:
  - Clean up expired sessions (> 30 days)
  - Archive deleted accounts (> 90 days)
  - Update statistics tables
  - Vacuum analyze PostgreSQL tables
\\\

### MONTHLY TASKS (FIRST SUNDAY 3:00 AM UTC)
\\\yaml
Comprehensive Backup:
  - Full database dump
  - File system backup (uploads, configs)
  - Verify off-site storage
  - Document recovery procedure
  
Capacity Planning:
  - Review user growth trends
  - Project storage needs (next 3 months)
  - Scale resources if > 80% utilization
  - Update capacity plan document
  
Code Quality:
  - Run full test suite with coverage
  - Update technical debt tracker
  - Review security audit findings
  - Document architectural decisions
\\\

### QUARTERLY TASKS (EVERY 3 MONTHS)
\\\yaml
Security Audit:
  - Penetration testing (staging environment)
  - Dependency vulnerability scan
  - OWASP Top 10 review
  - Update security protocols
  
Infrastructure Review:
  - Review DigitalOcean resource allocation
  - Optimize for cost/performance
  - Update deployment scripts
  - Test disaster recovery
  
Performance Optimization:
  - Load test with 2x current users
  - Review caching strategy
  - Optimize database schema
  - Update performance benchmarks
\\\

### ANNUAL TASKS
\\\yaml
Yearly Review:
  - Complete system architecture review
  - Update all documentation
  - Review and update SLAs
  - Plan for next year's roadmap
  
Compliance Check:
  - Review data retention policies
  - Update privacy policy if needed
  - Verify compliance with regulations
  - Update terms of service
\\\

### MAINTENANCE WINDOWS
- **Routine Maintenance**: Sundays 2:00-4:00 AM UTC (2-hour window)
- **Emergency Maintenance**: As needed with 30-minute notice
- **Planned Downtime**: First Sunday of month, 3:00-5:00 AM UTC
- **Zero Downtime Updates**: For critical security patches

### ALERTING & MONITORING
- **Critical**: Email + SMS (24/7)
- **High**: Email + Slack (business hours)
- **Medium**: Slack only
- **Low**: Dashboard notification only

### BACKUP RETENTION POLICY
- **Daily Backups**: 30 days
- **Weekly Backups**: 12 weeks  
- **Monthly Backups**: 13 months
- **Quarterly Backups**: 7 years
- **Annual Backups**: Permanent archive

### ESCALATION PROCEDURE
1. System detects issue → Auto-remediation attempts (5 minutes)
2. If persists → Alert Level 1 (On-call developer)
3. If unresolved in 15 mins → Alert Level 2 (Technical lead)
4. If service degraded → Alert Level 3 (CTO/Founder)
5. If outage > 30 mins → Customer notification process
