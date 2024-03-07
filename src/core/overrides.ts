import { CLIENT_STATUS } from "archipelago.js";
import { InitialParty, SaveAccess } from "../Types";
import { makeCommandNameMV } from "../Utils";
import * as API from "./api";

import './augment/Game_System';

const {
    Game_Party,
    Game_System,
} = window;

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

const __Game_System__isSaveEnabled = Game_System.prototype.isSaveEnabled;
Game_System.prototype.isSaveEnabled = function() {
    if (ArchiRPG.options.saveAccess === SaveAccess.AlwaysEnabled) return true;
    if (ArchiRPG.options.saveAccess === SaveAccess.AlwaysDisabled) return false;
    return __Game_System__isSaveEnabled.call(this);
}

const __Game_Party__setupStartingMembers = Game_Party.prototype.setupStartingMembers;
Game_Party.prototype.setupStartingMembers = function() {
    if (ArchiRPG.options.initialParty === InitialParty.Vanilla) {
        return __Game_Party__setupStartingMembers.call(this);
    } 
    this._actors = [ArchiRPG.options.initialParty];
}

const __Game_Interpreter__updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode = function() {
    let waiting = __Game_Interpreter__updateWaitMode.call(this);
    if (this._waitMode === 'archi_check') {
        const checkedLocation = ArchiRPG.knownLocations[this._archi_checkLocation];
        if (checkedLocation) {
            API.showUnlockedItems([checkedLocation]);
        } else {
            waiting = true;
        }
    }
    if (!waiting) {
        this._waitMode = '';
    }
    return waiting;
}

// Check for MV/MZ interop
if (Game_Interpreter.requestImagesByPluginCommand) {
    const __Game_Interpreter__requestImagesByPluginCommand = Game_Interpreter.requestImagesByPluginCommand;
    Game_Interpreter.requestImagesByPluginCommand = function(commandName: string, args: string[]) {
        if (commandName === makeCommandNameMV('autopatchCheck')) {
            const [location] = args;
            API.locationScout(location);
        }
        if (commandName === makeCommandNameMV('locationCheck')) {
            const [location] = args;
            API.locationScout(location);
        }
        if (commandName === makeCommandNameMV('locationScout')) {
            const [location] = args;
            API.locationScout(location);
        }
        __Game_Interpreter__requestImagesByPluginCommand.call(this, commandName, args);
    };
} else {

}

// TODO: remove these
declare const DataManager: any;
declare const Scene_Title: any;
declare const Game_Interpreter: any;
