import { appendMessage, create, p, cardDisplay, cardItem, button, cardContainer, cardDragItem, getFormsRegion, input, getWaitingRegion } from './dom-helpers';
import { dragSegments } from 'drag-drop-regions';
import { hasSave, singleplayerFromSave } from './singleplayer';
import { Message, Card, ThreeCardSet, Meld, FourCardRun } from '@cards-ts/core';

type Handler<T> = (response: T) => void;

export namespace UIDelegate {
    //TODO move up into main library
    export function message(message: Message) {
        appendMessage(Message.defaultTransformer(message.components));
    }

    export function waitingFor(who: string | undefined) {
        if(who) {
            getWaitingRegion().appendChild(p('Waiting for ' + who + ' to decide'));
        } else {
            getWaitingRegion().innerHTML = '';
        }
    }

    export function setupLobby(singleplayer: (name: string) => void, multiplayer: (username: string, name: string, host?: string) => void) {
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

        if(hasSave()) {
            form.append(create('br'));
            form.append(create('br'));

            const singleplayerFromSaveButton = button('Resume Bot Game', () => {
                singleplayerFromSave();
                form.remove();
            });
            form.append(singleplayerFromSaveButton);
        }

        form.append(create('br'));
        form.append(create('br'));

        form.append('or');
        
        form.append(create('br'));
        form.append(create('br'));


        form.append('Username: ');
        const username = input('Username');
        form.append(username);
        form.append(create('br'));

        form.append('Server: ');

        const server = input('Server');
        form.append(server);

        const serverConnect = button('Play Online', () => {
            multiplayer(username.value, name.value, server.value || undefined);
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

function validateSetRange(run: Meld, input: Card[]) {
    if (run.runType === 3) {
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