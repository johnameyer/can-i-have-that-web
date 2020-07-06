import { ClientHandler, Card, Run, Message, HandlerData, FourCardRun, ThreeCardSet } from "can-i-have-that";
import { Socket } from "socket.io";
import { EventType } from './shared/event-types';

export class WebsocketHandler extends ClientHandler {
    private name: string;
    private socket!: Socket;

    constructor(name: string) {
        super();
        this.name = name;
    }

    private readonly booleanQuestion = async (channel: EventType, ...otherArgs: any[]): Promise<boolean> => {
        this.socket.emit(channel, ...otherArgs);
        return await new Promise(resolver => this.socket.once(channel, resolver) )
    }

    private readonly choiceQuestion = async <T>(channel: EventType, choices: T[], ...otherArgs: any[]): Promise<T> => {
        this.socket.emit(channel, choices, ...otherArgs);
        return choices[await new Promise(resolver => this.socket.once(channel, resolver)) as number];
    }

    private readonly choicesQuestion = async <T>(channel: EventType, choices: T[], ...otherArgs: any[]): Promise<T[]> => {
        this.socket.emit(channel, choices, ...otherArgs);
        return ((await new Promise(resolver => this.socket.once(channel, resolver))) as number[]).map(num => choices[num]);
    }
    
    setSocket(socket: Socket) {
        this.socket = socket;
    }
    
    public async wantCard(card: Card, isTurn: boolean, {hand, played, position, round, gameParams: {rounds}}: HandlerData): Promise<[boolean]> {
        return [await this.booleanQuestion(EventType.WANT_CARD, card, hand)];
    }

    async createRun(num: 3 | 4, cardsLeft: Card[]) {
        const selected: Card[] = await this.selectCards(cardsLeft, num);
        if (!selected.length) {
            return null;
        }
        if (num === 3) {
            return new ThreeCardSet(selected);
        } else {
            return new FourCardRun(selected);
        }
    }

    showHand(hand: Card[], roun: (3 | 4)[], played: Run[]): void {
    }

    async selectCards(cardsLeft: Card[], num: number): Promise<Card[]> {
        return await this.choicesQuestion(EventType.SELECT_CARDS, cardsLeft, num)
    }

    async cardsToPlay(hand: Card[], run: Run): Promise<Card[]> {
        return await this.choicesQuestion(EventType.CARDS_TO_PLAY, hand, run);
    }

    async moveToTop(): Promise<boolean> {
        return await this.booleanQuestion(EventType.MOVE_TO_TOP);
    }

    async wantToPlay(runOptions: Run[], hand: Card[]): Promise<boolean> {
        return await this.booleanQuestion(EventType.WOULD_PLAY, runOptions, hand);
    }

    async whichPlay(runOptions: Run[], hand: Card[]): Promise<Run> {
        return await this.choiceQuestion(EventType.WHICH_PLAY, runOptions, hand)
    }

    async wantToGoDown(hand: Card[]): Promise<boolean> {
        return await this.booleanQuestion(EventType.GO_DOWN, hand);
    }

    async discardChoice(cardsLeft: Card[], live: Card[]): Promise<Card> {
        return Card.fromObj(await this.choiceQuestion(EventType.DISCARD_CHOICE, cardsLeft, live));
    }

    async insertWild(run: Card[], wild: Card): Promise<number> {
        // return await new Promise(resolver => this.socket.once(EventType.INSERT_WILD, resolver));
        throw new Error('Unused method');
    }
    
    
    getName(): string {
        return this.name || 'Website player';
    }
    
    message(message: Message): void {
        this.socket.emit(EventType.MESSAGE, JSON.stringify(message));
    }
}