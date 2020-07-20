import { Card } from 'can-i-have-that';

export type OrderingData = {
    hand: Card[];
    discardedCard?: Card;
    wantBack: boolean;
};