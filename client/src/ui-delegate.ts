import { Card, ThreeCardSet, FourCardRun, Run, Message } from 'can-i-have-that';
import { appendMessage, create, p, cardDisplay, cardItem, button, cardContainer, cardDragItem, getFormsRegion, input } from './dom-helpers';
import { dragSegments } from 'drag-drop-regions';
import { OrderingData } from './shared/ordering-data';
import { HandlerCustomData } from 'can-i-have-that/dist/cards/handlers/handler-data';

type Handler<T> = (response: T) => void;

export namespace UIDelegate {
    //TODO move up into main library
    export function message(message: Message) {
        console.log(message);
        appendMessage(message.message);
    }

    export function wantCard(card: Card, hand: Card[], isTurn: boolean, data: OrderingData, handler: Handler<[boolean, HandlerCustomData]>) {
        hand = data.hand || hand;
        const container = create('div');
        container.append(p('You have'));
        const dragSegment = dragSegments(cardContainer, [hand], cardDragItem);
        container.append(dragSegment);
        const cardImage = cardItem(card);
        cardImage.style.verticalAlign = 'middle';
        container.append(p('Do you want ', cardImage, isTurn ? '?' : ' and an extra?'));
        const handleResponse = (response: boolean) => () => {
            data.hand = hand;
            handler([response, data]);
            container.remove();
            appendMessage('You ' + (response ? 'picked ' : 'did not pick ') + 'up the ' + card.toString());
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        getFormsRegion().append(container);
        container.scrollIntoView();
    }

    export function wantToGoDown(hand: Card[], data: OrderingData, handler: Handler<boolean>) {
        hand = data.hand || hand;
        const container = create('div');
        container.append(p('You have'));
        const dragSegment = dragSegments(cardContainer, [hand], cardDragItem);
        container.append(dragSegment);
        const handleResponse = (response: boolean) => () => {
            data.hand = hand;
            handler(response);
            container.remove();
        }
        container.append(p('Do you want to go down?'));
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        getFormsRegion().append(container);
        container.scrollIntoView();
    }

    export function selectCards(hand: Card[], num: 3 | 4, data: OrderingData, handler: Handler<Card[]>) {
        hand = data.hand || hand;
        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        form.append(p('Please drag cards in the '  + (num === 3 ? '3 of a kind ' : '4 card run from lowest to highest ') + 'into the area or drag none to escape going down'));
        const validate = (input: Card[]) => {
            if (input.length === 0) {
                return true;
            }
            try {
                validateSetSelection(num, input);
                return true;
            } catch (e) {
                return e as Error;
            }
        };
        const error = p('');
        const handleResponse = (selection: Card[][]) => {
            const toPlayCards = selection[1].slice();
            const result = validate(toPlayCards);
            if(result === true) {
                form.remove();
                data.hand = hand;
                handler(toPlayCards);
                if(toPlayCards.length) {
                    appendMessage('You played ' + toPlayCards.toString());
                }
            } else {
                error.innerText = result.message;
                form.append(error);
            }
        }
        const options = dragSegments(cardContainer, [hand, []], cardDragItem, handleResponse, [-1, -1], [() => true, (cards) => cards.length ? validate(cards) === true : true]);
        form.append(options);
        getFormsRegion().append(form);
        form.scrollIntoView();
    }

    export function discardChoice(hand: Card[], live: Card[], data: OrderingData, handler: Handler<Card>) {
        hand = data.hand || hand;
        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        form.append(p('Please drag or move a card to the area below to discard'));
        const validate = (choice: Card) => !live.some((card) => choice.equals(card));
        const error = p('');
        const handleResponse = (toDiscard: Card, wantBack: boolean) => {
            if(!toDiscard) {
                error.innerText = 'Must discard a card';
                return;
            }
            if(validate(toDiscard)) {
                data.hand = hand;
                data.discardedCard = toDiscard;
                data.wantBack = wantBack;
                handler(toDiscard);
                form.remove();
                appendMessage('You discarded ' + toDiscard.toString());
            } else {
                error.innerText = toDiscard.toString() + ' is a live card';
                form.append(error);
            }
        }

        const toDiscard: Card[] = [];
        const options = dragSegments(cardContainer,[hand, toDiscard], cardDragItem, undefined, [-1, 1], [() => true, ([card]) => card ? validate(card) : false]);
        form.append(options);
        form.append('Want card back (if possible): ');
        const wantBack = create('input');
        wantBack.type = 'checkbox';
        form.append(wantBack);
        const submit = button('Submit', () => handleResponse(toDiscard[0], wantBack.checked));
        form.append(submit);
        getFormsRegion().append(form);
        form.scrollIntoView();
    }

    export function wantToPlay(runs: Run[], hand: Card[], data: OrderingData, handler: Handler<boolean>) {
        hand = data.hand || hand;
        const container = create('div');
        container.append(p('You have'));
        container.append(cardDisplay(hand));
        container.append(p('Runs on the table'));
        for(let run of runs) {
            const runDisplay = cardDisplay(run.cards);
            container.append(runDisplay);
        }
        const handleResponse = (response: boolean) => () => {
            data.hand = hand;
            handler(response);
            container.remove();
        }
        container.append(p('Would you like to play a card on a run?'));
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        getFormsRegion().append(container);
        container.scrollIntoView();
    }

    export function whichPlay(runs: Run[], hand: Card[], data: OrderingData, handler: Handler<Run | null>) {
        hand = data.hand || hand;
        const container = create('div');
        container.append(p('You have'));
        container.append(cardDisplay(hand));
        container.append(p('Click the run you would like to play on first'));
        const handleResponse = (index: number) => () => {
            data.hand = hand;
            handler(runs[index] || null);
            container.remove();
        }
        const none = button('Can\'t Play', handleResponse(-1));
        container.append(none);
        container.append(create('br'));
        for(let i = 0; i < runs.length; i++) {
            const run = runs[i];
            const runDisplay = cardDisplay(run.cards);
            runDisplay.onclick = handleResponse(i);
            container.append(runDisplay);
        }
        getFormsRegion().append(container);
        container.scrollIntoView();
    }

    export function playCards(hand: Card[], run: Run, data: OrderingData, handler: Handler<Card[]>) {
        hand = data.hand || hand;
        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        form.append(p('Please drag the cards you want to add to the run'));
        const validate = (input: Card[]) => {
            if (input.length === 0) {
                return true;
            }
            try {
                validateSetSelection(run.type as 3 | 4, input);
                validateSetRange(run, input);
                return true;
            } catch (e) {
                return e;
            }
        };
        const error = p('');
        const handleResponse = (response: Card[][]) => {
            const toPlayCards = response[1];
            const result = validate(toPlayCards);
            if(result === true) {
                data.hand = hand;
                handler(toPlayCards);
                form.remove();
                if(toPlayCards.length) {
                    appendMessage('You played ' + toPlayCards.toString());
                }
            } else {
                error.innerText = result.message;
                form.append(error);
            }
        }
        const options = dragSegments(cardContainer, [hand, run.cards.slice()], cardDragItem, handleResponse, [-1, -1],
            [() => true, (cards) => cards.length ? validate(cards) === true : true],
            [hand.map(() => false), run.cards.map(card => run.type === 3 || !card.isWild())]
        );
        form.append(options);
        getFormsRegion().append(form);
        form.scrollIntoView();
    }

    export function setupLobby(singleplayer: (name: string) => void, multiplayer: (name: string, host?: string) => void) {
        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        form.append('Your name: ');
        const name = input('Name');
        form.append(name);

        form.append(create('br'));
        form.append(create('br'));

        const singleplayerButton = button('Play Against Bots', () => {
            singleplayer(name.value);
            form.remove();
        });
        form.append(singleplayerButton);

        form.append(create('br'));
        form.append(create('br'));

        form.append('or');
        
        form.append(create('br'));
        form.append(create('br'));

        form.append('Server: ');

        const server = input('Server');
        form.append(server);

        const serverConnect = button('Play Online', () => {
            multiplayer(name.value, server.value || undefined);
            form.remove();
        });
        serverConnect.id = 'multiplayer';
        form.append(serverConnect);
        getFormsRegion().append(form);
    }

    export function listMultiplayerOptions(roomOptions: [string, number][], open: () => void, join: (room: string) => void, begin: () => void) {
        const form = create('form');
            form.onsubmit = (e) => e.preventDefault();
            form.append(p('Select a room'));
            const options = create('select');
            const newRoom = create('option');
            newRoom.innerText = 'Create new room';
            newRoom.value = '';
            options.append(newRoom);
            for(let i = 0; i < roomOptions.length; i++) {
                const option = create('option');
                option.innerText = 'Room ' + roomOptions[i][0] + ' with ' + roomOptions[i][1] + ' others';
                option.value = roomOptions[i][0];
                options.append(option);
            }
            form.append(options);
            const submit = button('Select', () => {
                if(options.value === '') {
                    open();
                    const start: HTMLElement = button('Start', () => {
                        begin();
                        start.remove();
                    });
                    getFormsRegion().append(start);
                } else {
                    join(options.value);
                }
                form.remove();
            });
            form.append(submit);
            getFormsRegion().append(form);
    }
}

function validateSetSelection(num: 3 | 4, input: Card[]) {
    if (num === 3) {
        new ThreeCardSet(input.slice());
    } else {
        new FourCardRun(input.slice());
    }
}

function validateSetRange(run: Run, input: Card[]) {
    if (run.type === 3) {
        const removed = run.cards.filter(card => !input.find(otherCard => card.equals(otherCard)));
        if(removed.length) {
            throw new Error('Cannot remove cards ' + removed.map(card => card.toString()) + ' from set');
        }
        for(let i = 0; i < run.cards.length; i++) {
            if(!run.cards[i].equals(input[i])) {
                throw new Error('Cannot move original cards');
            }
        }
    } else {
        const startingIndex = input.findIndex(card => card.equals(run.cards[0]));
        const removed = run.cards.filter(card => !input.find(otherCard => card.equals(otherCard)));
        if(removed.length) {
            throw new Error('Cannot remove cards ' + removed.map(card => card.toString()) + ' from set');
        }
        for(let i = 0; i < run.cards.length; i++) {
            if(run.cards[i].isWild()) {
                if(!input[i + startingIndex].isWild()) {
                    continue;
                }
                if(!run.cards[i].equals(input[i + startingIndex])) {
                    throw new Error('Cannot move a wild unless it is being replaced with a nonwild');
                }
            }
            if(!run.cards[i].equals(input[i + startingIndex])) {
                // shouldn't theoretically happen with the preservation check and validity check but safe
                throw new Error('Cannot replace a card that was in the set originally');
            }
        }
    }
}