//=============================================================================
// ArchiRPG Deathlink plugin v0.1.0
//=============================================================================

/*:
 * @plugindesc Adds Deathlink support for games with ArchiRPG.
 * @author LeonMillan
 * @orderAfter ArchiRPG
 * 
 * @param DeathlinkMode
 * @text Deathlink Mode
 * @type select
 * @default party
 * @option Disabled
 * @value none
 * @option Actor Death
 * @value actor
 * @option Party Defeat
 * @value party
 * @option Custom Event
 * @value custom
 * 
 * @param DeathlinkTrigger
 * @text Trigger
 * @desc When set to manual, you need to implement the Deathlink
 * trigger manually by calling ArchiRPG.API.triggerDeathlink()
 * @type select
 * @default auto
 * @option Automatic
 * @value auto
 * @option Manual
 * @value manual
 * 
 * @param DeathlinkActorPriority
 * @text Actor Priority
 * @desc When in "actor" mode, defines which actor is chosen to
 * be killed when a DeathLink event happens.
 * @type select
 * @default first
 * @option First in Party Order
 * @value first
 * @option Random (entire party)
 * @value random
 * @option Random (active in battle)
 * @value random_battle
 * 
 * @param DeathlinkEventID
 * @text Custom Common Event ID
 * @desc Common Event called when using the "custom" mode.
 * @type common_event
 * 
 * @param DeathlinkCauseEval
 * @text Death Cause Script
 * @desc JavaScript executed to determine the cause of a Deathlink.
 * See "Help" section for details.
 * @type note
 */

