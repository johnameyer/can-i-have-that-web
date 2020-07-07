
import { Card, Run, runFromObj } from 'can-i-have-that';
import { EventType } from './shared/event-types';
import { UIDelegate } from './ui-delegate';
import { appendMessage } from './dom-helpers';

const mapToIndex = <T extends {equals: (other: any) => boolean}>(items: T[], selectedItem: T) => {
    return items.findIndex(card => selectedItem.equals(card));
}

const mapToIndices = <T extends {equals: (other: any) => boolean}>(items: T[], selectedItems: T[]) => {
    const indices = [];
    for(let i = 0; i < selectedItems.length; i++) {
        let j = items.findIndex(card => selectedItems[i].equals(card));
        while(indices.indexOf(j) >= 0) {
            j = items.slice(j).findIndex(card => selectedItems[i].equals(card)) + j;
        }
        indices.push(j);
    }
    return indices;
}

export function multiplayer(socket: SocketIOClient.Socket) {
    return (name: string) => {
        socket.emit('multiplayer', name);
        socket.on('multiplayer/options', (roomOptions: [string, number][]) => {
            const open = () => socket.emit('multiplayer/open');
            const begin = () => socket.emit('multiplayer/begin');

            const join = (room: string) => socket.emit('multiplayer/join', room);

            UIDelegate.listMultiplayerOptions(roomOptions, open, join, begin);
        });

        socket.on(EventType.MESSAGE, function (data: string) {
            const message = JSON.parse(data);
            UIDelegate.message(message);
        });

        socket.on('multiplayer/kicked', function () {
            appendMessage('You were kicked from the game');
        });

        socket.on(EventType.WANT_CARD, function(card: Card, hand: Card[]) {
            card = Card.fromObj(card);
            hand = hand.map(Card.fromObj);

            const handler = (response: [boolean]) => socket.emit(EventType.WANT_CARD, response[0]);
            // UIDelegate.wantCard(card, hand, handler);
        });

        socket.on(EventType.GO_DOWN, function(hand: Card[]) {
            hand = hand.map(Card.fromObj);

            const handler = (response: boolean) => socket.emit(EventType.GO_DOWN, response);
            // UIDelegate.wantToGoDown(hand, handler);
        });

        socket.on(EventType.MOVE_TO_TOP, function() {
            const handler = (response: boolean) => socket.emit(EventType.MOVE_TO_TOP, response);
            UIDelegate.moveToTop(handler);
        });

        socket.on(EventType.SELECT_CARDS, function(cards: Card[], num: 3 | 4) {
            cards = cards.map(Card.fromObj);
            
            const handler = (response: Card[]) => socket.emit(EventType.SELECT_CARDS, mapToIndices(cards, response));
            // UIDelegate.selectCards(cards, num, handler);
        });

        socket.on(EventType.DISCARD_CHOICE, function(cards: Card[], live: Card[]) {
            cards = cards.map(Card.fromObj);
            live = live.map(Card.fromObj);
            
            const handler = (response: Card) => socket.emit(EventType.DISCARD_CHOICE, cards.findIndex(card => card.equals(response)));
            // UIDelegate.discardChoice(cards, live, handler);
        });

        socket.on(EventType.INSERT_WILD, function(run: Card[]) {
            run = run.map(Card.fromObj);

            const handler = (response: number) => socket.emit(EventType.INSERT_WILD, response);
            // UIDelegate.insertWild(run, handler);
        });

        socket.on(EventType.WOULD_PLAY, function(played: Run[], cards: Card[]) {
            cards = cards.map(Card.fromObj);
            played = played.map(runFromObj);
            
            const handler = (response: boolean) => socket.emit(EventType.WOULD_PLAY, response);
            // UIDelegate.wantToPlay(played, cards, handler);
        });

        socket.on(EventType.WHICH_PLAY, function(runs: Run[], cards: Card[]) {
            runs = runs.map(runFromObj);
            cards = cards.map(Card.fromObj);
            
            const handler = (response: Run) => socket.emit(EventType.WHICH_PLAY, mapToIndex(runs, response));
            // UIDelegate.whichPlay(runs, cards, handler);
        } );
        
        socket.on(EventType.CARDS_TO_PLAY, function(cards: Card[], run: Run) {
            cards = cards.map(Card.fromObj);
            run = runFromObj(run);
            
            const handler = (response: Card[]) => socket.emit('cardsToPlay', mapToIndices(cards, response));
            // UIDelegate.cardsToPlay(cards, run, handler);
        } );
    };
};