import { WebIntermediary } from "./web-intermediary";
import { WebPresenter } from "./web-presenter";
import { GameDriver } from '@cards-ts/core';
import { DefaultBotHandler, defaultParams, GameStateIterator, IntermediaryHandler, StateTransformer, ResponseValidator } from '@cards-ts/can-i-have-that';

const keyname = 'state';

export async function singleplayer(name: string) {
    let handler = new IntermediaryHandler(new WebIntermediary(new WebPresenter()));
    
    const names = [name, 'Joe', 'Larry', 'Hank'];
    
    const stateTransformer = new StateTransformer();
    const gameState = stateTransformer.initialState({ gameParams: defaultParams, names });
    const iterator = new GameStateIterator();
    const responseValidator = new ResponseValidator();

    const driver = new GameDriver([handler, new DefaultBotHandler(), new DefaultBotHandler(), new DefaultBotHandler()], gameState, iterator, stateTransformer, responseValidator);

    await driver.start();
}

export function hasSave() {
    return localStorage.getItem(keyname);
}

export async function singleplayerFromSave() {
    let handler = new IntermediaryHandler(new WebIntermediary(new WebPresenter()));
    // handler.setName(name);
    
    const savedJSON = localStorage.getItem(keyname);
    if(!savedJSON) {
        throw new Error('Save does not exist');
    }
    localStorage.removeItem(keyname);

    const stateTransformer = new StateTransformer();
    const savedState = stateTransformer.fromStr(savedJSON);
    const iterator = new GameStateIterator();
    const responseValidator = new ResponseValidator();

    const driver = new GameDriver([handler, new DefaultBotHandler(), new DefaultBotHandler()], savedState, iterator, stateTransformer, responseValidator);

    await driver.start();
}