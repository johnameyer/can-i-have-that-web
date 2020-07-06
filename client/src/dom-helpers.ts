import { Card, Rank } from "can-i-have-that";

export const getEventsRegion = () => {
    const element = document.getElementById('events');
    if(!element) {
        throw new Error('Cannot find element #events');
    }
    return element;
}

export const getFormsRegion = () => {
    const element = document.getElementById('form');
    if(!element) {
        throw new Error('Cannot find element #form');
    }
    return element;
}

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

export const create = function<T extends keyof HTMLElementTagNameMap>(t: T): HTMLElementTagNameMap[T] { return document.createElement(t) };

export const input = function(str: string) {
    const input = create('input');
    input.innerText = str;
    return input;
}

export const p = function(...children: (string | HTMLElement)[]) {
    const p = create('p');
    p.append(...children);
    return p;
}

export const div = function(...contents: HTMLElement[]) {
    const div = create('div');
    div.append(...contents);
    return div;
}

export const img = function(str: string, attrs: any = {}) {
    const img = create('img');
    img.src = str;
    Object.assign(img, attrs);
    return img;
}

export const button = function(str: string, func: () => any) {
    const button = create('button');
    button.innerText = str;
    button.onclick = function(e) { e.preventDefault(); func(); }
    return button;
}

export const cardContainer = () => {
    let internalContainer = div();
    internalContainer.className = "container";
    return internalContainer;
};

export const cardItem = (card: Card): HTMLImageElement => {
    let result = img(cardToURL(card));
    result.classList.add('card');
    return result;
};

export const cardDragItem = (card: Card): HTMLImageElement => {
    let result = cardItem(card);
    result.classList.add('drag-card');
    return result;
};

export const cardDisplay = (cards: Card[]) => {
    const container = cardContainer();
    for(const card of cards) {
        container.append(cardItem(card));
    }
    return container;
}

export const appendMessage = (message: string) => {
    const eventsRegion = getEventsRegion();
    const shouldScroll = eventsRegion.scrollHeight - eventsRegion.scrollTop - eventsRegion.clientHeight < 10;
    const element = p(message);
    eventsRegion.append(element);
    if(shouldScroll) {
        element.scrollIntoView();
    }
};