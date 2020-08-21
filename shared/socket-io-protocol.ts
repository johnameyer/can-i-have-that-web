import { Protocol } from './protocol';
import { EventType } from './event-types';
import { Socket } from 'socket.io';

export class SocketIOProtocol<T extends string = string> implements Protocol<T> {
    constructor(public socket: Socket) {
    }

    async send(channel: T, ...data: any[]) {
        return await new Promise<void>((resolve, reject) => {
            if(!this.socket.connected) {
                reject();
                return;
            }
            this.socket.emit(channel, ...data);
            resolve();
        });
    }


    async sendAndReceive(channel: T, ...data: any[]) {
        return await new Promise<any[]>((resolve, reject) => {
            if(!this.socket.connected) {
                reject();
                return;
            }
            this.socket.once('disconnect', reject);
            this.socket.emit(channel, ...data);
            this.socket.once(channel, (...data) => {
                this.socket.removeListener('disconnect', reject);
                resolve(data);
            });
        });
    }
}