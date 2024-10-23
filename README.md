# TankSignalServer

A signaling server I developed for use with WebRTC in my [multiplayer tanks game](https://github.com/BigSpaceships/Tanks). 

A docker image for the server is avaiable at `ghcr.io/bigspaceships/signaling:latest`

## future plans
- Supporting multiple games at once, probably using rooms in socketio
- Potentially switch to using [distributed authority](https://docs-multiplayer.unity3d.com/netcode/current/terms-concepts/distributed-authority/) or implement host migration
- Configuration on join with [query](https://socket.io/docs/v4/client-options/#query) parameters 