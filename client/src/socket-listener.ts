import { Intermediary, Message } from 'can-i-have-that';
import { Serializable } from 'can-i-have-that/dist/intermediary/presenter';

export class SocketListener {
    constructor(private readonly socket: SocketIOClient.Socket, private readonly intermediary: Intermediary) {
        socket.on('form', this.form.bind(this));
        socket.on('print', this.print.bind(this));
    }

    print(printables: any[]): void {
        this.intermediary.print(...Intermediary.deserializeSerializable(printables) as Serializable[]);
    }

    async form(components: any[]) {
        const deserialized = Intermediary.deserializeComponents(components);
        const results = await this.intermediary.form(...deserialized);
        this.socket.emit('form', ...results);
    }
}