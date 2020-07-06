import io from 'socket.io-client';
import { Card, ThreeCardSet, checkFourCardRunPossible, Run, runFromObj, Rank, Suit } from 'can-i-have-that';

const socket = io.connect();

(window as any).socket = socket;

socket.on('connect', (obj: any) => console.error('this sucks', obj));
socket.on('connect_error', (obj: any) => console.error('this sucks', obj));
socket.on('connect_timeout', (obj: any) => console.error('this sucks', obj));
socket.on('connecting', (obj: any) => console.error('this sucks', obj));
socket.on('reconnect_error', (obj: any) => console.error('this sucks', obj));
socket.on('error', (obj: any) => console.error('this sucks', obj));

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

    const body = document.body;
    const events = document.createElement('div');
    events.style.height = '50vh';
    events.style.overflowY = 'scroll';
    body.append(events);

    const create = function(type: string){ return document.createElement(type); };

    const br = function(){ return create('br') as HTMLBRElement; };

    const input = function(str: string) {
        const input = create('input') as HTMLInputElement;
        input.innerText = str;
        return input;
    }

    const p = function(str: string) {
        const p = create('p') as HTMLParagraphElement;
        p.innerText = str;
        return p;
    }

    const img = function(str: string) {
        const img = create('img') as HTMLImageElement;
        img.src = str;
        return img;
    }

    const button = function(str: string, func: () => any) {
        const button = create('button') as HTMLButtonElement;
        button.innerText = str;
        button.onclick = function() { func(); }
        return button;
    }

    socket.once('ready', () => {
        socket.emit('start', 1);
        events.innerHTML = '';
        events.append(p('Connected to server'));
    });

    {
        const form = create('form');
        form.onsubmit = () => false;
        const name = input('Name');
        form.append(name);
        const submitName = button('Submit name', () => socket.emit('changeName', name.value));
        form.append(submitName);
        body.insertBefore(form, events);
    }
    
    socket.on('message', function (data: string) {
        console.log(JSON.parse(data));
        events.append(p(JSON.parse(data).message));
    });

    socket.on('wantCard', function(card: Card, hand: Card[]) {
        card = Card.fromObj(card);
        hand = hand.map(Card.fromObj);
        const container = create('div');
        container.append(p('Do you want card ' + card.toString() + '?'));
        container.append(p('You have ' + hand.map(card => card.toString()).join(', ')));
        const handleResponse = (response: boolean) => () => {
            socket.emit('wantCard', response);
            container.remove();
            events.append(p('You ' + (response ? 'picked ' : 'did not pick ') + 'up the ' + card.toString()));
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        body.append(container);
    });

    socket.on('goDown', function(hand: Card[]) {
        hand = hand.map(Card.fromObj);
        const container = create('div');
        container.append(p('Do you want to go down?'));
        container.append(p('You have ' + hand.map(card => card.toString()).join(', ')));
        const handleResponse = (response: boolean) => () => {
            socket.emit('goDown', response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        body.append(container);
    });

    socket.on('moveToTop', function() {
        const container = create('div');
        container.append(p('Do you want to move the wild to the top?'));
        const handleResponse = (response: boolean) => () => {
            socket.emit('moveToTop', response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        body.append(container);
    });

    socket.on('selectCards', function(cards: Card[], num: number) {
        cards = cards.map(Card.fromObj);
        const form = create('form') as HTMLFormElement;
        form.onsubmit = () => false;
        form.append(p('Please select cards in the '  + (num === 3 ? '3 of a kind ' : '4 card run ') + 'or none to exit'));
        const options = create('div');
        for(let i = 0; i < cards.length; i++) {
            const option = create('input') as HTMLInputElement;
            option.type = 'checkbox';
            option.name = String(i);
            option.id = 'select-card-' + i;
            options.append(option);
            const label = create('label') as HTMLLabelElement;
            label.innerText = cards[i].toString();
            label.htmlFor = option.id;
            options.append(label);
        }
        form.append(options);
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
        const handleResponse = () => {
            const toPlay = cards.map((_, i) => i).filter(i => (form[i] as HTMLInputElement).checked);
            const toPlayCards = cards.filter((_, i) => (form[i] as HTMLInputElement).checked);
            const result = validate(toPlayCards);
            if(result === true) {
                socket.emit('selectCards', toPlay);
                form.remove();
                events.append(p('You played ' + toPlayCards.toString()));
            } else {
                error.innerText = result.message;
                form.append(error);
            }
        }
        const submitName = button('Submit', handleResponse);
        form.append(submitName);
        body.append(form);        
    });

    socket.on('discardChoice', function(cards: Card[], live: Card[]) {
        cards = cards.map(Card.fromObj);
        live = live.map(Card.fromObj);
        const form = create('form');
        form.onsubmit = () => false;
        form.append(p('Please select a card to discard'));
        form.append(p('You have ' + cards.map(card => card.toString()).join(', ')));
        const options = create('select') as HTMLSelectElement;
        for(let i = 0; i < cards.length; i++) {
            const option = create('option') as HTMLOptionElement;
            option.innerText = cards[i].toString();
            option.value = String(i);
            options.append(option);
        }
        form.append(options);
        const validate = (choice: Card) => !live.some((card) => choice.equals(card));
        const error = p('');
        const handleResponse = () => {
            const toDiscard = cards[Number(options.value)];
            if(validate(toDiscard)) {
                socket.emit('discardChoice', Number(options.value));
                form.remove();
                events.append(p('You discarded ' + toDiscard.toString()));
            } else {
                error.innerText = toDiscard.toString() + ' is a live card';
                form.append(error);
            }
            events.append(img(cardToURL(toDiscard)));
        }
        const submit = button('Submit', handleResponse);
        form.append(submit);
        body.append(form);
    });

    socket.on('insertWild', function(run: Card[]) {
        run = run.map(Card.fromObj);
        const form = create('form');
        form.onsubmit = () => false;
        form.append(p('Please choose where to insert your wild cards'));
        const options = create('select') as HTMLSelectElement;
        const before = create('option') as HTMLOptionElement;
        before.innerText = 'Before' + run[0].toString();
        before.value = '0';
        options.append(before);
        for(let i = 1; i < run.length; i++) {
            const option = create('option') as HTMLOptionElement;
            option.innerText = 'Between ' + run[i - 1].toString() + ' and ' + run[i].toString();
            option.value = String(i);
            options.append(option);
        }
        const after = create('option') as HTMLOptionElement;
        after.innerText = 'After ' + run[run.length - 1].toString();
        after.value = String(run.length);
        after.append(after);
        options.append(after);
        form.append(options);
        const validate = () => true; //TODO
        const error = p('');
        const handleResponse = () => {
            const insert = Number(options.value);
            const result = validate();
            if(result == true) {
                socket.emit('insertWild', insert);
                form.remove();
            } else {
                error.innerText = '';
                form.append(error);
            }
        }
        const submit = button('Submit', handleResponse);
        form.append(submit);
        body.append(form);
    });

    socket.on('beginTurn', function(run: Card[]) {
    });

    socket.on('endTurn', function(run: Card[]) {
    });

    socket.on('playCard', function(cards: Card[], played: Run[]) {
        cards = cards.map(Card.fromObj);
        played = played.map(runFromObj);
        const container = create('div');
        container.append(p('Would you like to play a card on your runs?'));
        container.append(p('You still have ' + cards.join(', ')));
        container.append(p('You have played ' + played.join('\n ')));
        const handleResponse = (response: boolean) => () => {
            socket.emit('playCard', response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        body.append(container);
    });

    socket.on('playMoreCard', function(cards: Card[], played: Run[]) {
        cards = cards.map(Card.fromObj);
        played = played.map(runFromObj);
        const container = create('div');
        container.append(p('Would you like to play more cards on your runs?'));
        container.append(p('You still have ' + cards.join(', ')));
        container.append(p('You have played ' + played.join('\n ')));
        const handleResponse = (response: boolean) => () => {
            socket.emit('playMoreCard', response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        body.append(container);
    });

    socket.on('wouldPlay', function(cards: Card[], played: Run[][]) {
        cards = cards.map(Card.fromObj);
        played = played.map(cards => cards.map(runFromObj));
        const container = create('div');
        container.append(p('Would you like to play a card on others?'));
        container.append(p('You still have ' + cards.join(', ')));
        container.append(p('Others have played ' + played.join('\n ')));
        //TODO own hand shows up
        const handleResponse = (response: boolean) => () => {
            socket.emit('wouldPlay', response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        body.append(container);
    });

    socket.on('whichPlay', function(runs: Run[], cards: Card[]) {
        runs = runs.map(runFromObj);
        cards = cards.map(Card.fromObj);
        const form = create('form');
        form.onsubmit = () => false;
        form.append(p('Please select a run to play on'));
        form.append(p('You have ' + cards.map(card => card.toString()).join(', ')));
        form.append(p('Others have played ' + runs.map(run => run.toString()).join(', ')));
        const options = create('select') as HTMLSelectElement;
        for(let i = 0; i < runs.length; i++) {
            const option = create('option') as HTMLOptionElement;
            option.innerText = runs[i].toString();
            option.value = String(i);
            options.append(option);
        }
        form.append(options);
        const handleResponse = () => {
            socket.emit('whichPlay', Number(options.value));
            form.remove();
        }
        const submit = button('Submit', handleResponse);
        form.append(submit);
        body.append(form);

    } );
    
    socket.on('playOn', function(runs: Run[], cards: Card[]) {
        console.log(runs);
        runs = runs.map(runFromObj);
        cards = cards.map(Card.fromObj);
        const form = create('form');
        form.onsubmit = () => false;
        form.append(p('Please select a run to play on'));
        form.append(p('You have ' + cards.map(card => card.toString()).join(', ')));
        form.append(p('You have played ' + runs.map(run => run.toString()).join(', ')));
        const options = create('select') as HTMLSelectElement;
        for(let i = 0; i < runs.length; i++) {
            const option = create('option') as HTMLOptionElement;
            option.innerText = runs[i].toString();
            option.value = String(i);
            options.append(option);
        }
        form.append(options);
        const handleResponse = () => {
            socket.emit('playOn', Number(options.value));
            form.remove();
        }
        const submit = button('Submit', handleResponse);
        form.append(submit);
        body.append(form);
    } );

    socket.on('cardsToPlay', function(cards: Card[], run: Run) {
        cards = cards.map(Card.fromObj);
        run = runFromObj(run);
        const form = create('form') as HTMLFormElement;
        form.onsubmit = () => false;
        form.append(p('Please select cards to add to the ' + run.toString()));
        const options = create('div');
        for(let i = 0; i < cards.length; i++) {
            const option = create('input') as HTMLInputElement;
            option.type = 'checkbox';
            option.name = String(i);
            option.id = 'select-card-' + i;
            options.append(option);
            const label = create('label') as HTMLLabelElement;
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
                socket.emit('selectCards', toPlay);
                form.remove();
                events.append(p('You played ' + toPlayCards.toString()));
            } else {
                error.innerText = result.message;
                form.append(error);
            }
        }
        const submitName = button('Submit', handleResponse);
        form.append(submitName);
        body.append(form);
    } );


    socket.connected = true; // THIS FIXES BUT IS INFURIATING
});

function validateSetSelection(num: number, input: Card[]) {
    if (num === 3) {
        new ThreeCardSet(input);
    } else {
        checkFourCardRunPossible(input);
    }
}