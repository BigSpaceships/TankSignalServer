import express from "express";
import fileUpload from 'express-fileupload';
import path from "path";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import {promises as fsp} from "node:fs";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {}
});

var server: Socket | undefined = undefined;
let clients = [] as Socket[];

function findSocket(id: string): Socket | undefined {
    if (server?.id == id) return server;

    return clients.find((socket) => {
        return socket.id == id;
    })
}

function recieveMessageToSocket(event: string, transmitterId: string, recieverId: string, ...message: any[]): void {
    // console.log(...message)
    findSocket(recieverId)?.emit(event, transmitterId, ...message);
}

io.on("connection", (socket) => {
    console.log(socket.id)

    socket.on("test", (message) => {
        console.log(message)
        socket.broadcast.emit("test", message)
    })

    socket.on("join", (type) => {

        if (type == "Server") {
            server = socket;
        } else if (type == "Client") {
            if (!clients.includes(socket)) {
                clients.push(socket); 
            }

            if (server) {
                socket.emit("initiateConnection", server.id)
            }
        }
    })

    // socket.on("sessionDescription", async (...message) => {
    //     const otherSocket = await getOtherSocket(socket.id);

    //     if (otherSocket == undefined) return;

    //     console.log(otherSocket.id);
    //     otherSocket.emit("sessionDescription", ...message);
    // })

    socket.on("sessionDescriptionOffer", (socketId, ...message) => {
        recieveMessageToSocket("sessionDescriptionOffer", socket.id, socketId, ...message);
    })

    socket.on("sessionDescriptionAnswer", (socketId, ...message) => {
        recieveMessageToSocket("sessionDescriptionAnswer", socket.id, socketId, ...message);
    })

    socket.on("iceCandidate", (socketId, ...message) => {
        console.log(socketId, ...message);
        recieveMessageToSocket("iceCandidate", socket.id, socketId, ...message);
    })

    socket.onAny((event, ...args) => {
        if (event == "type") return;
        if (event == "sessionDescription") return;

        // console.log(...args)

        // socket.broadcast.emit(event, ...args);
    }) 

    socket.on("disconnect", (reason) => {
        if (server == socket) server == undefined;

        var clientsIndex = clients.indexOf(socket);

        if (clientsIndex == -1) {
            clients.splice(clientsIndex, 1);
        }
    })
});
        
httpServer.listen(8080, () => {
    console.log("app listening on port 8080")
});