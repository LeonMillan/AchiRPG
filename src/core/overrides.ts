import { CLIENT_STATUS } from "archipelago.js";

import './augment/Game_System';
import './augment/Game_Temp';

import './override/checkWait';
import './override/prefetchScout';
import './override/shop';

const __DataManager__setupNewGame = DataManager.setupNewGame;
DataManager.setupNewGame = function() {
    __DataManager__setupNewGame.call(this);
    ArchiRPG.API.startGame();
}

const __Scene_Title__start = Scene_Title.start;
Scene_Title.start = function() {
    __Scene_Title__start.call(this);
    ArchiRPG.client.updateStatus(CLIENT_STATUS.READY);
}

// TODO: remove these
declare const DataManager: any;
declare const Scene_Title: any;
