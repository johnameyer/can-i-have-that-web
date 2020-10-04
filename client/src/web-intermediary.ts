import { Intermediary, Serializable, Presenter, DisplayElement } from "@cards-ts/core";
import { DisplayElementCallReturn } from "@cards-ts/core/lib/intermediary/display-element";
import { WebPresenter } from "./web-presenter";

export class WebIntermediary implements Intermediary {
    constructor(private readonly presenter: WebPresenter) { }

    print(...printables: Serializable[]): [] {
        this.presenter.print({ message: printables })();
        return [];
    }

    form<T extends keyof Presenter>(first: DisplayElement<T>): [sent: undefined | Promise<void>, received: Promise<[DisplayElementCallReturn<T>]>];
    form<T extends keyof Presenter, U extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>): [sent: undefined | Promise<void>, received: Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>]>];
    form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>): [sent: undefined | Promise<void>, received: Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>]>];
    form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter, W extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>, fourth: DisplayElement<W>): [sent: undefined | Promise<void>, received: Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>, DisplayElementCallReturn<W>]>];
    form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter, W extends keyof Presenter, X extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>, fourth: DisplayElement<W>, fifth: DisplayElement<X>): [sent: undefined | Promise<void>, received: Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>, DisplayElementCallReturn<W>, DisplayElementCallReturn<X>]>];
    form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter, W extends keyof Presenter, X extends keyof Presenter, Y extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>, fourth: DisplayElement<W>, fifth: DisplayElement<X>, sixth: DisplayElement<Y>): [sent: undefined | Promise<void>, received: Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>, DisplayElementCallReturn<W>, DisplayElementCallReturn<X>, DisplayElementCallReturn<Y>]>];
    form<T extends keyof Presenter, U extends keyof Presenter, V extends keyof Presenter, W extends keyof Presenter, X extends keyof Presenter, Y extends keyof Presenter, Z extends keyof Presenter>(first: DisplayElement<T>, second: DisplayElement<U>, third: DisplayElement<V>, fourth: DisplayElement<W>, fifth: DisplayElement<X>, sixth: DisplayElement<Y>, seventh: DisplayElement<Z>): [sent: undefined | Promise<void>, received: Promise<[DisplayElementCallReturn<T>, DisplayElementCallReturn<U>, DisplayElementCallReturn<V>, DisplayElementCallReturn<W>, DisplayElementCallReturn<X>, DisplayElementCallReturn<Y>, DisplayElementCallReturn<Z>]>];
    form(...components: DisplayElement<keyof Presenter>[]): [sent: undefined | Promise<void>, received: Promise<DisplayElementCallReturn<keyof Presenter>[]>] {
        this.presenter.beginGroup();
        for(const component of components) {
            const func = this.presenter[component.type];
            // @ts-ignore
            func.bind(this.presenter)(component);
        }

        return [, this.presenter.getValues()];
    }

}