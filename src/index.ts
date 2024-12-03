import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import * as SocketClient from "socket.io-client";

const app = express();

app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {}
});

var server: string | undefined = undefined;
// let clients = [] as Socket[];

let clients = new Map<string, string>();
let relays = [] as string[];

var isMainServer = process.env.MAIN_SERVER == "TRUE";
var mainServer: SocketClient.Socket | undefined;

if (!isMainServer) {
    mainServer = SocketClient.io(process.env.MAIN_SERVER_URL || "https://signaling.noahhanford.com");

    mainServer.onAny((event, id, ...args) => {
        console.log("Recieved event", event, "for socket", id)
        io.to(id).emit(event, id, ...args);
    })
}

function recieveMessageToSocket(event: string, transmitterId: string, recieverId: string, ...message: any[]): void {
    if (!clients.has(recieverId)) {
        console.log("no client with id", recieverId);
        return;
    }
    io.to(clients.get(recieverId) as string).emit(event, recieverId, transmitterId, ...message);
}

io.on("connection", (socket) => {
    console.log(socket.id)

    if (!isMainServer) {
        socket.onAny((event, ...args) => {
            console.log(mainServer?.connected);
            console.log("Recieved event ", event, " from socket ", socket.id);
            mainServer?.emit(event, ...args);
        })

        return;
    }

    socket.on("join", (id, type) => {

        console.log(`Socket ${id} joining as ${type}`)

        if (!clients.has(id)) {
            clients.set(id, socket.id);
        }

        if (type == "Server") {
            server = id;
        } else if (type == "Client") {

            if (server) {
                socket.emit("initiateConnection", id, server)
            } else {
                socket.emit("upgradeToHost");
                console.log("hi");
            }
        }
    })

    socket.on("sessionDescriptionOffer", (id, socketId, ...message) => {
        recieveMessageToSocket("sessionDescriptionOffer", id, socketId, ...message);
    })

    socket.on("sessionDescriptionAnswer", (id, socketId, ...message) => {
        recieveMessageToSocket("sessionDescriptionAnswer", id, socketId, ...message);
    })

    socket.on("iceCandidate", (id, socketId, ...message) => {
        recieveMessageToSocket("iceCandidate", id, socketId, ...message);
    })

    socket.on("disconnect", (reason) => {
        if (server == socket.id) server == undefined;

        let clientsToDelete = [] as string[];

        clients.forEach((targetId, actualId) => {
            if (actualId == socket.id) {
                clientsToDelete.push(targetId);
                // this totally could cause problems for clients connected 
                // to the relay if the relay goes down
            }
        });
    })
});

app.get("/", (req, res) => {
    res.sendStatus(200);
})

const port = process.env.PORT || 8080;

httpServer.listen(port, () => {
    console.log(`app listening on port ${port}`);
});