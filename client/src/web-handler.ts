import { ClientHandler, Card, Run, HandlerData, Message, ThreeCardSet, FourCardRun } from "can-i-have-that";
import { EventType } from "./shared/event-types";
import { UIDelegate } from "./ui-delegate";

export class WebHandler extends ClientHandler {
    constructor(private readonly name: string) {
        super();
    }

    async wantCard(card: Card, isTurn: boolean, { hand, played, position, round, gameParams: { rounds } }: HandlerData): Promise<[boolean, (import("can-i-have-that").HandlerData | undefined)?]> {
        return new Promise((resolve) => UIDelegate.wantCard(card, hand, resolve));
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

    async selectCards(cardsLeft: Card[], num: 3 | 4): Promise<Card[]> {
        return new Promise((resolve) => UIDelegate.selectCards(cardsLeft, num, resolve));
    }

    async cardsToPlay(hand: Card[], run: Run): Promise<Card[]> {
        return new Promise((resolve) => UIDelegate.cardsToPlay(hand, run, resolve));
    }

    async moveToTop(): Promise<boolean> {
        return new Promise((resolve) => UIDelegate.moveToTop(resolve));
    }

    async wantToPlay(played: Run[], hand: Card[]): Promise<boolean> {
        return new Promise((resolve) => UIDelegate.wantToPlay(played, hand, resolve));
    }

    async whichPlay(runOptions: Run[], hand: Card[]): Promise<Run> {
        return new Promise((resolve) => UIDelegate.whichPlay(runOptions, hand, resolve));
    }

    async wantToGoDown(hand: Card[]): Promise<boolean> {
        return new Promise((resolve) => UIDelegate.wantToGoDown(hand, resolve));
    }

    async discardChoice(cardsLeft: Card[], live: Card[]): Promise<Card> {
        return new Promise((resolve) => UIDelegate.discardChoice(cardsLeft, live, resolve));
    }

    async insertWild(run: Card[], wild: Card): Promise<number> {
        throw new Error('Unused method.');
    }

    getName(): string {
        return this.name;
    }

    message(message: Message): void {
        UIDelegate.message(message);
    }
    
}