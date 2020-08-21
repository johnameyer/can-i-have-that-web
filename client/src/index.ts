import { UIDelegate } from "./ui-delegate";

(window as any).initLogRocket && (window as any).initLogRocket();

document.addEventListener("DOMContentLoaded", async function(){
    // TODO add loop
    const singleplayer = (name: string) => {
        import("./singleplayer").then(({singleplayer}) => singleplayer(name));
    }

    const multiplayer = (username: string, name: string, host?: string) => {
        import('./multiplayer').then(({multiplayer}) => multiplayer(username, name, host));
    }
    UIDelegate.setupLobby(singleplayer, multiplayer);
});