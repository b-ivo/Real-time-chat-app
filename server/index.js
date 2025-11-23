import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";

dotenv.config(); // ✅ Correct dotenv usage

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("set_username", (username) => {
    users[username] = socket.id;
    io.emit("users_list", Object.keys(users));
  });

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
    for (const [name, id] of Object.entries(users)) {
      if (id === socket.id) delete users[name];
    }
    io.emit("users_list", Object.keys(users));
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
