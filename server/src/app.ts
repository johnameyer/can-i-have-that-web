console.log('Server is starting up');

import { SessionDecoupler } from "./shared/session-decoupler";
import { SocketIOProtocol } from './shared/socket-io-protocol';
import { Socket } from "socket.io";
import { GameDriver, defaultParams, Intermediary, IntermediaryHandler, ProtocolIntermediary } from "can-i-have-that"
import { Protocol } from "./shared/protocol";

const path = require('path');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const port = process.argv[2] || 8084;
const base = process.env.BASE_URL || '/';

if(base !== '/') {
    app.get('/', (req: any, res: any) => {
        res.redirect(base);
    });
}

server.listen(port, '0.0.0.0');

app.get(base, (req: any, res: any) => {
    res.sendFile(path.resolve(__dirname + '/../../client/dist/index.html'));
});

app.use(base, express.static(path.join(__dirname, '/../../client/dist/')));

console.log('Base at', base);
console.log('Listening on port', port);

let free = 1;
const lobby: {[code: string]: [string, SessionDecoupler][]} = {};
const socketForUser: {[username: string]: Socket} = {};
const sessionForUser: {[username: string]: SessionDecoupler} = {};

io.use((socket: Socket, next: (error?: Error) => void) => {
    let { username } = socket.handshake.query;
    if (username && !socketForUser[username]) {
        return next();
    }
    return next(new Error('Invalid Username'));
});

io.on('connection', (socket: Socket) => {
    let { username } = socket.handshake.query;
    socketForUser[username] = socket;
    if(sessionForUser[username]) {
        console.log(username, 'rejoined');
    } else {
        console.log('New connection for', username);
    }

    socket.once('multiplayer', async (name: string) => {
        if(sessionForUser[username]) {
            sessionForUser[username].setProtocol(new SocketIOProtocol(socket));
        } else {
            socket.emit('multiplayer/options', Object.entries(lobby).map(([key, members]) => [key, members.length]));
            
            const protocol = new SessionDecoupler();
            protocol.setProtocol(new SocketIOProtocol(socket));
            sessionForUser[username] = protocol;

            let selected: null | string;

            socket.once('multiplayer/join', (key) => {
                selected = key;
                if(selected) {
                    lobby[selected].push([name, protocol]);

                    socket.once('disconnect', () => {
                        if(selected && lobby[selected]) {
                            console.log('Player', name, socket.id, 'disconnected from room', selected);
                            lobby[selected].splice(lobby[selected].findIndex((tuple) => tuple[1] === protocol));
                        }
                    });
                } else {
                    socket.emit('multiplayer/options', Object.entries(lobby).map(([key, members]) => [key, members.length]));
                }
            });
        
            socket.once('multiplayer/open', () => {
                const room: [string, SessionDecoupler][] = [];
                room.push([name, protocol]);
                const key = String(free++);
                lobby[key] = room;

                socket.once('multiplayer/begin', () => {
                    console.log('Starting multiplayer session for room', key);

                    delete lobby[key];
                    try {
                        const driver = new GameDriver(room.map(([name, protocol]) => {
                            const handler = new IntermediaryHandler(new ProtocolIntermediary(protocol as any));
                            handler.setName(name);
                            return handler;
                        }), defaultParams);
                        driver.start();
                    } catch (e) {
                        console.error(e);
                    }
                });

                socket.once('disconnect', () => {
                    console.log('Closing room', key);
                    if(lobby[key]) {
                        delete lobby[key];
                    }
                    let item: [string, Protocol] | undefined = undefined;
                    while(item = room.pop()) {
                        console.log('Kicked', item[0], item[1], 'from', key)
                        item[1].send('multiplayer/kicked');
                    }
                });
            });
        }
    });


    socket.emit('ready', true);
    // io.emit('this', { will: 'be received by everyone'});

    // socket.on('private message', (from: any, msg: any) => {
    //   console.log('I received a private message by ', from, ' saying ', msg);
    // });

    socket.on('disconnect', () => {
        console.log('Disconnected user ' + username);
        
        if(sessionForUser[username]) {
            sessionForUser[username].clearProtocol();
        }
        delete socketForUser[username];
    });
});
