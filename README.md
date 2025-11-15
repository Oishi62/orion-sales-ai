# Sales AI - Neo-Tech Noir Sales Platform

A modern, AI-powered sales automation platform built with React, Express, Node.js, and MongoDB. Features a stunning Neo-Tech Noir design with dark backgrounds, neon cyan and violet gradients, and futuristic typography.

## 🚀 Features

- **Neo-Tech Noir Theme**: Dark, futuristic design with neon accents
- **User Authentication**: Secure signup/signin with JWT tokens
- **Responsive Design**: Mobile-first, fully responsive interface
- **Modern Tech Stack**: React 18, Express, MongoDB, Styled Components
- **Single Port Deployment**: Frontend and backend served from one port
- **Real-time Notifications**: Toast notifications for user feedback
- **Form Validation**: Comprehensive client and server-side validation
- **Security**: Helmet, CORS, rate limiting, and password hashing

## 🎨 Design System

### Colors
- **Primary Background**: `#0A0A0A` (near-black)
- **Highlight Color**: `#00F6FF` (neon cyan)
- **Secondary Accent**: `#8A2BE2` (violet)
- **Text Colors**: White and silver variations

### Typography
- **Primary Font**: Rajdhani (clean, modern)
- **Accent Font**: Orbitron (futuristic, tech-inspired)

## 📁 Project Structure

```
salesai/
├── backend/                 # Express.js backend
│   ├── controllers/         # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   ├── server.js           # Server entry point
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # Global styles
│   │   └── App.js          # Main app component
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json
└── README.md              # This file
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
cd salesai

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

## 🔐 Authentication

The application includes a complete authentication system:

### Features
- User registration with validation
- Secure login with JWT tokens
- Password strength indicators
- Protected routes
- Automatic token refresh
- Session management

### API Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - User logout

## 🎯 Usage

### Getting Started
1. Visit the landing page to learn about features
2. Click "Get Started" to create an account
3. Fill out the registration form with your details
4. Sign in with your credentials
5. Access the dashboard to view your sales data

### User Roles
- **User**: Standard access to personal dashboard
- **Sales Rep**: Access to lead management
- **Sales Manager**: Team management features
- **Admin**: Full system access

## 🔧 Development

### Available Scripts

```bash
# Root level
npm run dev          # Run both frontend and backend
npm run server       # Run backend only
npm run client       # Run frontend only
npm run build        # Build frontend for production
npm start           # Start production server
npm run install-deps # Install all dependencies

# Backend specific
cd backend
npm run dev         # Run with nodemon
npm start          # Run production server

# Frontend specific
cd frontend
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
```

### Code Structure

#### Backend
- **Models**: MongoDB schemas with Mongoose
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data processing
- **Routes**: API endpoint definitions
- **Utils**: Helper functions and middleware

#### Frontend
- **Components**: Reusable UI components
- **Pages**: Full page components
- **Contexts**: React context for state management
- **Services**: API communication layer
- **Styles**: Global CSS and theme definitions

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent brute force attacks
- **CORS Protection**: Configured for security
- **Helmet**: Security headers
- **Input Validation**: Server and client-side validation
- **XSS Protection**: Sanitized inputs and outputs
- **Data Sanitization**: Prevents sensitive data from appearing in logs
- **Secure Logging**: Automatic redaction of passwords and tokens
- **Dev Tools Warning**: Security warnings in browser console
- **HTTPS Required**: All production deployments should use HTTPS

## 🎨 Customization

### Theme Customization
The Neo-Tech Noir theme can be customized by modifying CSS variables in `frontend/src/styles/index.css`:

```css
:root {
  --primary-bg: #0A0A0A;
  --accent-cyan: #00F6FF;
  --accent-violet: #8A2BE2;
  /* ... other variables */
}
```

### Adding New Features
1. Create backend routes in `backend/routes/`
2. Add corresponding controllers in `backend/controllers/`
3. Create frontend services in `frontend/src/services/`
4. Build UI components in `frontend/src/components/`
5. Add pages in `frontend/src/pages/`

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: > 768px

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Set the following in production:
- `NODE_ENV=production`
- `MONGODB_URI=your-production-db-url`
- `JWT_SECRET=your-production-secret`
- `PORT=5000` (or your preferred port)

### Single Port Deployment
The application is configured to serve both frontend and backend from a single port in production, making deployment simpler.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**Built with ❤️ using React, Express, and MongoDB**
