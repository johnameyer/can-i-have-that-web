import { Card } from "@cards-ts/core";

export type OrderingData = {
    hand: Card[];
    discardedCard?: Card;
    wantBack: boolean;
};