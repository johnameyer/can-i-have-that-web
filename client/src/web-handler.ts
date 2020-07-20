import { ClientHandler, Card, Run, HandlerData, Message, ThreeCardSet, FourCardRun, DealMessage, PickupMessage } from "can-i-have-that";
import { UIDelegate } from "./ui-delegate";
import { OrderingData } from "./shared/ordering-data";
import { HandlerCustomData } from "can-i-have-that/dist/cards/handlers/handler-data";

export class WebHandler extends ClientHandler {
    constructor(private readonly name: string) {
        super();
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

    async wantCard(card: Card, isTurn: boolean, { hand, played, position, round, gameParams: { rounds }, data }: HandlerData): Promise<[boolean, HandlerCustomData]> {
        this.reconcileDataAndHand(hand, data);
        if(card.equals(data.discardedCard)) {
            data.discardedCard = undefined;
            return [data.wantBack, data];
        } else {
            data.discardedCard = undefined;
        }
        return new Promise<[boolean, HandlerCustomData]>((resolve) => UIDelegate.wantCard(card, hand, isTurn, data as OrderingData, resolve));
    }
    
    async turn(gameState: HandlerData): Promise<{ toDiscard: Card | null, toPlay: Run[][], data?: HandlerCustomData } | null> {
        this.reconcileDataAndHand(gameState.hand, gameState.data);
        const result = await super.turn(gameState);
        if(!result) {
            return null;
        }
        return {...result, data: gameState.data};
    }

    async createRun(num: 3 | 4, cardsLeft: Card[], data: OrderingData) {
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

    async askToPlayOnRun(run: Run, hand: Card[], data: OrderingData) {
        return new Promise<void>((resolve) => UIDelegate.playCards(hand, run, data, (cards) => {
                run.cards = cards;
                if(run instanceof ThreeCardSet) {
                    run.wilds = cards.filter(card => card.isWild());
                }
                cards.filter(card => !run.cards.find(originalCard => card.equals(originalCard))).forEach((toRemove) => hand.splice(hand.findIndex((card) => toRemove.equals(card)), 1));
                resolve();
            })
        );
    }

    showHand(hand: Card[], roun: (3 | 4)[], played: Run[]): void {
    }

    async selectCards(cardsLeft: Card[], num: 3 | 4, data: OrderingData): Promise<Card[]> {
        return new Promise((resolve) => UIDelegate.selectCards(cardsLeft, num, data, resolve));
    }

    async cardsToPlay(hand: Card[], run: Run, data: OrderingData): Promise<Card[]> {
        throw new Error('Unused method.');
    }

    async moveToTop(): Promise<boolean> {
        throw new Error('Unused method.');
    }

    async wantToPlay(played: Run[], hand: Card[], data: OrderingData): Promise<boolean> {
        return new Promise((resolve) => UIDelegate.wantToPlay(played, hand, data, resolve));
    }

    async whichPlay(runOptions: Run[], hand: Card[], data: OrderingData): Promise<Run> {
        return new Promise((resolve) => UIDelegate.whichPlay(runOptions, hand, data, resolve));
    }

    async wantToGoDown(hand: Card[], data: OrderingData): Promise<boolean> {
        return new Promise((resolve) => UIDelegate.wantToGoDown(hand, data, resolve));
    }

    async discardChoice(cardsLeft: Card[], live: Card[], data: OrderingData): Promise<Card> {
        return new Promise((resolve) => UIDelegate.discardChoice(cardsLeft, live, data, resolve));
    }

    async insertWild(run: Card[], wild: Card, data: OrderingData): Promise<number> {
        throw new Error('Unused method.');
    }

    getName(): string {
        return this.name || 'Website Player';
    }

    message(message: Message): void {
        UIDelegate.message(message);
    }
    
}