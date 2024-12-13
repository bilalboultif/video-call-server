
const express = require('express');
const http = require('http'); // Use http module instead of https
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');  // Import uuid
const app = express();
app.set("view engine", "ejs");



// Enable CORS for all routes
app.use(cors({
    origin: ['https://localhost', 'https://my-node-backend-fcdy.onrender.com', 'https://family-tracker-dun.vercel.app'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
    credentials: true
}));

// Enable Helmet and disable its default CSP header
app.use(helmet({
    contentSecurityPolicy: false  // Disable CSP if you're setting your own header
}));

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', [
        "default-src 'self';",  // Allow resources to be loaded from the same origin (self)
        "script-src 'self' 'unsafe-inline' https://kit.fontawesome.com https://cdn.jsdelivr.net https://cdn.socket.io https://unpkg.com;",
        "style-src 'self' 'unsafe-inline' https://kit.fontawesome.com https://fonts.googleapis.com;",
        "connect-src 'self' wss://my-node-backend-fcdy.onrender.com;",  // Allow WebSocket connections
        "img-src 'self' https://my-node-backend-fcdy.onrender.com;",  // Allow images from your own backend
        "font-src 'self' https://kit.fontawesome.com https://fonts.gstatic.com;",
        "object-src 'none';",  // Disable object sources
        "upgrade-insecure-requests;"  // Force loading over HTTPS
    ].join(' '));  // Joining the directives as a single string with spaces in between
    next();
});




app.use(helmet({
    contentSecurityPolicy: false  // Disable CSP if you're setting your own header
}));

const server = http.createServer(app);  // Use http.createServer instead of https.createServer

// Setting up socket.io for HTTP
const io = socketIo(server, {
    cors: {
        origin: ['https://location-five-psi.vercel.app','https://my-node-backend-fcdy.onrender.com','https://family-tracker-dun.vercel.app', 'http://localhost:3000','http://127.0.0.1:5501', 'http://127.0.0.1:5502', 'https://172.23.249.39:5000', 'http://127.0.0.1:5500', 'http://localhost:10000'],  // List of allowed origins
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,  // Allow cookies and credentials
    },
    pingInterval: 30000,  // Ping every 25 seconds
    pingTimeout: 10000,    // Timeout after 10 seconds if no ping response
});



const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
}

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

// server.js (or wherever you're handling routing)
app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
  });



io.on('connection', (socket) => {
    console.log('Socket ID:', socket.id);
    console.log('Rooms:', socket.rooms);  // This will show which rooms the socket is part of


  // User joins a room
  socket.on("join-room", (roomId, userId, userName) => {
    // Ensure the client joins the room
    socket.join(roomId);
    console.log(`${userName} joined room ${roomId}`);

    // Immediately broadcast user-connected event after joining the room
    if (socket.rooms.has(roomId)) {
        // Send to all clients in the room except the sender
        socket.broadcast.to(roomId).emit("user-connected", userId);
        console.log(`User ${userId} connected to room ${roomId}`);
    } else {
        console.log(`Socket not in room ${roomId} when trying to broadcast user-connected.`);
    }

    // Handle messaging
    socket.on("message", (message) => {
        io.to(roomId).emit("createMessage", message, userName);
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
        socket.broadcast.to(roomId).emit("user-disconnected", userId);
        console.log(`User ${userId} disconnected from room ${roomId}`);
    });
});


});






// Start the HTTP server
const PORT = process.env.PORT || 443;  // Default to 443 for local dev or fallback
server.listen(PORT, () => {
  console.log(`Server running on https://my-node-backend-fcdy.onrender.com`);
});