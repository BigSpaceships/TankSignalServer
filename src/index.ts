import express from "express";
import fileUpload from 'express-fileupload';
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import {promises as fsp} from "node:fs";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {});

const socketTypes = new Map<string, string>();
let serverId = "";
let clientId = "";

async function getOtherSocket(id: string) {
    const toCheck = clientId == id ? serverId : clientId;
    
    return (await io.fetchSockets()).find((socketToCheck) => socketToCheck.id == toCheck);
}

io.on("connection", (socket) => {
    console.log(socket.id)

    socket.on("test", (message) => {
        console.log(message)
        socket.broadcast.emit("test", message)
    })

    socket.on("type", (message) => {
        if (message == "Server") {
            serverId = socket.id;
        } else if (message == "Client") {
            clientId = socket.id;
            if (serverId != "") {
                console.log("start")
                socket.emit("initiateConnection")
            }
        }
        
        socketTypes.set(socket.id, message);

        let unityTypes = 0;
        
        for (let type of socketTypes.values()) {
            if (type == "unity") {
                unityTypes++;
            }
        }

        // console.log(unityTypes)

        if (unityTypes == 2) {
            socket.emit("join");
        }
    })

    socket.on("sessionDescription", async (...message) => {
        const otherSocket = await getOtherSocket(socket.id);

        if (otherSocket == undefined) return;

        console.log(otherSocket.id);
        otherSocket.emit("sessionDescription", ...message);
    })

    // socket.on("sessionDescription", (...message) => {
    //     console.log(...message)
    //     socket.broadcast.emit("sessionDescription", ...message);
    // })

    socket.onAny((event, ...args) => {
        if (event == "type") return;
        if (event == "sessionDescription") return;

        // console.log(...args)

        socket.broadcast.emit(event, ...args);
    }) 

    socket.on("disconnect", (reason) => {
        socketTypes.delete(socket.id);

        if (serverId == socket.id) serverId = "";
        if (clientId == socket.id) clientId = "";
    })
});
        
httpServer.listen(8080, () => {
    console.log("app listening on port 8080")
});