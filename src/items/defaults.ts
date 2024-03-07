import { ItemRangePreset, ItemTypeHandler } from "./types";

export const REGISTER_DEFAULT_PRESETS = true;
export const REGISTER_DEFAULT_HANDLERS = true;

export const DEFAULT_PRESETS: ItemRangePreset[] = [
    // First ID,    Last ID     Type            Parameters (see handler)
    [1001,          2000,       "actor"],
    [2001,          4000,       "item"],
    [4001,          6000,       "weapon"],
    [6001,          8000,       "armor"],
    [8001,          8500,       "gold",         -50],
    [8501,          9000,       "gold",         +50],
    [100001,        200000,     "classSkill",   100],
];

export const DEFAULT_HANDLERS: Record<string, ItemTypeHandler> = {
    actor(itemId: number) {
        $gameParty.addActor(itemId + 1);
    },
    
    item(itemId: number) {
        const itemObj = $dataItems[itemId + 1];
        $gameParty.gainItem(itemObj, 1);
    },
    
    weapon(itemId: number) {
        const weaponObj = $dataWeapons[itemId + 1];
        $gameParty.gainItem(weaponObj, 1);
    },
    
    armor(itemId: number) {
        const armorObj = $dataArmors[itemId + 1];
        $gameParty.gainItem(armorObj, 1);
    },
    
    gold(itemId: number, multiplier: number, minAmount: number = 0) {
        const amount = minAmount + (itemId + 1) * multiplier;
        $gameParty.gainGold(amount);
    },
    
    classSkill(itemId: number, maxLearningsPerClass: number) {
        const classId = 1 + Math.floor(itemId / maxLearningsPerClass);
        const skillIndex = itemId % maxLearningsPerClass;
        const learning = $dataClasses[classId].learnings[skillIndex];
        const skillId = learning.skillId;
        $gameActors._data.forEach((actor) => {
            if (!actor || actor._classId !== classId) return;
            actor.learnSkill(skillId);
        });
    },
    
    switch(itemId: number, fromSwitchId: number = 1) {
        const id = fromSwitchId + itemId;
        $gameSwitches.setValue(id, true);
    },

    variableAbsolute(itemId: number, varId: number) {
        $gameVariables.setValue(varId, itemId);
    },

    variableIncrement(itemId: number, fromVarId: number = 1) {
        const id = fromVarId + itemId;
        const value = $gameVariables.value(id);
        $gameVariables.setValue(id, value + 1);
    },
};

// TODO: remove these
declare const $dataClasses: any;
declare const $dataItems: any;
declare const $dataWeapons: any;
declare const $dataArmors: any;
declare const $gameParty: any;
declare const $gameActors: any;
declare const $gameSwitches: any;
declare const $gameVariables: any;
