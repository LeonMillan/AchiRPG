const __Game_Interpreter__updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode = function() {
    let waiting = false;
    if (this._waitMode === 'archi_check') {
        const checkedLocation = ArchiRPG.API.getScoutedItem(this._archi_checkLocation);
        if (checkedLocation) {
            ArchiRPG.API.showUnlockedItems([checkedLocation]);
        } else {
            waiting = true;
        }
    }
    if (waiting) return true;
    return __Game_Interpreter__updateWaitMode.call(this);
}

// TODO: remove these
declare const Game_Interpreter: any;
