import { Card, ThreeCardSet, FourCardRun, Run, Message } from "can-i-have-that";
import { appendMessage, create, p, cardDisplay, cardItem, button, cardContainer, cardDragItem, getFormsRegion, input } from "./dom-helpers";
import { dragSegments } from "drag-drop-regions";

type Handler<T> = (response: T) => void;

export namespace UIDelegate {
    export function message(message: Message) {
        console.log(message);
        appendMessage(message.message);
    }

    export function wantCard(card: Card, hand: Card[], handler: Handler<[boolean]>) {
        const container = create('div');
        container.append(p("You have"));
        container.append(cardDisplay(hand));
        const cardImage = cardItem(card);
        cardImage.style.verticalAlign = 'middle';
        container.append(p('Do you want ', cardImage, '?'));
        const handleResponse = (response: boolean) => () => {
            handler([response]);
            container.remove();
            appendMessage('You ' + (response ? 'picked ' : 'did not pick ') + 'up the ' + card.toString());
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        getFormsRegion().append(container);
    }

    export function wantToGoDown(hand: Card[], handler: Handler<boolean>) {
        const container = create('div');
        container.append(p('Do you want to go down?'));
        container.append(p("You have"));
        container.append(cardDisplay(hand));
        const handleResponse = (response: boolean) => () => {
            handler(response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        getFormsRegion().append(container);
    }

    export function moveToTop(handler: Handler<boolean>) {
        const container = create('div');
        container.append(p('Do you want to move the wild to the top?'));
        const handleResponse = (response: boolean) => () => {
            handler(response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        getFormsRegion().append(container);
    }

    export function selectCards(cards: Card[], num: 3 | 4, handler: Handler<Card[]>) {
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
            const result = validate(toPlayCards);
            if(result === true) {
                form.remove();
                handler(toPlayCards);
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
        getFormsRegion().append(form);        
    }

    export function discardChoice(cards: Card[], live: Card[], handler: Handler<Card>) {
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
                handler(toDiscard);
                form.remove();
                appendMessage('You discarded ' + toDiscard.toString());
            } else {
                error.innerText = toDiscard.toString() + ' is a live card';
                form.append(error);
            }
        }

        const options = dragSegments(cardContainer,[[...cards], []], cardDragItem, handleResponse, [-1, 1], [() => true, ([card]) => card ? validate(card) : false]);
        form.append(options);
        getFormsRegion().append(form);
    }

    export function insertWild(run: Card[], handler: Handler<number>) {
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
                handler(insert);
                form.remove();
            } else {
                error.innerText = '';
                form.append(error);
            }
        }
        const submit = button('Submit', handleResponse);
        form.append(submit);
        getFormsRegion().append(form);
    }

    export function wantToPlay(played: Run[], cards: Card[], handler: Handler<boolean>) {
        const container = create('div');
        container.append(p('Would you like to play a card?'));
        container.append(p("You have"));
        container.append(cardDisplay(cards));
        container.append(p('Others have played'));
        container.append(p(...played.map(run => [run.toString(), create('br')]).flat()));
        //TODO own hand shows up
        const handleResponse = (response: boolean) => () => {
            handler(response);
            container.remove();
        }
        container.append(button('Yes', handleResponse(true)));
        container.append(button('No', handleResponse(false)));
        getFormsRegion().append(container);
    }

    export function whichPlay(runs: Run[], cards: Card[], handler: Handler<Run>) {
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
            handler(runs[Number(options.value)]);
            container.remove();
        }
        const submit = button('Submit', handleResponse);
        container.append(submit);
        getFormsRegion().append(container);
    }

    export function cardsToPlay(cards: Card[], run: Run, handler: Handler<Card[]>) {
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
        const submitName = button('Submit', handleResponse);
        form.append(submitName);
        getFormsRegion().append(form);
    }

    export function setupLobby(singleplayer: (name: string) => void, multiplayer: (name: string) => void) {
        const form = create('form');
        form.onsubmit = (e) => e.preventDefault();
        form.append('Your name: ');
        const name = input('Name');
        form.append(name);
        const singleplayerButton = button('Singleplayer', () => {
            singleplayer(name.value);
            form.remove();
        });
        form.append(singleplayerButton);
        const multiplayerButton = button('Multiplayer', () => {
            multiplayer(name.value);
            form.remove();
        });
        multiplayerButton.disabled = true;
        multiplayerButton.id = 'multiplayer';
        form.append(multiplayerButton);
        getFormsRegion().append(form);
    }

    export function enableMultiplayer() {
        const multiplayerButton = document.getElementById('multiplayer') as HTMLButtonElement;
        if(multiplayerButton) {
            multiplayerButton.disabled = false;
        }
    };

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

function validateSetSelection(num: number, input: Card[]) {
    if (num === 3) {
        new ThreeCardSet(input);
    } else {
        new FourCardRun(input);
    }
}