import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from './generated/prisma'; // Adjusted path
import authRoutes from './routes/auth.routes'; // Import the auth routes
import gameRoutes from './routes/game.routes'; // Import the game routes
import anonymousRoutes from './routes/anonymous.routes'; // Import the anonymous routes
import bugReportsRoutes from './api/bug-reports'; // Import the bug reports routes
import adminRoutes from './api/admin'; // Import the admin routes
import { socketAuthMiddleware, setupGameSocketHandlers, AuthenticatedSocket } from './socket/game.socket';
import GameEventsService from './services/game-events.service';
import { BugReportingService } from './services/bug-reporting.service';
import { MaintenanceService } from './services/maintenance.service';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Default to localhost:3000 if not set
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser()); // Phase 1: Enable cookie parsing for session management
app.use(express.urlencoded({ extended: true }));

// Mount the authentication routes
app.use('/api/auth', authRoutes);

// Mount the game routes
app.use('/api/games', gameRoutes);

// Mount the anonymous routes
app.use('/api/anonymous', anonymousRoutes);

// Mount the bug reports routes
app.use('/api/bug-reports', bugReportsRoutes);

// Mount the admin routes
app.use('/api/admin', adminRoutes);

// Serve static files (for built client)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve client build directory if it exists (production)
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Gambit Chess server is running.',
    timestamp: new Date().toISOString(),
  });
});

// Serve admin panel
app.get('/admin', (req, res) => {
  const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
  res.sendFile(adminPath, (err) => {
    if (err) {
      console.error('Error serving admin panel:', err);
      res.status(500).send('Admin panel not available');
    }
  });
});

// Handle client routing - serve index.html for any non-API routes
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip API routes and socket.io
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return next();
  }
  
  // For non-API routes, serve our placeholder loading page
  // In production, this would serve the built React app
  const placeholderPath = path.join(__dirname, '..', 'public', 'index.html');
  res.sendFile(placeholderPath, (err) => {
    if (err) {
      console.error('Error serving placeholder:', err);
      res.status(500).send('Server Error');
    }
  });
});

// Socket.IO configuration
io.use(socketAuthMiddleware);

io.on('connection', (socket: AuthenticatedSocket) => {
  const userId = socket.user?.userId || socket.anonymousSession?.sessionId;
  console.log(`User connected: ${userId} (${socket.id})`);

  // Set up game-related event handlers
  setupGameSocketHandlers(io, socket);

  // Basic ping/pong for connection testing
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId} (${socket.id})`);
  });
});

// Start server
const startServer = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log('Successfully connected to the database.');

    // Initialize the game events service
    GameEventsService.initialize(io);
    
    // Initialize the bug reporting service
    await BugReportingService.initialize();
    
    // Initialize maintenance services
    MaintenanceService.initialize();

    server.listen(PORT, () => {
      console.log(`\n🚀 Gambit Chess Server Started`);
      console.log(`📡 Server listening on port ${PORT}`);
      console.log(`🔌 WebSocket server attached`);
      console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
      console.log(`💾 Database connected`);
      console.log(`🎮 Game Events Service initialized`);
      console.log(`🔧 Maintenance Service initialized`);
      console.log(`\n📋 Available Endpoints:`);
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`   Auth API: http://localhost:${PORT}/api/auth/*`);
      console.log(`   Games API: http://localhost:${PORT}/api/games/*`);
      console.log(`   Bug Reports API: http://localhost:${PORT}/api/bug-reports/*`);
      console.log(`   WebSocket: ws://localhost:${PORT}/socket.io/\n`);
    });
  } catch (error) {
    console.error('Failed to connect to the database or start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();

export { app, server, io, prisma }; 