(function (archipelago_js) {
    'use strict';

    const {
      PluginManager
    } = window;
    const PLUGIN_NAME$1 = "ArchiRPG_Deathlink";
    const PLUGIN_PARAMS = PluginManager.parameters(PLUGIN_NAME$1);
    function getParam(key, defValue) {
      if (!(key in PLUGIN_PARAMS)) return defValue;
      return PLUGIN_PARAMS[key];
    }
    function getParamNum(key, defValue) {
      if (!(key in PLUGIN_PARAMS)) return defValue;
      const parsedVal = Number(PLUGIN_PARAMS[key]);
      return Number.isNaN(parsedVal) ? defValue : parsedVal;
    }
    function getParamBool(key, defValue) {
      if (!(key in PLUGIN_PARAMS)) return defValue;
      return PLUGIN_PARAMS[key].toLowerCase() === 'true';
    }
    function getParamJson(key, defValue) {
      if (!(key in PLUGIN_PARAMS)) return defValue;
      return JSON.parse(PLUGIN_PARAMS[key]);
    }
    const Params = {
      DEATHLINK_MODE: getParam("DeathlinkMode", 'party'),
      DEATHLINK_TRIGGER: getParam("DeathlinkTrigger", 'auto'),
      DEATHLINK_ACTOR_PRIORITY: getParam("DeathlinkActorPriority", 'first'),
      DEATHLINK_EVENT_ID: getParamNum("DeathlinkEventID", 0),
      DEATHLINK_CAUSE_EVAL: getParam("DeathlinkCauseEval", "")
    };

    const {
      SceneManager
    } = window;
    const deathLinkQueue = [];
    function pickActorToKill() {
      if (Params.DEATHLINK_ACTOR_PRIORITY === 'first') {
        return $gameParty.aliveMembers()[0];
      }
      let members = $gameParty.aliveMembers();
      if (Params.DEATHLINK_ACTOR_PRIORITY === 'random_battle') {
        const aliveBattleMembers = $gameParty.battleMembers().filter(function (member) {
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
      const actorsToKill = Params.DEATHLINK_MODE === "party" ? $gameParty.members() : [pickActorToKill()];
      for (const actor of actorsToKill) {
        actor.die();
      }
    }
    function handleCustomDeathLink() {
      if (Params.DEATHLINK_MODE !== "custom") return;
      const nextDeathLink = deathLinkQueue.shift();
      if (!nextDeathLink) return;
      $gameTemp.reserveCommonEvent(Params.DEATHLINK_EVENT_ID);
    }
    const __BattleManager__startTurn = BattleManager.startTurn;
    BattleManager.startTurn = function () {
      handleDefaultDeathLink();
      __BattleManager__startTurn.call(this);
      this.refreshStatus();
    };
    const __BattleManager__endTurn = BattleManager.endTurn;
    BattleManager.endTurn = function () {
      handleDefaultDeathLink();
      __BattleManager__endTurn.call(this);
    };
    const __Game_Troop__setupBattleEvent = Game_Troop.prototype.setupBattleEvent;
    Game_Troop.prototype.setupBattleEvent = function () {
      __Game_Troop__setupBattleEvent.call(this);
      if (this._interpreter.isRunning()) return;
      handleCustomDeathLink();
    };
    const __Scene_Map__updateScene = Scene_Map.prototype.updateScene;
    Scene_Map.prototype.updateScene = function () {
      __Scene_Map__updateScene.call(this);
      if (!SceneManager.isSceneChanging()) {
        handleCustomDeathLink();
      }
    };
    function onDeathEvent(data) {
      deathLinkQueue.push(data);
    }

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
    function parseDictString(str) {
      const dict = {};
      let match;
      const regexp = /(\w+)\=(?:\"(.*)\"|([\S]*))\s*/g;
      while ((match = regexp.exec(str)) !== null) {
        const [_, key, val1, val2] = match;
        dict[key] = val1 || val2;
      }
      return dict;
    }

    function makeTroopName() {
      const enemyNames = $gameTroop.enemyNames();
      if (!$gameParty.inBattle() || enemyNames.length === 0) return "mysterious forces";
      let strongestEnemy = enemyNames[0];
      let strongestEnemyHp = 0;
      this.members().forEach(function (enemy) {
        if (enemy.isAlive() && enemy.mhp > strongestEnemyHp) {
          strongestEnemyHp = enemy.mhp;
          strongestEnemy = enemy.originalName();
        }
      });
      const otherEnemy = enemyNames.find(enemy => enemy !== strongestEnemy);
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
    function makeDeathCause(actorIndex = -1, enemyIndex = -1) {
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
      const killerName = enemyIndex >= 0 ? $gameTroop.members()[enemyIndex].originalName() : makeTroopName();
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

    const __BattleManager__processDefeat = BattleManager.processDefeat;
    BattleManager.processDefeat = function () {
      __BattleManager__processDefeat.call(this);
      if (!ArchiRPG.API.isDeathlinkParticipant()) return;
      if (Params.DEATHLINK_TRIGGER !== 'auto') return;
      if (Params.DEATHLINK_MODE !== 'party') return;
      const cause = makeDeathCause();
      ArchiRPG.API.triggerDeathlink(cause);
    };
    const __Game_Actor__die = Game_Actor.prototype.die;
    Game_Actor.prototype.die = function () {
      __Game_Actor__die.call(this);
      if (!ArchiRPG.API.isDeathlinkParticipant()) return;
      if (Params.DEATHLINK_TRIGGER !== 'auto') return;
      if (Params.DEATHLINK_MODE !== 'actor') return;
      const actorIndex = this.index();
      const cause = makeDeathCause(actorIndex);
      ArchiRPG.API.triggerDeathlink(cause);
    };
    const __Scene_Base__checkGameover = Scene_Base.prototype.checkGameover;
    Scene_Base.prototype.checkGameover = function () {
      if ($gameParty.isAllDead()) {
        if (Params.DEATHLINK_MODE === 'party' && Params.DEATHLINK_TRIGGER === 'auto') {
          const cause = makeDeathCause();
          ArchiRPG.API.triggerDeathlink(cause);
        }
      }
      __Scene_Base__checkGameover.call(this);
    };
    const __Game_Interpreter__command353 = Game_Interpreter.prototype.command353;
    Game_Interpreter.prototype.command353 = function () {
      if (Params.DEATHLINK_MODE === 'party' && Params.DEATHLINK_TRIGGER === 'auto') {
        const cause = makeDeathCause();
        ArchiRPG.API.triggerDeathlink(cause);
      }
      return __Game_Interpreter__command353.call(this);
    };

    const __getClientTags = ArchiRPG.API.getClientTags;
    ArchiRPG.API.getClientTags = function () {
      const tags = __getClientTags();
      return tags.concat("DeathLink");
    };
    window.addEventListener('load', () => {
      ArchiRPG.client.addListener(archipelago_js.SERVER_PACKET_TYPE.BOUNCED, packet => {
        var _packet$tags;
        if ((_packet$tags = packet.tags) !== null && _packet$tags !== void 0 && _packet$tags.includes("DeathLink")) {
          const deathData = packet.data;
          onDeathEvent(deathData);
        }
      });
    });

})(ArchiLib);
