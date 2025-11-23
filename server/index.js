import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import http from "http";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const users = {}; // username -> socket.id

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Set username
  socket.on("set_username", (username) => {
    // sets the user with the unique id
    users[username] = socket.id;
    io.emit("users_list", Object.keys(users)); // send updated list to all clients
  });

  // Private message
  socket.on("private_message", ({ to, message }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit("receive_message", {
        from: Object.keys(users).find((key) => users[key] === socket.id),
        message,
      });
    }
  });

  socket.on("disconnect", () => {
    // Remove disconnected user
    for (const [name, id] of Object.entries(users)) {
      if (id === socket.id) delete users[name];
    }
    io.emit("users_list", Object.keys(users)); // update list for everyone
  });
});

server.listen(3001, () => {
  console.log("Server running");
});
