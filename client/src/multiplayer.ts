
import { appendMessage } from './dom-helpers';
import io from 'socket.io-client';
import { SocketListener } from './socket-listener';
import { WebIntermediary } from './web-intermediary';
import { WebPresenter } from './web-presenter';
import { UIDelegate } from './ui-delegate';

export function multiplayer(username: string, name: string, host?: string) {
    // @ts-ignore
    const socket = io.connect(host, {
        query: {
            username
        }
    });

    (window as any).socket = socket;
    
    // socket.on('connect', (obj: any) => console.error('connect', obj));
    // socket.on('connect_timeout', (obj: any) => console.error('connect_timeout', obj));
    // socket.on('connecting', (obj: any) => console.error('connecting', obj));
    // socket.on('reconnect_error', (obj: any) => console.error('reconnect_error', obj));

    socket.once('connect', () => {
        appendMessage('Connected to server');

        socket.on('error', () => {
            // console.error('error', obj);
            appendMessage('Error');
        });

        
        socket.on('connect_error', () => {
            // console.error(obj);
            appendMessage('Failed to reach the server');
        });
        
        socket.emit('multiplayer', name);
        socket.on('multiplayer/options', (roomOptions: [string, number][]) => {
            const open = () => socket.emit('multiplayer/open');
            const begin = () => socket.emit('multiplayer/begin');

            const join = (room: string) => socket.emit('multiplayer/join', room);

            UIDelegate.listMultiplayerOptions(roomOptions, open, join, begin);
        });

        socket.on('multiplayer/kicked', function () {
            appendMessage('You were kicked from the game');
        });

        new SocketListener(socket, new WebIntermediary(new WebPresenter()));
    });
};