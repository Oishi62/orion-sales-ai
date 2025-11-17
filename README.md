
```

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd <folder-name>

# Install all dependencies (root, backend, and frontend)
npm run install-deps
```

### 2. Environment Configuration

#### Backend Environment
Copy `backend/env.example` to `backend/.env` and configure:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment
Copy `frontend/env.example` to `frontend/.env` and configure:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Environment
REACT_APP_ENV=development
```

### 3. Database Setup

Make sure MongoDB is running and accessible via your connection string. The application will automatically create the necessary collections on first run.

## 🚀 Running the Application

### Development Mode
```bash
# Run both frontend and backend concurrently
npm run dev

# Or run them separately:
npm run server    # Backend only (port 5000)
npm run client    # Frontend only (port 3000)
```

### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

The application will be available at:
- **Development**: Frontend at `http://localhost:3000`, Backend at `http://localhost:5000`
- **Production**: Single port at `http://localhost:5000`
