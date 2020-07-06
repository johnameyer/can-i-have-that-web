console.log('Server is starting up');

import { WebsocketHandler } from "./websocket-handler";
import { Socket } from "socket.io";
import { GameDriver, defaultParams } from "can-i-have-that"

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

console.log('Listening on port', port);

let free = 1;
const lobby: {[code: string]: [string, any][]} = {};

io.on('connection', (socket: Socket) => {
  console.log('New connection');

  socket.once('multiplayer', async (name: string) => {
    socket.emit('multiplayer/options', Object.entries(lobby).map(([key, members]) => [key, members.length]));

    let selected: null | string;

    socket.once('multiplayer/join', (key) => {
      selected = key;
      if(selected) {
        lobby[selected].push([name, socket]);

        socket.once('disconnect', () => {
          if(selected && lobby[selected]) {
            console.log('Player', name, socket.id, 'disconnected from room', selected);
            lobby[selected].splice(lobby[selected].findIndex((tuple) => tuple[1] === socket));
          }
        });
      } else {
        socket.emit('multiplayer/options', Object.entries(lobby).map(([key, members]) => [key, members.length]));
      }
    });
    
    socket.once('multiplayer/open', () => {
      const room: [string, Socket][] = [];
      room.push([name, socket]);
      const key = String(free++);
      lobby[key] = room;

      socket.once('multiplayer/begin', () => {
        console.log('Starting multiplayer session for room', key);
        const handler = new WebsocketHandler(name);
        handler.setSocket(socket);

        delete lobby[key];

        const driver = new GameDriver(room.map(([name, socket]) => { const handler = new WebsocketHandler(name); handler.setSocket(socket); return handler; } ), defaultParams);
        driver.start();
      });

      socket.once('disconnect', () => {
        console.log('Closing room', key);
        if(lobby[key]) {
          delete lobby[key];
        }
        let item: [string, Socket] | undefined = undefined;
        while(item = room.pop()) {
          console.log('Kicked', item[0], item[1].id, 'from', key)
          item[1].emit('multiplayer/kicked');
        }
      });
    });
  });


  socket.emit('ready', true);
  // io.emit('this', { will: 'be received by everyone'});

  // socket.on('private message', (from: any, msg: any) => {
  //   console.log('I received a private message by ', from, ' saying ', msg);
  // });

  socket.on('disconnect', () => {
    console.log('Disconnected user ' + socket.id);
  });
});
