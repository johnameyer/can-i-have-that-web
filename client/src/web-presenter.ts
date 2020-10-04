import { appendMessage, create, p, cardDisplay, cardItem, button, cardContainer, cardDragItem, getFormsRegion, input, getWaitingRegion, div } from './dom-helpers';
import { dragSegments } from "drag-drop-regions";
import { Card, Message, Presenter, Serializable } from '@cards-ts/core';
import { DisplayElementCallReturn } from '@cards-ts/core/lib/intermediary/display-element';

const isDefined = function<T>(t: T | undefined): t is T {
    return t !== undefined;
}

const transformer: Message.Transformer = (components, separator = ' ') => components.map(component => {
    if(typeof component === 'string') {
        return component;
    }
    if(Array.isArray(component)) {
        if(component.every(element => element instanceof Card)) {
            // @ts-ignore
            return transformer(component, ' ');
        }
        // @ts-ignore
        return transformer(component, ', ');
    }
    if(component instanceof Card) {
        return cardItem(component).outerHTML;
    }
    
    return component;
}).join(separator);

const singularTransformer = (component: Serializable) => {
    if(component instanceof Card) {
        return cardItem(component);
    }
    return p((component || '') as string);
}

export class WebPresenter implements Presenter {
    private values!: (() => DisplayElementCallReturn<keyof Presenter>)[];
    private checks!: (undefined | ((value: any) => boolean))[];
    private promise!: Promise<DisplayElementCallReturn<keyof Presenter>[]>;
    private resolver!: (args: DisplayElementCallReturn<keyof Presenter>[]) => void;
    private form!: HTMLFormElement;
    private resolverBound!: boolean;

    beginGroup() {
        this.values = [];
        this.checks = [];
        this.promise = new Promise(resolve => this.resolver = resolve);
        this.form = create('form');
        this.resolverBound = false;
        getFormsRegion().append(this.form);
    }

    async getValues() {
        if(!this.resolverBound) {
            this.form.append(button('Confirm', this.resolve.bind(this)));
        }

        return await this.promise.then(values => {
            this.form.remove();
            // @ts-ignore
            this.form = undefined;
            return values;
        });
    }

    public resolve() {
        if(this.checks.filter(isDefined).every((check, i) => check(this.values[i]))) {
            this.form.remove();
            this.resolver(this.values.map(value => value()));
        }
    }

    
    printCards(options: { cards: Card[]; }): () => Card[] | Promise<Card[]> {
        const container = div();
        
        const dragArea = dragSegments(cardContainer, [options.cards], cardDragItem);
        container.append(dragArea);

        this.form.append(container);

        this.checks.push(undefined);
        this.values.push(() => options.cards);

        return () => options.cards;
    }

    confirm(options: { message: Serializable[]; }): () => Promise<boolean> {
        this.checks.push(undefined);
        this.resolverBound = true;
        const promise = new Promise<boolean>(resolve => {
            const container = div();

            container.insertAdjacentHTML('beforeend', transformer(options.message));
            container.append(create('br'));

            let value: boolean;
            const handle = (response: boolean) => {
                value = response;
                resolve(response);
                this.resolve();
            }
            this.values.push(() => value);

            container.append(button('Yes', () => handle(true)));
            container.append(button('No', () => handle(false)));

            this.form.append(container);
        });

        
        return () => promise;
    }

    checkbox<T extends Serializable, ValidateParam = undefined>(options: { message: Serializable[]; choices: { name: string; value: T; }[]; validate?: ((input: T[], param: ValidateParam) => string | true | Promise<string | true>) | undefined; validateParam: ValidateParam; }) {
        const div = create('div');

        const error = p('');

        div.insertAdjacentHTML('beforeend', transformer(options.message));
        
        const chosen: T[] = [];

        const validate = (value: T[]) => {
            if(!options.validate) {
                return true;
            }
            const validated = options.validate(value, options.validateParam);
            if(typeof validated === 'string') {
                error.innerText = validated;
                div.append(error);
                return false;
            }
            error.remove();
            return true;
        };

        const dragArea = dragSegments(cardContainer, [options.choices.map(option => option.value), chosen], (component) => singularTransformer(component), undefined, undefined, [() => true, (choice) => validate(choice)]);
        div.append(dragArea);

        this.form.append(div);

        this.checks.push(validate);
        
        this.values.push(() => chosen);
        return () => chosen;
    }

    list<T extends Serializable>(options: { message: Serializable[]; choices: { name: string; value: T; }[]; }) {
        const div = create('div');

        div.insertAdjacentHTML('beforeend', transformer(options.message));

        const chosen: T[] = [];

        const dragArea = dragSegments(cardContainer, [options.choices.map(option => option.value), chosen], (component) => singularTransformer(component), undefined, [-1, 1], [() => true, (chosen) => chosen.length === 1]);
        div.append(dragArea);

        this.form.append(div);

        this.checks.push((chosen) => chosen !== undefined);
        this.values.push(() => chosen[0]);
        return () => chosen[0];
    }

    input<ValidateParam = undefined>(options: { message: Serializable[]; validate?: ((input: string, param: ValidateParam) => string | true | Promise<string | true>) | undefined; validateParam: ValidateParam; }) {
        const div = create('div');

        div.insertAdjacentHTML('beforeend', transformer(options.message));

        const error = p('');

        const input = create('input');
        div.append(input);

        this.form.append(div);

        this.checks.push(value => {
            if(!options.validate) {
                return true;
            }
            const validated = options.validate(value, options.validateParam);
            if(typeof validated === 'string') {
                error.innerText = validated;
                div.append(error);
                return false;
            }
            error.remove();
            return true;
        });
        this.values.push(() => input.value);
        return () => input.value;
    }

    place<T extends Serializable, ValidateParam = undefined>(options: { message: Serializable[]; choices: { name: string; value: T; }[]; placeholder: string; validate?: ((input: number, param: ValidateParam) => string | true | Promise<string | true>) | undefined; validateParam: ValidateParam; }) {
        const div = create('div');
        div.insertAdjacentHTML('beforeend', transformer(options.message));

        const select = create('select');
        const before = create('option');
        before.innerText = 'Before ' + options.choices[0].name;
        before.value = '0';
        select.append(before);
        for(let i = 1; i < options.choices.length; i++) {
            const option = create('option');
            option.innerText = 'Between ' + options.choices[i - 1].name + ' and ' + options.choices[i].name;
            option.value = String(i);
            select.append(option);
        }
        const after = create('option');
        after.innerText = 'After ' + options.choices[options.choices.length - 1].name;
        after.value = String(options.choices.length);
        select.append(after);
        select.append(after);
        div.append(select);
        
        const error = p('');
        this.checks.push(value => {
            if(!options.validate) {
                return true;
            }
            const validated = options.validate(value, options.validateParam);
            if(typeof validated === 'string') {
                error.innerText = validated;
                div.append(error);
                return false;
            }
            error.remove();
            return true;
        });
        
        this.form.append(div);

        this.values.push(() => Number(select.value));
        return () => Number(select.value);
    }

    print(options: {message: Serializable[]}): () => void {
        if(options.message) {
            if(this.form) {
                // TODO consider messages coming in at same time as form is open
                this.form.insertAdjacentHTML('beforeend', transformer(options.message));
                this.form.append(create('br'));
            } else {
                appendMessage(transformer(options.message));
            }
        }
        if(this.checks) {
            this.checks.push(undefined);
        }
        if(this.values) {
            this.values.push(() => undefined);
        }
        return () => undefined;
    }
}