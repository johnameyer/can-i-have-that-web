import { GameDriver, LocalMaximumHandler, defaultParams, GameState, IntermediaryHandler } from "can-i-have-that";
import { WebIntermediary } from "./web-intermediary";
import { WebPresenter } from "./web-presenter";

const keyname = 'state';

class CommitingGameDriver extends GameDriver {
    async iterate() {
        localStorage.setItem(keyname, JSON.stringify(this.gameState));
        await super.iterate();
    }
}

export async function singleplayer(name: string) {
    let handler = new IntermediaryHandler(new WebIntermediary(new WebPresenter()));
    handler.setName(name);
    
    const driver = new CommitingGameDriver([handler, new LocalMaximumHandler(), new LocalMaximumHandler()], defaultParams);
    await driver.start();
}

export function hasSave() {
    return localStorage.getItem(keyname);
}

export async function singleplayerFromSave(name: string) {
    let handler = new IntermediaryHandler(new WebIntermediary(new WebPresenter()));
    handler.setName(name);
    
    const savedJSON = localStorage.getItem(keyname);
    if(!savedJSON) {
        throw new Error('Save does not exist');
    }
    const savedState = GameState.fromObj(JSON.parse(savedJSON));
    localStorage.removeItem(keyname);

    const driver = new CommitingGameDriver([handler, new LocalMaximumHandler(), new LocalMaximumHandler()], defaultParams, savedState);
    await driver.start();
}