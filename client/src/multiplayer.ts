
import { Card, Run, runFromObj } from 'can-i-have-that';
import { EventType } from './shared/event-types';
import { UIDelegate } from './ui-delegate';
import { appendMessage, getEventsRegion } from './dom-helpers';
import { OrderingData } from './shared/ordering-data';
import io from 'socket.io-client';

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

export function multiplayer(name: string, host?: string) {
    // @ts-ignore
    const socket = io.connect(host);

    (window as any).socket = socket;
    
    // socket.on('connect', (obj: any) => console.error('connect', obj));
    // socket.on('connect_timeout', (obj: any) => console.error('connect_timeout', obj));
    // socket.on('connecting', (obj: any) => console.error('connecting', obj));
    // socket.on('reconnect_error', (obj: any) => console.error('reconnect_error', obj));

    socket.once('connect', () => {
        appendMessage('Connected to server');

        socket.on('error', (obj: any) => {
            // console.error('error', obj);
            appendMessage('Error');
        });

        
        socket.on('connect_error', (obj: any) => {
            // console.error(obj);
            appendMessage('Failed to reach the server');
        });
        
        // socket.connected = true; // THIS FIXES BUT IS INFURIATING
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

        socket.on(EventType.WANT_CARD, function(card: Card, hand: Card[], isTurn: boolean, data: OrderingData) {
            card = Card.fromObj(card);
            hand = hand.map(Card.fromObj);
            data.hand = data.hand.map(Card.fromObj);

            const handler = (response: [boolean, any]) => socket.emit(EventType.WANT_CARD, response[0], data);
            UIDelegate.wantCard(card, hand, isTurn, data, handler);
        });

        socket.on(EventType.GO_DOWN, function(hand: Card[], data: OrderingData) {
            hand = hand.map(Card.fromObj);
            data.hand = data.hand.map(Card.fromObj);

            const handler = (response: boolean) => socket.emit(EventType.GO_DOWN, response, data);
            UIDelegate.wantToGoDown(hand, data, handler);
        });

        socket.on(EventType.MOVE_TO_TOP, function() {
            const handler = (response: boolean) => socket.emit(EventType.MOVE_TO_TOP, response);
            UIDelegate.moveToTop(handler);
        });

        socket.on(EventType.SELECT_CARDS, function(cards: Card[], num: 3 | 4, data: OrderingData) {
            cards = cards.map(Card.fromObj);
            data.hand = data.hand.map(Card.fromObj);
            
            const handler = (response: Card[]) => socket.emit(EventType.SELECT_CARDS, mapToIndices(cards, response), data);
            UIDelegate.selectCards(cards, num, data, handler);
        });

        socket.on(EventType.DISCARD_CHOICE, function(cards: Card[], live: Card[], data: OrderingData) {
            cards = cards.map(Card.fromObj);
            live = live.map(Card.fromObj);
            data.hand = data.hand.map(Card.fromObj);
            
            const handler = (response: Card) => socket.emit(EventType.DISCARD_CHOICE, cards.findIndex(card => card.equals(response)), data);
            UIDelegate.discardChoice(cards, live, data, handler);
        });

        socket.on(EventType.INSERT_WILD, function(run: Card[], data: OrderingData) {
            run = run.map(Card.fromObj);
            data.hand = data.hand.map(Card.fromObj);

            const handler = (response: number) => socket.emit(EventType.INSERT_WILD, response, data);
            UIDelegate.insertWild(run, data, handler);
        });

        socket.on(EventType.WOULD_PLAY, function(played: Run[], cards: Card[], data: OrderingData) {
            cards = cards.map(Card.fromObj);
            played = played.map(runFromObj);
            data.hand = data.hand.map(Card.fromObj);
            
            const handler = (response: boolean) => socket.emit(EventType.WOULD_PLAY, response, data);
            UIDelegate.wantToPlay(played, cards, data, handler);
        });

        socket.on(EventType.WHICH_PLAY, function(runs: Run[], cards: Card[], data: OrderingData) {
            runs = runs.map(runFromObj);
            cards = cards.map(Card.fromObj);
            data.hand = data.hand.map(Card.fromObj);
            
            const handler = (response: Run) => socket.emit(EventType.WHICH_PLAY, mapToIndex(runs, response), data);
            UIDelegate.whichPlay(runs, cards, data, handler);
        } );
        
        socket.on(EventType.CARDS_TO_PLAY, function(cards: Card[], run: Run, data: OrderingData) {
            cards = cards.map(Card.fromObj);
            run = runFromObj(run);
            data.hand = data.hand.map(Card.fromObj);
            
            const handler = (response: Card[]) => socket.emit('cardsToPlay', mapToIndices(cards, response), data);
            UIDelegate.cardsToPlay(cards, run, data, handler);
        } );
    });
};