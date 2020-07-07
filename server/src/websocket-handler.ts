import { ClientHandler, Card, Run, Message, HandlerData, FourCardRun, ThreeCardSet } from "can-i-have-that";
import { Socket } from "socket.io";
import { EventType } from './shared/event-types';
import { HandlerCustomData } from "can-i-have-that/dist/cards/handlers/handler-data";

export class WebsocketHandler extends ClientHandler {
    private name: string;
    private socket!: Socket;

    constructor(name: string) {
        super();
        this.name = name;
    }

    private readonly booleanQuestion = async (channel: EventType, data: HandlerCustomData, ...otherArgs: any[]): Promise<boolean> => {
        this.socket.emit(channel, ...otherArgs, data);
        return await new Promise(resolver => this.socket.once(channel, (result, newData) => {
            data.hand = newData.hand.map(Card.fromObj);
            resolver(result);
        }));
    }

    private readonly choiceQuestion = async <T>(channel: EventType, data: HandlerCustomData, choices: T[], ...otherArgs: any[]): Promise<T> => {
        this.socket.emit(channel, choices, ...otherArgs, data);
        return choices[await new Promise(resolver => this.socket.once(channel, (result, newData) => {
            data.hand = newData.hand.map(Card.fromObj);
            resolver(result);
        })) as number];
    }

    private readonly choicesQuestion = async <T>(channel: EventType, data: HandlerCustomData, choices: T[], ...otherArgs: any[]): Promise<T[]> => {
        this.socket.emit(channel, choices, ...otherArgs, data);
        return ((await new Promise(resolver => this.socket.once(channel, (result, newData) => {
            data.hand = newData.hand.map(Card.fromObj);
            resolver(result);
        }))) as number[]).map(num => choices[num]);
    }

    reconcileDataAndHand(hand: Card[], data: HandlerCustomData) {
        if(!data.hand) {
            data.hand = hand;
        } else {
            // TODO handle duplicates?
            for(let i = 0; i < hand.length; i++) {
                if(!(data.hand as Card[]).find(card => hand[i].equals(card))) {
                    data.hand.push(hand[i]);
                }
            }

            for(let i = 0; i < data.hand.length; i++) {
                if(!hand.find(card => data.hand[i].equals(card))) {
                    data.hand.splice(i, 1);
                    i--;
                }
            }
        }
    }
    
    async turn(gameState: HandlerData): Promise<{ toDiscard: Card | null, toPlay: Run[][], data?: HandlerCustomData } | null> {
        this.reconcileDataAndHand(gameState.hand, gameState.data);
        const result = await super.turn(gameState);
        if(!result) {
            return null;
        }
        return {...result, data: gameState.data};
    }
    
    setSocket(socket: Socket) {
        this.socket = socket;
    }
    
    public async wantCard(card: Card, isTurn: boolean, {hand, played, position, round, gameParams: {rounds}, data}: HandlerData): Promise<[boolean, HandlerCustomData]> {
        this.reconcileDataAndHand(hand, data);
        return [await this.booleanQuestion(EventType.WANT_CARD, data, card, hand), data];
    }

    async createRun(num: 3 | 4, cardsLeft: Card[], data: HandlerCustomData) {
        const selected: Card[] = await this.selectCards(cardsLeft, num, data);
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

    async selectCards(cardsLeft: Card[], num: number, data: HandlerCustomData): Promise<Card[]> {
        return await this.choicesQuestion(EventType.SELECT_CARDS, data, cardsLeft, num)
    }

    async cardsToPlay(hand: Card[], run: Run, data: HandlerCustomData): Promise<Card[]> {
        return await this.choicesQuestion(EventType.CARDS_TO_PLAY, data, hand, run);
    }

    async moveToTop(): Promise<boolean> {
        return await this.booleanQuestion(EventType.MOVE_TO_TOP, {});
    }

    async wantToPlay(runOptions: Run[], hand: Card[], data: HandlerCustomData): Promise<boolean> {
        return await this.booleanQuestion(EventType.WOULD_PLAY, data, runOptions, hand);
    }

    async whichPlay(runOptions: Run[], hand: Card[], data: HandlerCustomData): Promise<Run> {
        return await this.choiceQuestion(EventType.WHICH_PLAY, data, runOptions, hand)
    }

    async wantToGoDown(hand: Card[], data: HandlerCustomData): Promise<boolean> {
        return await this.booleanQuestion(EventType.GO_DOWN, data, hand);
    }

    async discardChoice(cardsLeft: Card[], live: Card[], data: HandlerCustomData): Promise<Card> {
        return Card.fromObj(await this.choiceQuestion(EventType.DISCARD_CHOICE, data, cardsLeft, live));
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