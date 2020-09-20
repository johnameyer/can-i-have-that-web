import { DisplayElement, Intermediary, Message, Presenter } from "can-i-have-that";
import { DisplayElementCallReturn } from "can-i-have-that/dist/intermediary/display-element";
import { Serializable } from "can-i-have-that/dist/intermediary/presenter";
import { WebPresenter } from "./web-presenter";

export class WebIntermediary implements Intermediary {
    constructor(private readonly presenter: WebPresenter) { }

    print(...printables: Serializable[]): void {
        this.presenter.print({ message: printables })();
    }

    async form<T extends keyof Presenter>(first: DisplayElement<T>): Promise<[DisplayElementCallReturn<T>]>;
    async form<T extends keyof Presenter, U extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>): Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>]>;
    async form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>): Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>]>;
    async form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter, W extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>, fourth: DisplayElement<W>): Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>, DisplayElementCallReturn<W>]>;
    async form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter, W extends keyof Presenter, X extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>, fourth: DisplayElement<W>, fifth: DisplayElement<X>): Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>, DisplayElementCallReturn<W>, DisplayElementCallReturn<X>]>;
    async form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter, W extends keyof Presenter, X extends keyof Presenter, Y extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>, fourth: DisplayElement<W>, fifth: DisplayElement<X>, sixth: DisplayElement<Y>): Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>, DisplayElementCallReturn<W>, DisplayElementCallReturn<X>, DisplayElementCallReturn<Y>]>;
    async form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter, W extends keyof Presenter, X extends keyof Presenter, Y extends keyof Presenter, Z extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>, fourth: DisplayElement<W>, fifth: DisplayElement<X>, sixth: DisplayElement<Y>, seventh: DisplayElement<Z>): Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>, DisplayElementCallReturn<W>, DisplayElementCallReturn<X>, DisplayElementCallReturn<Y>, DisplayElementCallReturn<Z>]>;
    async form(...components: DisplayElement<keyof Presenter>[]): Promise<DisplayElementCallReturn<keyof Presenter>[]> {
        this.presenter.beginGroup();
        for(const component of components) {
            const func = this.presenter[component.type];
            // @ts-ignore
            func.bind(this.presenter)(component);
        }

        const values = await this.presenter.getValues();
        return values;
    }

}