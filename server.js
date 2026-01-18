const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity; restrict in production
        methods: ['GET', 'POST']
    }
});

// Serve static files (game files) from the root directory
app.use(express.static(__dirname));

// Log all static file requests
app.use((req, res, next) => {
    console.log(`Static file requested: ${req.url}`);
    next();
});

// Add a fallback route to serve index.html for the root path
app.get('/', (req, res) => {
    console.log('Serving index.html from:', __dirname + '/index.html');
    res.sendFile(__dirname + '/index.html');
});

// Add CORS headers to all responses
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Store player data
let players = {};

// Throttle broadcast updates to reduce server load
const BROADCAST_INTERVAL = 100; // Broadcast every 100ms
let lastBroadcast = Date.now();

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Add new player
    players[socket.id] = { x: 0, y: 0, score: 0 };

    // Send initial player data to the new connection
    socket.emit('updatePlayers', players);

    // Handle player movement
    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id] = { ...players[socket.id], ...data };
        }

        // Throttle broadcasts
        const now = Date.now();
        if (now - lastBroadcast > BROADCAST_INTERVAL) {
            io.emit('updatePlayers', players);
            lastBroadcast = now;
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

// Start the server
const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});