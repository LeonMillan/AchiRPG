import { Logger } from '../Utils';
import { Params } from './parameters';

function makeTroopName() {
    const enemyNames: string[] = $gameTroop.enemyNames();
    if (!$gameParty.inBattle() || enemyNames.length === 0) return "mysterious forces";
    
    let strongestEnemy = enemyNames[0];
    let strongestEnemyHp = 0;
    this.members().forEach(function(enemy) {
        if (enemy.isAlive() && enemy.mhp > strongestEnemyHp) {
            strongestEnemyHp = enemy.mhp;
            strongestEnemy = enemy.originalName();
        }
    });

    const otherEnemy = enemyNames.find((enemy) => enemy !== strongestEnemy);
    if (otherEnemy) {
        const otherCount = enemyNames.length - 1;
        const otherWord = otherCount > 1 ? `${otherCount} others` : otherEnemy;
        return `${strongestEnemy} and ${otherWord}`;
    }

    if (enemyNames.length > 1) {
        return `a group of ${strongestEnemy}`;
    }

    return strongestEnemy;
}

export function makeDeathCause(actorIndex: number = -1, enemyIndex: number = -1) {
    let cause = "";
    if (Params.DEATHLINK_CAUSE_EVAL) {
        try {
            cause = eval(Params.DEATHLINK_CAUSE_EVAL);
        } catch (err) {
            Logger.warn("Could not eval deathlink cause");
        }
        return cause;
    }

    const partyName = $gameParty.name();
    const killerName = enemyIndex >= 0
        ? $gameTroop.members()[enemyIndex].originalName()
        : makeTroopName();

    if (Params.DEATHLINK_MODE === 'actor') {
        const actor = $gameParty.battleMembers()[actorIndex];
        if (actor) {
            cause = `${actor.name()} was slain by ${killerName}`;
        } else {
            cause = `${partyName} was slain by ${killerName}`;
        }
    }

    if (Params.DEATHLINK_MODE === 'party') {
        cause = `${partyName} was slain by ${killerName}`;
    }

    return cause;
}

// TODO: remove these
declare const $gameParty: any;
declare const $gameTroop: any;
