"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {}
});
var server = undefined;
let clients = [];
function findSocket(id) {
    if ((server === null || server === void 0 ? void 0 : server.id) == id)
        return server;
    return clients.find((socket) => {
        return socket.id == id;
    });
}
function recieveMessageToSocket(event, transmitterId, recieverId, ...message) {
    var _a;
    // console.log(...message)
    (_a = findSocket(recieverId)) === null || _a === void 0 ? void 0 : _a.emit(event, transmitterId, ...message);
}
io.on("connection", (socket) => {
    console.log(socket.id);
    socket.on("test", (message) => {
        console.log(message);
        socket.broadcast.emit("test", message);
    });
    socket.on("join", (type) => {
        console.log(`Socket ${socket.id} joining as ${type}`);
        if (type == "Server") {
            server = socket;
        }
        else if (type == "Client") {
            if (!clients.includes(socket)) {
                clients.push(socket);
            }
            if (server) {
                socket.emit("initiateConnection", server.id);
            }
        }
    });
    // socket.on("sessionDescription", async (...message) => {
    //     const otherSocket = await getOtherSocket(socket.id);
    //     if (otherSocket == undefined) return;
    //     console.log(otherSocket.id);
    //     otherSocket.emit("sessionDescription", ...message);
    // })
    socket.on("sessionDescriptionOffer", (socketId, ...message) => {
        recieveMessageToSocket("sessionDescriptionOffer", socket.id, socketId, ...message);
    });
    socket.on("sessionDescriptionAnswer", (socketId, ...message) => {
        recieveMessageToSocket("sessionDescriptionAnswer", socket.id, socketId, ...message);
    });
    socket.on("iceCandidate", (socketId, ...message) => {
        console.log(socketId, ...message);
        recieveMessageToSocket("iceCandidate", socket.id, socketId, ...message);
    });
    socket.onAny((event, ...args) => {
        if (event == "type")
            return;
        if (event == "sessionDescription")
            return;
        // console.log(...args)
        // socket.broadcast.emit(event, ...args);
    });
    socket.on("disconnect", (reason) => {
        if (server == socket)
            server == undefined;
        var clientsIndex = clients.indexOf(socket);
        if (clientsIndex == -1) {
            clients.splice(clientsIndex, 1);
        }
    });
});
httpServer.listen(8080, () => {
    console.log("app listening on port 8080");
});
