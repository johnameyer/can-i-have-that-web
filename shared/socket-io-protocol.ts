import { Protocol } from './protocol';
import { Socket } from 'socket.io';
import { Observable, Subject, Observer, TeardownLogic } from 'rxjs';

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

    receiveAll(channel: T) {
        return Observable.create((observer: Observer<any[]>) => {
            const subscriber = (data: any[]) => observer.next(data);
            this.socket.on(channel, subscriber);
            const error = () => observer.error(new Error('Disconnected'));
            this.socket.on('disconnect', error);
            return {
                unsubscribe: () => {
                    this.socket.removeListener(channel, subscriber);
                }
            } as TeardownLogic;
        });
    }
}