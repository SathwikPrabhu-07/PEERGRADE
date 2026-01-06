# PeerGrade Connect Backend

Node.js + Express backend with Firebase (Firestore + Auth) for the PeerGrade Connect peer-to-peer learning platform.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore and Authentication enabled

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` with your Firebase credentials:

```env
# Firebase Configuration (from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-secure-random-string-at-least-32-characters
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate new private key**
5. Copy values to your `.env` file:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and `\n`)

### 4. Enable Firebase Services

In Firebase Console:
1. **Authentication** > Enable Email/Password provider
2. **Firestore Database** > Create database (start in test mode for development)

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server runs at `http://localhost:5000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (protected) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update profile (protected) |
| GET | `/api/users/:id/stats` | Get user statistics |
| GET | `/api/users/:id/credibility` | Get credibility score |

### Skills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | Get user's skills (protected) |
| POST | `/api/skills` | Add skill (protected) |
| DELETE | `/api/skills/:id` | Remove skill (protected) |

### Teachers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teachers` | List teachers (with filters) |
| GET | `/api/teachers/:id` | Get teacher details |

### Session Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/requests` | Get requests (protected) |
| POST | `/api/requests` | Send request (protected) |
| PUT | `/api/requests/:id/accept` | Accept request (protected) |
| PUT | `/api/requests/:id/reject` | Reject request (protected) |
| DELETE | `/api/requests/:id` | Cancel request (protected) |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | Get sessions (protected) |
| GET | `/api/sessions/:id` | Get session (protected) |
| POST | `/api/sessions/:id/complete` | Mark complete (protected) |
| GET | `/api/sessions/:id/join` | Get join info (protected) |
| POST | `/api/sessions/:id/feedback` | Submit feedback (protected) |

## Testing with curl

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"both"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user (use token from login)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Firestore Collections

The backend uses these Firestore collections:
- `users` - User profiles
- `userSkills` - User-skill relationships
- `requests` - Session requests
- `sessions` - Learning sessions
- `feedback` - Session ratings/reviews

## Project Structure

```
backend/
├── src/
│   ├── index.js              # Entry point
│   ├── config/
│   │   ├── env.js            # Environment config
│   │   └── firebase.js       # Firebase initialization
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   └── errorHandler.js   # Error handling
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic + Firestore
│   ├── routes/               # Route definitions
│   └── utils/
│       └── jwt.js            # JWT utilities
├── package.json
├── .env.example
└── README.md
```
