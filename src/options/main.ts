import { InitialParty, SaveAccess } from "./types";

const { Game_Party, Game_System } = window;

const __Game_System__isSaveEnabled = Game_System.prototype.isSaveEnabled;
Game_System.prototype.isSaveEnabled = function() {
    const saveAccess = ArchiRPG.API.getGameOption("saveAccess");
    if (saveAccess === SaveAccess.AlwaysEnabled) return true;
    if (saveAccess === SaveAccess.AlwaysDisabled) return false;
    return __Game_System__isSaveEnabled.call(this);
}

const __Game_Party__setupStartingMembers = Game_Party.prototype.setupStartingMembers;
Game_Party.prototype.setupStartingMembers = function() {
    const initialParty = ArchiRPG.API.getGameOption("initialParty", InitialParty.Vanilla);
    if (initialParty === InitialParty.Vanilla) {
        return __Game_Party__setupStartingMembers.call(this);
    } 
    this._actors = [initialParty];
}
