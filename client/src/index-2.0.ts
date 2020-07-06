import io from 'socket.io-client';
import { Card, ThreeCardSet, Run, runFromObj, Rank, FourCardRun } from 'can-i-have-that';
import { dragSegments } from 'drag-drop-regions';
import { EventType } from './shared/event-types';

function cardToURL(card: Card): string {
    if(card.rank == Rank.JOKER) {
        return '/res/img/black_joker.svg';
    }
    let str = '/res/img/';
    str += ({
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
        '6': '6',
        '7': '7',
        '8': '8',
        '9': '9',
        '10': '10',
        'J': 'jack',
        'Q': 'queen',
        'K': 'king',
        'A': 'ace',
    } as any)[card.rank.toString()];
    str += '_of_';
    str += ({
        'C': 'clubs',
        'H': 'hearts',
        'D': 'diamonds',
        'S': 'spades',
    } as any)[card.suit.letter];
    return str + '.svg';
}

document.addEventListener("DOMContentLoaded", function(){
    const socket = io.connect();

    (window as any).socket = socket;
    
    socket.on('connect', (obj: any) => console.error('this sucks', obj));
    socket.on('connect_timeout', (obj: any) => console.error('this sucks', obj));
    socket.on('connecting', (obj: any) => console.error('this sucks', obj));
    socket.on('reconnect_error', (obj: any) => console.error('this sucks', obj));

    const eventsRegion = document.getElementById('events');
    const formsRegion = document.getElementById('form');
    if(!eventsRegion || !formsRegion) {
        return;
    }

    const create = function<T extends keyof HTMLElementTagNameMap>(t: T): HTMLElementTagNameMap[T] { return document.createElement(t) };

    const input = function(str: string) {
        const input = create('input');
        input.innerText = str;
        return input;
    }

    const p = function(...children: (string | HTMLElement)[]) {
        const p = create('p');
        p.append(...children);
        return p;
    }

    const div = function(...contents: HTMLElement[]) {
        const div = create('div');
        div.append(...contents);
        return div;
    }

    const img = function(str: string, attrs: any = {}) {
        const img = create('img');
        img.src = str;
        Object.assign(img, attrs);
        return img;
    }

    const button = function(str: string, func: () => any) {
        const button = create('button');
        button.innerText = str;
        button.onclick = function(e) { e.preventDefault(); func(); }
        return button;
    }

    const cardContainer = () => {
        let internalContainer = div();
        internalContainer.className = "container";
        return internalContainer;
    };

    const cardItem = (card: Card): HTMLImageElement => {
        let result = img(cardToURL(card));
        result.classList.add('card');
        return result;
    };

    const cardDragItem = (card: Card): HTMLImageElement => {
        let result = cardItem(card);
        result.classList.add('drag-card');
        return result;
    };

    const cardDisplay = (cards: Card[]) => {
        const container = cardContainer();
        for(const card of cards) {
            container.append(cardItem(card));
        }
        return container;
    }
    
    const appendMessage = (message: string) => {
        const shouldScroll = eventsRegion.scrollHeight - eventsRegion.scrollTop - eventsRegion.clientHeight < 10;
        const element = p(message);
        eventsRegion.append(element);
        if(shouldScroll) {
            element.scrollIntoView();
        }
    };

    socket.once('ready', () => {
        eventsRegion.innerHTML = '';
        appendMessage('Connected to server');
        
        {
            const form = create('form');
            form.onsubmit = (e) => e.preventDefault();
            const name = input('Name');
            form.append(name);
            const submitName = button('Submit name', () => socket.emit('changeName', name.value));
            form.append(submitName);
            formsRegion.append(form);
        }

        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        const singleplayer = button('Singleplayer', () => {
            socket.emit('singleplayer', true);
            form.remove();
        });
        form.append(singleplayer);
        const multiplayer = button('Multiplayer', () => {
            socket.emit('multiplayer', true);
            form.remove();
        });
        form.append(multiplayer);
        formsRegion.append(form);
    });

    socket.on('error', (obj: any) => {
        console.error(obj);
        appendMessage('Error');
    });

    
    socket.on('connect_error', (obj: any) => {
        console.error(obj);
        appendMessage('Failed to reach the server');
    });

    socket.on('multiplayer/options', (roomOptions: [string, number][]) => {
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
                socket.emit('multiplayer/open');
                const begin: HTMLElement = button('Start', () => {
                    socket.emit('multiplayer/begin');
                    begin.remove();
                });
                formsRegion.append(begin);
            } else {
                socket.emit('multiplayer/join', options.value);
            }
            form.remove();
        });
        form.append(submit);
        formsRegion.append(form);
    });

    socket.on(EventType.MESSAGE, function (data: string) {
        console.log(JSON.parse(data));
        appendMessage(JSON.parse(data).message);
    });

    socket.on('multiplayer/kicked', function () {
        appendMessage('You were kicked from the game');
    });

    socket.on(EventType.WANT_CARD, function(card: Card, hand: Card[]) {
        card = Card.fromObj(card);
        hand = hand.map(Card.fromObj);
        const container = create('div');
        container.append(p("You have"));
        container.append(cardDisplay(hand));
        const cardImage = cardItem(card);
        cardImage.style.verticalAlign = 'middle';
        container.append(p('Do you want ', cardImage, '?'));
        const handleResponse = (response: boolean) => () => {
            socket.emit(EventType.WANT_CARD, response);
            container.remove();
            appendMessage('You ' + (response ? 'picked ' : 'did not pick ') + 'up the ' + card.toString());
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        formsRegion.append(container);
    });

    socket.on(EventType.GO_DOWN, function(hand: Card[]) {
        hand = hand.map(Card.fromObj);
        const container = create('div');
        container.append(p('Do you want to go down?'));
        container.append(p("You have"));
        container.append(cardDisplay(hand));
        const handleResponse = (response: boolean) => () => {
            socket.emit(EventType.GO_DOWN, response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        formsRegion.append(container);
    });

    socket.on(EventType.MOVE_TO_TOP, function() {
        const container = create('div');
        container.append(p('Do you want to move the wild to the top?'));
        const handleResponse = (response: boolean) => () => {
            socket.emit(EventType.MOVE_TO_TOP, response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        formsRegion.append(container);
    });

    socket.on(EventType.SELECT_CARDS, function(cards: Card[], num: number) {
        cards = cards.map(Card.fromObj);
        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        form.append(p('Please select cards in the '  + (num === 3 ? '3 of a kind ' : '4 card run ') + 'or none to exit'));
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
            const toPlay = [];
            for(let i = 0; i < toPlayCards.length; i++) {
                let j = cards.findIndex(card => toPlayCards[i].equals(card));
                while(toPlay.indexOf(j) >= 0) {
                    j = cards.slice(j).findIndex(card => toPlayCards[i].equals(card)) + j;
                }
                toPlay.push(j);
            }
            const result = validate(toPlayCards);
            if(result === true) {
                form.remove();
                socket.emit(EventType.SELECT_CARDS, toPlay);
                if(toPlayCards.length) {
                    appendMessage('You played ' + toPlayCards.toString());
                }
            } else {
                error.innerText = result.message;
                form.append(error);
            }
        }
        const options = dragSegments(cardContainer, [[...cards], []], cardDragItem, handleResponse, [-1, -1], [() => true, (cards) => cards.length ? validate(cards) === true : true]);
        form.append(options);
        formsRegion.append(form);        
    });

    socket.on(EventType.DISCARD_CHOICE, function(cards: Card[], live: Card[]) {
        cards = cards.map(Card.fromObj);
        live = live.map(Card.fromObj);
        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        form.append(p('Please select a card to discard'));
        const validate = (choice: Card) => !live.some((card) => choice.equals(card));
        const error = p('');
        const handleResponse = (selected: Card[][]) => {
            const toDiscard = selected[1][0];
            if(!toDiscard) {
                error.innerText = 'Must discard something';
                return;
            }
            if(validate(toDiscard)) {
                socket.emit(EventType.DISCARD_CHOICE, cards.findIndex(card => card.equals(toDiscard)));
                form.remove();
                appendMessage('You discarded ' + toDiscard.toString());
            } else {
                error.innerText = toDiscard.toString() + ' is a live card';
                form.append(error);
            }
        }

        const options = dragSegments(cardContainer,[[...cards], []], cardDragItem, handleResponse, [-1, 1], [() => true, ([card]) => card ? validate(card) : false]);
        form.append(options);
        formsRegion.append(form);
    });

    socket.on(EventType.INSERT_WILD, function(run: Card[]) {
        run = run.map(Card.fromObj);
        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        form.append(p('Please choose where to insert your wild cards'));
        const options = create('select');
        const before = create('option');
        before.innerText = 'Before ' + run[0].toString();
        before.value = '0';
        options.append(before);
        for(let i = 1; i < run.length; i++) {
            const option = create('option');
            option.innerText = 'Between ' + run[i - 1].toString() + ' and ' + run[i].toString();
            option.value = String(i);
            options.append(option);
        }
        const after = create('option');
        after.innerText = 'After ' + run[run.length - 1].toString();
        after.value = String(run.length);
        options.append(after);
        options.append(after);
        form.append(options);
        const validate = () => true; //TODO
        const error = p('');
        const handleResponse = () => {
            const insert = Number(options.value);
            const result = validate();
            if(result == true) {
                socket.emit(EventType.INSERT_WILD, insert);
                form.remove();
            } else {
                error.innerText = '';
                form.append(error);
            }
        }
        const submit = button('Submit', handleResponse);
        form.append(submit);
        formsRegion.append(form);
    });

    socket.on('beginTurn', function(run: Card[]) {
    });

    socket.on('endTurn', function(run: Card[]) {
    });

    socket.on(EventType.WOULD_PLAY, function(played: Run[], cards: Card[]) {
        cards = cards.map(Card.fromObj);
        played = played.map(runFromObj);
        const container = create('div');
        container.append(p('Would you like to play a card?'));
        container.append(p("You have"));
        container.append(cardDisplay(cards));
        container.append(p('Others have played'));
        container.append(p(...played.map(run => [run.toString(), create('br')]).flat()));
        //TODO own hand shows up
        const handleResponse = (response: boolean) => () => {
            socket.emit(EventType.WOULD_PLAY, response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        formsRegion.append(container);
    });

    socket.on(EventType.WHICH_PLAY, function(runs: Run[], cards: Card[]) {
        runs = runs.map(runFromObj);
        cards = cards.map(Card.fromObj);
        const container = create('div');
        container.append(p("You have"));
        container.append(cardDisplay(cards));
        container.append(p('Others have played ' + runs.map(run => run.toString()).join(', ')));
        const options = create('select');
        for(let i = 0; i < runs.length; i++) {
            const option = create('option');
            option.innerText = runs[i].toString();
            option.value = String(i);
            options.append(option);
        }
        container.append(options);
        const handleResponse = () => {
            socket.emit(EventType.WHICH_PLAY, Number(options.value));
            container.remove();
        }
        const submit = button('Submit', handleResponse);
        container.append(submit);
        formsRegion.append(container);

    } );
    
    socket.on(EventType.CARDS_TO_PLAY, function(cards: Card[], run: Run) {
        cards = cards.map(Card.fromObj);
        run = runFromObj(run);
        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        form.append(p('Please select cards to add to the ' + run.toString()));
        const options = create('div');
        for(let i = 0; i < cards.length; i++) {
            const option = create('input');
            option.type = 'checkbox';
            option.name = String(i);
            option.id = 'select-card-' + i;
            options.append(option);
            const label = create('label');
            label.innerText = cards[i].toString();
            label.htmlFor = option.id;
            options.append(label);
        }
        form.append(options);
        const validate = (input: Card[]): true | Error => {
            return true;
        };
        
        // const validate = (input: Card[]) => {
        //     if (input.length === 0) {
        //         return true;
        //     }
        //     try {
        //         run.clone().add(...input);
        //         return true;
        //     } catch (e) {
        //         return e;
        //     }
        // };
        // const validate = (input: Card | null) => {
        //     if (!input) {
        //         return true;
        //     }
        //     try {
        //         run.clone().add(input);
        //     } catch (e) {
        //         return e;
        //     }
        // };
        const error = p('');
        const handleResponse = () => {
            const toPlay = cards.map((_, i) => i).filter(i => (form[i] as HTMLInputElement).checked);
            const toPlayCards = cards.filter((_, i) => (form[i] as HTMLInputElement).checked);
            const result = validate(toPlayCards);
            if(result === true) {
                socket.emit('cardsToPlay', toPlay);
                form.remove();
                if(toPlayCards.length) {
                    appendMessage('You played ' + toPlayCards.toString());
                }
            } else {
                error.innerText = result.message;
                form.append(error);
            }
        }
        const submitName = button('Submit', handleResponse);
        form.append(submitName);
        formsRegion.append(form);
    } );


    socket.connected = true; // THIS FIXES BUT IS INFURIATING
});

function validateSetSelection(num: number, input: Card[]) {
    if (num === 3) {
        new ThreeCardSet(input);
    } else {
        new FourCardRun(input);
    }
}