import { Protocol } from './protocol';

// might have to revisit this whole class in the future for atomicity
export class SessionDecoupler<T extends string = string> implements Protocol<T> {
    protocol: Protocol<T> | undefined;
    resolver!: ((newProtocol: Protocol<T>) => void) | undefined;
    promise!: Promise<Protocol<T>>;

    constructor() {
        this.clearProtocol();
    }

    async sendAndReceive(channel: T, ...data: any[]) {
        while(true) {
            if(this.protocol) {
                try {
                    return await this.protocol.sendAndReceive(channel, ...data);
                } catch {
                    this.clearProtocol();
                }
            } else {
                const protocol = await this.promise;
                try {
                    return await protocol.sendAndReceive(channel, ...data);
                } catch {
                    this.clearProtocol();
                }
            }
        }
    }

    async send(channel: T, ...data: any[]) {
        while(true) {
            if(this.protocol) {
                try {
                    return await this.protocol.send(channel, ...data);
                } catch {
                    this.clearProtocol();
                }
            } else {
                const protocol = await this.promise;
                try {
                    return await protocol.send(channel, ...data);
                } catch {
                    this.clearProtocol();
                }
            }
        }
    }


    setProtocol(newProtocol: Protocol<T>) {
        if(this.resolver) {
            const { resolver } = this;
            this.resolver = undefined;
            resolver(newProtocol);
        }
        this.protocol = newProtocol;
        this.promise = Promise.resolve(newProtocol);
    }

    clearProtocol() {
        this.promise = new Promise(resolver => {
            this.resolver = resolver;
        });
        this.protocol = undefined;
    }
}