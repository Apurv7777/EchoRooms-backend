import { WebSocket, WebSocketServer } from "ws";
import { TranslationService } from "./services/TranslationService.js";

const wss = new WebSocketServer({port:8080});

interface User {
    socket:WebSocket;
    room:string;
    name:string;
}

let allSockets:User[] = []

wss.on("connection",(socket)=>{

    socket.on("message", async (message)=>{
        // @ts-ignore
        const parsedMessage = JSON.parse(message);
        
        if(parsedMessage.type==='join'){
            const userName = parsedMessage.payload.name || "Unknown";
            const roomId = parsedMessage.payload.roomId;
            
            // Remove any existing connection from this same socket (user reconnecting)
            // Also remove any user with same name in the same room (prevent duplicates)
            allSockets = allSockets.filter(user => 
                user.socket !== socket && 
                !(user.room === roomId && user.name === userName)
            );
            
            allSockets.push({
                socket, 
                room: roomId,
                name: userName
            });

            // Send complete user lists to ALL users in the room
            // Each user sees all users including themselves
            for(let i = 0; i < allSockets.length; i++){
                if(allSockets[i].room === roomId){
                    const allUsers = allSockets
                        .filter(user => user.room === roomId)
                        .map(user => user.name);
                    
                    allSockets[i].socket.send(JSON.stringify({
                        type: 'users',
                        users: allUsers,
                        currentUser: allSockets[i].name
                    }));
                }
            }
        }
        if(parsedMessage.type==='requestUsers'){
            const currentUser = allSockets.find(x=>x.socket===socket);
            if (!currentUser) return;
            const roomId = currentUser.room;
            
            // Send user list to the requesting user
            const allUsers = allSockets
                .filter(user => user.room === roomId)
                .map(user => user.name);
            
            socket.send(JSON.stringify({
                type: 'users',
                users: allUsers,
                currentUser: currentUser.name
            }));
        }
        if(parsedMessage.type==='translate'){
            try {
                const { text, targetLanguage, messageId } = parsedMessage.payload;
                
                if (!text || !targetLanguage) {
                    socket.send(JSON.stringify({
                        type: 'translationError',
                        error: 'Missing text or target language',
                        messageId
                    }));
                    return;
                }

                const result = await TranslationService.translateText(text, targetLanguage);
                
                socket.send(JSON.stringify({
                    type: 'translationResult',
                    messageId,
                    originalText: text,
                    translatedText: result.translatedText,
                    detectedLanguage: result.detectedLanguage,
                    targetLanguage: result.targetLanguage
                }));
                
            } catch (error) {
                socket.send(JSON.stringify({
                    type: 'translationError',
                    error: 'Translation failed',
                    messageId: parsedMessage.payload?.messageId
                }));
            }
        }
        if(parsedMessage.type==='detectLanguage'){
            try {
                const { text, messageId } = parsedMessage.payload;
                
                const detectedLanguage = await TranslationService.detectLanguage(text);
                
                socket.send(JSON.stringify({
                    type: 'languageDetected',
                    messageId,
                    detectedLanguage,
                    languageName: TranslationService.getLanguageName(detectedLanguage)
                }));
                
            } catch (error) {
                socket.send(JSON.stringify({
                    type: 'languageDetectionError',
                    error: 'Language detection failed',
                    messageId: parsedMessage.payload?.messageId
                }));
            }
        }
        if(parsedMessage.type==='chat'){
            const currentUser = allSockets.find(x=>x.socket===socket);
            if (!currentUser) return;
            const currentUserRoom = currentUser.room;
            const name = parsedMessage.payload.name || currentUser.name || "Unknown";
            const message = parsedMessage.payload.message;
            
            // Detect language of the message
            let detectedLanguage = 'unknown';
            try {
                detectedLanguage = await TranslationService.detectLanguage(message);
            } catch (error) {
                console.error('Language detection failed:', error);
            }
            
            const msgObj = { 
                type: 'chat',
                name, 
                message,
                detectedLanguage
            };
            
            for(let i=0; i<allSockets.length; i++){
                if(allSockets[i].room === currentUserRoom){
                    allSockets[i].socket.send(JSON.stringify(msgObj));
                }
            }
        }
    })

    socket.on('close', () => {
        const disconnectedUser = allSockets.find(user => user.socket === socket);
        if (disconnectedUser) {
            const roomId = disconnectedUser.room;
            const userName = disconnectedUser.name;
            
            // Remove user from the list
            allSockets = allSockets.filter(user => user.socket !== socket);
            
            // Check if room is now empty
            const remainingUsersInRoom = allSockets.filter(user => user.room === roomId);
            
            if (remainingUsersInRoom.length !== 0) {
                // Room is empty, no need to send user updates
                // Send complete user lists to all remaining users in the room
                // Each user sees all users including themselves
                for(let i = 0; i < allSockets.length; i++){
                    if(allSockets[i].room === roomId){
                        const allUsers = allSockets
                            .filter(user => user.room === roomId)
                            .map(user => user.name);
                        
                        allSockets[i].socket.send(JSON.stringify({
                            type: 'users',
                            users: allUsers,
                            currentUser: allSockets[i].name
                        }));
                    }
                }
            }
        }
    });
})
