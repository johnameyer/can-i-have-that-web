import { ClientHandler, Card, HandlerData, Run, Message } from "can-i-have-that";

export class LocalHandler extends ClientHandler {
    wantCard(card: Card, isTurn: boolean, { hand, played, position, round, gameParams: { rounds } }: HandlerData): Promise<[boolean, (import("can-i-have-that").HandlerData | undefined)?]> {
        throw new Error("Method not implemented.");
    }

    showHand(hand: import("can-i-have-that").Card[], roun: (3 | 4)[], played: import("can-i-have-that").Run[]): void {
        throw new Error("Method not implemented.");
    }

    selectCards(cardsLeft: import("can-i-have-that").Card[], num: number): Promise<import("can-i-have-that").Card[]> {
        throw new Error("Method not implemented.");
    }

    cardsToPlay(hand: import("can-i-have-that").Card[], run: Run): Promise<import("can-i-have-that").Card[]> {
        throw new Error("Method not implemented.");
    }

    moveToTop(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    wantToPlay(played: import("can-i-have-that").Run[], hand: import("can-i-have-that").Card[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    whichPlay(runOptions: import("can-i-have-that").Run[], hand: import("can-i-have-that").Card[]): Promise<import("can-i-have-that").Run> {
        throw new Error("Method not implemented.");
    }
    
    wantToGoDown(hand: import("can-i-have-that").Card[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    discardChoice(cardsLeft: import("can-i-have-that").Card[], live: import("can-i-have-that").Card[]): Promise<import("can-i-have-that").Card> {
        throw new Error("Method not implemented.");
    }

    insertWild(run: import("can-i-have-that").Card[], wild: Card): Promise<number> {
        throw new Error("Method not implemented.");
    }

    getName(): string {
        throw new Error("Method not implemented.");
    }
    
    message(message: Message): void {
        throw new Error("Method not implemented.");
    }

}