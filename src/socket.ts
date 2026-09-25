import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server;

export const initializeSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin:
                process.env.CLIENT_URL ||
                "http://localhost:3000",

            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log(
            "Socket connected:",
            socket.id
        );

        // User joins his private room
        socket.on("join", (userId: string) => {
            const room = `user:${userId}`;

            socket.join(room);

            console.log(
                `User ${userId} joined room ${room}`
            );
        });

        socket.on("disconnect", () => {
            console.log(
                "Socket disconnected:",
                socket.id
            );
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error(
            "Socket.IO has not been initialized"
        );
    }

    return io;
};