import { GameDriver, LocalMaximumHandler, defaultParams } from "can-i-have-that";
import { WebHandler } from "./web-handler";

export async function singleplayer(name: string) {
    let handler = new WebHandler(name);
    
    const driver = new GameDriver([handler, new LocalMaximumHandler(), new LocalMaximumHandler()], defaultParams);
    await driver.start();
}