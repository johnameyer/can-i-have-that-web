import { Protocol } from './protocol';
import { Observable, of, Subject } from 'rxjs';
import { switchMap, flatMap, filter } from 'rxjs/operators';

function isDefined<T>(t: T | undefined): t is T {
    return t !== undefined;
}

async function loopUntilReturn<T>(decoupler: SessionDecoupler, handler: (p: Protocol) => Promise<T>): Promise<T> {
    while(true) {
        if(decoupler.protocol) {
            try {
                return await handler(decoupler.protocol);
            } catch {
                decoupler.clearProtocol();
            }
        } else {
            const protocol = await decoupler.promise;
            try {
                return await handler(protocol);
            } catch {
                decoupler.clearProtocol();
            }
        }
    }
}

// might have to revisit this whole class in the future for atomicity
// and to use the rxjs more widely
export class SessionDecoupler<T extends string = string> implements Protocol<T> {
    protocol: Protocol<T> | undefined;
    resolver!: ((newProtocol: Protocol<T>) => void) | undefined;
    promise!: Promise<Protocol<T>>;
    protocol$: Subject<Protocol<T> | undefined> = new Subject();

    constructor() {
        this.clearProtocol();
    }

    async sendAndReceive(channel: T, ...data: any[]): Promise<any[]> {
        return await loopUntilReturn(this, protocol => protocol.sendAndReceive(channel, ...data));
    }

    async send(channel: T, ...data: any[]): Promise<void> {
        return await loopUntilReturn<void>(this, protocol => protocol.send(channel, ...data));
    }

    receiveAll(channel: T): Observable<any[]> {
        return this.protocol$.pipe(
            switchMap(protocol => protocol?.receiveAll(channel) || of(undefined)),
            filter(isDefined)
        );
    }

    setProtocol(newProtocol: Protocol<T>) {
        if(this.resolver) {
            const { resolver } = this;
            this.resolver = undefined;
            resolver(newProtocol);
        }
        this.protocol = newProtocol;
        this.promise = Promise.resolve(newProtocol);
        this.protocol$.next(newProtocol);
    }

    clearProtocol() {
        this.resolver = undefined;
        this.promise = new Promise(resolver => {
            this.resolver = resolver;
        });
        this.protocol = undefined;
        this.protocol$.next(undefined);
    }
}