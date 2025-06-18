import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({port:8080});

interface User {
    socket:WebSocket;
    room:string;
}

let allSockets:User[] = []

wss.on("connection",(socket)=>{

    socket.on("message",(message)=>{
        // @ts-ignore
        const parsedMessage = JSON.parse(message);
        if(parsedMessage.type==='join'){
            allSockets.push({
                socket, 
                room:parsedMessage.payload.roomId
            })
        }
        if(parsedMessage.type==='chat'){
            const currentUserRoom = allSockets.find(x=>x.socket===socket).room;
            
            for(let i=0; i<allSockets.length; i++){
                if(allSockets[i].room === currentUserRoom){
                    allSockets[i].socket.send(parsedMessage.payload.message);
                }
            }
        }
    })

    socket.on('close', () => {
        allSockets = allSockets.filter(user => user.socket !== socket);
    });
})

//-----------------------------------------------------------------------------------------------------------

// import { WebSocket, WebSocketServer } from "ws";

// const wss = new WebSocketServer({port:8080});

// let userCount = 0;
// let allSockets:WebSocket[] = []

// wss.on("connection",(socket)=>{
//     allSockets.push(socket);
//     userCount=userCount+1;
//     console.log(`User #${userCount} connected`);
//     socket.on("message",(message)=>{
//         console.log('Message received: ', message.toString());

//         // setTimeout(()=>{
//         //     socket.send(message.toString() + ': From server.');
//         // },1000);

//         // For creating broadcasting network
//         for(let i=0; i<allSockets.length; i++){
//             allSockets[i].send(message.toString() + ': From server.');
//         }
//     })
//     socket.on('close',()=>{
//         allSockets = allSockets.filter(x => x !== socket);
//     })
// })