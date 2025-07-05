import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({port:8080});

interface User {
    socket:WebSocket;
    room:string;
    name:string;
}

let allSockets:User[] = []

wss.on("connection",(socket)=>{

    socket.on("message",(message)=>{
        // @ts-ignore
        const parsedMessage = JSON.parse(message);
        if(parsedMessage.type==='join'){
            allSockets.push({
                socket, 
                room:parsedMessage.payload.roomId,
                name:parsedMessage.payload.name || "Unknown"
            })
        }
        if(parsedMessage.type==='chat'){
            const currentUser = allSockets.find(x=>x.socket===socket);
            if (!currentUser) return;
            const currentUserRoom = currentUser.room;
            const name = parsedMessage.payload.name || currentUser.name || "Unknown";
            const msgObj = { name, message: parsedMessage.payload.message };
            for(let i=0; i<allSockets.length; i++){
                if(allSockets[i].room === currentUserRoom){
                    allSockets[i].socket.send(JSON.stringify(msgObj));
                }
            }
        }
    })

    socket.on('close', () => {
        allSockets = allSockets.filter(user => user.socket !== socket);
    });
})
