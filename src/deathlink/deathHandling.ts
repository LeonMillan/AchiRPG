import { DeathLinkData } from 'archipelago.js';
import { Params } from './parameters';

const { SceneManager } = window;

const deathLinkQueue: DeathLinkData[] = [];

function showDeathNotification(data: DeathLinkData) {
    const message = data.cause || (data.source + " died.");
    ArchiRPG.API.showCustomMessage("\\I[1] " + message);
}

function pickActorToKill() {
    if (Params.DEATHLINK_ACTOR_PRIORITY === 'first') {
        return $gameParty.aliveMembers()[0];
    }

    let members = $gameParty.aliveMembers();
    if (Params.DEATHLINK_ACTOR_PRIORITY === 'random_battle') {
        const aliveBattleMembers = $gameParty.battleMembers().filter(function(member) {
            return !member.isDead();
        });
        if (aliveBattleMembers.length) {
            members = aliveBattleMembers;
        }
    }
    
    const randomIndex = Math.randomInt(members.length);
    return members[randomIndex];
}

function handleDefaultDeathLink() {
    if (Params.DEATHLINK_MODE !== "actor" && Params.DEATHLINK_MODE !== "party") {
        return;
    }
    
    const nextDeathLink = deathLinkQueue.shift();
    if (!nextDeathLink) return;

    const actorsToKill = Params.DEATHLINK_MODE === "party"
        ? $gameParty.members()
        : [pickActorToKill()];

    for (const actor of actorsToKill) {
        actor.die();
        actor.refresh();
    }

    showDeathNotification(nextDeathLink);
}

function handleCustomDeathLink() {
    if (Params.DEATHLINK_MODE !== "custom") return;
    
    const nextDeathLink = deathLinkQueue.shift();
    if (!nextDeathLink) return;

    $gameTemp.reserveCommonEvent(Params.DEATHLINK_EVENT_ID);
    showDeathNotification(nextDeathLink);
}


const __BattleManager__startTurn = BattleManager.startTurn;
BattleManager.startTurn = function() {
    handleDefaultDeathLink();
    __BattleManager__startTurn.call(this);
    this.refreshStatus();
}

const __BattleManager__endTurn = BattleManager.endTurn;
BattleManager.endTurn = function() {
    handleDefaultDeathLink();
    __BattleManager__endTurn.call(this);
}

const __Game_Troop__setupBattleEvent = Game_Troop.prototype.setupBattleEvent;
Game_Troop.prototype.setupBattleEvent = function() {
    __Game_Troop__setupBattleEvent.call(this);
    if (this._interpreter.isRunning()) return;
    handleCustomDeathLink();
}

const __Scene_Map__updateScene = Scene_Map.prototype.updateScene;
Scene_Map.prototype.updateScene = function() {
    __Scene_Map__updateScene.call(this);
    if (!SceneManager.isSceneChanging()) {
        handleDefaultDeathLink();
        handleCustomDeathLink();
        $gamePlayer.refresh();
        $gameMap.requestRefresh();
    }
}

export function onDeathEvent(data: DeathLinkData) {
    deathLinkQueue.push(data);
}

// TODO: remove these
declare const $gameTemp: any;
declare const $gameParty: any;
declare const $gamePlayer: any;
declare const $gameMap: any;
declare const BattleManager: any;
declare const Game_Troop: any;
declare const Scene_Map: any;

declare global {
    interface Math {
        randomInt(max: number): number;
    }
}
