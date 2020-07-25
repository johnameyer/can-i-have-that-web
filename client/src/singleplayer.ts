import { GameDriver, LocalMaximumHandler, defaultParams, GameState } from "can-i-have-that";
import { WebHandler } from "./web-handler";

const keyname = 'state';

class CommitingGameDriver extends GameDriver {
    async iterate() {
        localStorage.setItem(keyname, JSON.stringify(this.gameState));
        await super.iterate();
    }
}

export async function singleplayer(name: string) {
    let handler = new WebHandler(name);
    
    const driver = new CommitingGameDriver([handler, new LocalMaximumHandler(), new LocalMaximumHandler()], defaultParams);
    await driver.start();
}

export function hasSave() {
    return localStorage.getItem(keyname);
}

export async function singleplayerFromSave(name: string) {
    let handler = new WebHandler(name);
    
    const savedJSON = localStorage.getItem(keyname);
    if(!savedJSON) {
        throw new Error('Save does not exist');
    }
    const savedState = GameState.fromObj(JSON.parse(savedJSON));
    localStorage.removeItem(keyname);

    const driver = new CommitingGameDriver([handler, new LocalMaximumHandler(), new LocalMaximumHandler()], defaultParams, savedState);
    await driver.start();
}