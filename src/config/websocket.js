import { Server as SocketServer } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const httpServer = http.createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const userSocketMap = {};
io.on("connect", (socket) => {
  console.log("UserId connect: ", socket.handshake.query.userId);
  const userId = socket.handshake.query.userId;
  if (userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }
  socket.on("disconnect", () => {
    console.log("user disconnected");
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});
export const getReceiveSocketId = (userId) => {
  return userSocketMap[userId];
};

export { app, httpServer, io };
