import { makeDeathCause } from './deathCause';
import { Params } from './parameters';

const __BattleManager__processDefeat = BattleManager.processDefeat;
BattleManager.processDefeat = function() {
    __BattleManager__processDefeat.call(this);
    if (!ArchiRPG.API.isDeathlinkParticipant()) return;
    if (Params.DEATHLINK_TRIGGER !== 'auto') return;
    if (Params.DEATHLINK_MODE !== 'party') return;
    
    const cause = makeDeathCause();
    ArchiRPG.API.triggerDeathlink(cause);
};

const __Game_Actor__die = Game_Actor.prototype.die;
Game_Actor.prototype.die = function() {
    __Game_Actor__die.call(this);
    
    if (!ArchiRPG.API.isDeathlinkParticipant()) return;
    if (Params.DEATHLINK_TRIGGER !== 'auto') return;
    if (Params.DEATHLINK_MODE !== 'actor') return;
    
    const actorIndex = this.index();
    const cause = makeDeathCause(actorIndex);
    ArchiRPG.API.triggerDeathlink(cause);
};

const __Scene_Base__checkGameover = Scene_Base.prototype.checkGameover;
Scene_Base.prototype.checkGameover = function() {
    if ($gameParty.isAllDead()) {
        if (Params.DEATHLINK_MODE === 'party' &&
            Params.DEATHLINK_TRIGGER === 'auto'
        ) {
            const cause = makeDeathCause();
            ArchiRPG.API.triggerDeathlink(cause);
        }
    }
    __Scene_Base__checkGameover.call(this);
};

const __Game_Interpreter__command353 = Game_Interpreter.prototype.command353;
Game_Interpreter.prototype.command353 = function() {
    if (Params.DEATHLINK_MODE === 'party' &&
        Params.DEATHLINK_TRIGGER === 'auto'
    ) {
        const cause = makeDeathCause();
        ArchiRPG.API.triggerDeathlink(cause);
    }
    return __Game_Interpreter__command353.call(this);
};

// TODO: remove these
declare const $gameParty: any;
declare const BattleManager: any;
declare const Game_Actor: any;
declare const Game_Interpreter: any;
declare const Scene_Base: any;
