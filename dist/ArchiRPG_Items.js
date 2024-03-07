//=============================================================================
// ArchiRPG Items plugin v0.1.0
//=============================================================================

/*:
 * @plugindesc Adds default item handling behavior for RPG games with ArchiRPG.
 * @author LeonMillan
 * @orderAfter ArchiRPG
 */

(function (archipelago_js) {
    'use strict';

    const PLUGIN_NAME = 'ArchiRPG';
    const LOG_PREFIX = `[${PLUGIN_NAME}]`;
    const Logger = {
      log: console.log.bind(null, LOG_PREFIX),
      warn: console.warn.bind(null, LOG_PREFIX),
      error: console.error.bind(null, LOG_PREFIX)
    };
    function makeCommandNameMV(name) {
      return `${PLUGIN_NAME}.${name}`;
    }
    function makePluginCommand(name, func) {
      if ('registerCommand' in window.PluginManager) {
        window.PluginManager.registerCommand(PLUGIN_NAME, name, func);
        return;
      }
      const __Game_Interpreter__pluginCommand = window.Game_Interpreter.prototype.pluginCommand;
      window.Game_Interpreter.prototype.pluginCommand = function (command, args) {
        if (command === makeCommandNameMV(name)) {
          return func.apply(this, args);
        }
        __Game_Interpreter__pluginCommand.call(this, command, args);
      };
    }
    function makeHash(...numbers) {
      return numbers.map(n => n.toString(36).padStart(3, '0')).join('');
    }

    const REGISTER_DEFAULT_PRESETS = true;
    const REGISTER_DEFAULT_HANDLERS = true;
    const DEFAULT_PRESETS = [[1001, 2000, "actor"], [2001, 4000, "item"], [4001, 6000, "weapon"], [6001, 8000, "armor"], [8001, 8500, "gold", -50], [8501, 9000, "gold", +50], [100001, 200000, "classSkill", 100]];
    const DEFAULT_HANDLERS = {
      actor(itemId) {
        $gameParty.addActor(itemId + 1);
      },
      item(itemId) {
        const itemObj = $dataItems[itemId + 1];
        $gameParty.gainItem(itemObj, 1);
      },
      weapon(itemId) {
        const weaponObj = $dataWeapons[itemId + 1];
        $gameParty.gainItem(weaponObj, 1);
      },
      armor(itemId) {
        const armorObj = $dataArmors[itemId + 1];
        $gameParty.gainItem(armorObj, 1);
      },
      gold(itemId, multiplier, minAmount = 0) {
        const amount = minAmount + (itemId + 1) * multiplier;
        $gameParty.gainGold(amount);
      },
      classSkill(itemId, maxLearningsPerClass) {
        const classId = 1 + Math.floor(itemId / maxLearningsPerClass);
        const skillIndex = itemId % maxLearningsPerClass;
        const learning = $dataClasses[classId].learnings[skillIndex];
        const skillId = learning.skillId;
        $gameActors._data.forEach(actor => {
          if (!actor || actor._classId !== classId) return;
          actor.learnSkill(skillId);
        });
      },
      switch(itemId, fromSwitchId = 1) {
        const id = fromSwitchId + itemId;
        $gameSwitches.setValue(id, true);
      },
      variableAbsolute(itemId, varId) {
        $gameVariables.setValue(varId, itemId);
      },
      variableIncrement(itemId, fromVarId = 1) {
        const id = fromVarId + itemId;
        const value = $gameVariables.value(id);
        $gameVariables.setValue(id, value + 1);
      }
    };

    const itemTypeHandlers = {};
    const itemRangePresets = [];
    function registerItemTypeHandler(type, handler) {
      if (itemTypeHandlers[type]) {
        throw new Error(`Can't register handler for ${type}: item type already registered`);
      }
      itemTypeHandlers[type] = handler;
    }
    function registerRangePreset(newRange) {
      if (newRange[1] <= newRange[0]) {
        throw new Error(`Can't register item range ${newRange[0]}-${newRange[0]}: malformed range`);
      }
      const conflict = itemRangePresets.some(range => {
        if (newRange[0] >= range[0] && newRange[0] <= range[1]) return true;
        if (newRange[1] >= range[0] && newRange[1] <= range[1]) return true;
        if (range[0] >= newRange[0] && range[1] <= newRange[1]) return true;
        return false;
      });
      if (conflict) {
        throw new Error(`Can't register item range ${newRange[0]}-${newRange[0]}: conflict with registered range presets`);
      }
      itemRangePresets.push(newRange);
    }
    function findRangePreset(itemId) {
      return itemRangePresets.find(range => {
        return itemId >= range[0] && itemId <= range[1];
      });
    }
    function handleItem(item) {
      const itemId = item.item - ArchiRPG.world.baseId;
      const rangePreset = findRangePreset(itemId);
      if (!rangePreset) {
        Logger.error(`Item ID ${itemId} unhandled by registered presets`);
        return;
      }
      const handler = itemTypeHandlers[rangePreset[2]];
      const params = rangePreset.slice(3);
      const relativeId = itemId - rangePreset[0];
      handler(relativeId, ...params);
    }
    window.addEventListener('load', () => {
      if (REGISTER_DEFAULT_PRESETS) {
        DEFAULT_PRESETS.forEach(registerRangePreset);
      }
      if (REGISTER_DEFAULT_HANDLERS) {
        Object.keys(DEFAULT_HANDLERS).forEach(itemType => {
          registerItemTypeHandler(itemType, DEFAULT_HANDLERS[itemType]);
        });
      }
      ArchiRPG.client.addListener(archipelago_js.SERVER_PACKET_TYPE.RECEIVED_ITEMS, packet => {
        Logger.log("Received items", packet);
        if (!$gameSystem) return;
        const {
          nextItemIndex
        } = $gameSystem.archipelagoData;
        const newItems = packet.items.slice(nextItemIndex);
        newItems.map(handleItem);
        ArchiRPG.API.showReceivedItems(newItems);
        $gameSystem.archipelagoData.nextItemIndex = packet.items.length;
      });
    });

})(ArchiLib);
