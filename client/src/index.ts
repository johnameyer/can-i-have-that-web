import { appendMessage, getEventsRegion } from "./dom-helpers";
import { UIDelegate } from "./ui-delegate";
import io from 'socket.io-client';

(window as any).initLogRocket && (window as any).initLogRocket();

document.addEventListener("DOMContentLoaded", async function(){
    const socket = io.connect();

    (window as any).socket = socket;
    
    // socket.on('connect', (obj: any) => console.error('connect', obj));
    // socket.on('connect_timeout', (obj: any) => console.error('connect_timeout', obj));
    // socket.on('connecting', (obj: any) => console.error('connecting', obj));
    // socket.on('reconnect_error', (obj: any) => console.error('reconnect_error', obj));

    socket.once('ready', () => {
        getEventsRegion().innerHTML = '';
        appendMessage('Connected to server');
        UIDelegate.enableMultiplayer();
    });

    socket.on('error', (obj: any) => {
        // console.error('error', obj);
        appendMessage('Error');
    });

    
    socket.on('connect_error', (obj: any) => {
        // console.error(obj);
        appendMessage('Failed to reach the server');
    });
    
    socket.connected = true; // THIS FIXES BUT IS INFURIATING

    // TODO add loop
    const singleplayer = (name: string) => {
        socket.disconnect();
        import("./singleplayer").then(({singleplayer}) => singleplayer(name));
    }

    const multiplayer = (name: string) => {
        import('./multiplayer').then(({multiplayer}) => multiplayer(socket)(name));
    }
    UIDelegate.setupLobby(singleplayer, multiplayer);
});