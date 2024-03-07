//=============================================================================
// ArchiRPG plugin v0.1.0
//=============================================================================

/*:
 * @plugindesc Archipelago support for RPG Maker MV and MZ
 * @author LeonMillan
 * @orderAfter ArchiLib
 *
 * 
 * @command startGame
 * @text Start Game
 * @desc Triggers a "game started" event.
 * This changes the client status to "Playing".
 *
 * 
 * @command locationScout
 * @text Location scout
 * @desc Gathers information about a location.
 * The fetched data is saved into ArchiRPG.knownLocations[locationId].
 *
 * @arg locationIdOrName
 * @text Location ID or Name
 * @desc When using location name, replace spaces with underscores (_)
 * @type string
 * @default 
 *
 * 
 * @command locationCheck
 * @text Location check
 * @desc Unlocks a location, sending the containing item to its owner.
 * The fetched data is saved into ArchiRPG.knownLocations[locationId].
 *
 * @arg locationIdOrName
 * @text Location ID or Name
 * @desc When using location name, replace spaces with underscores (_)
 * @type string
 * @default 
 * 
 * 
 * @command goalCheck
 * @text Goal check (WIP)
 * @desc Marks a goal requirement as completed.
 * Warning: work in progress, subject to change!
 *
 * @arg goal
 * @text Goal Type
 * @desc Which goal condition has been completed
 * @type select
 * @option Troop Defeated
 * @value troop
 * @option Map Visited
 * @value map
 * @default troop
 * 
 * @arg preventCompletion
 * @text Prevent automatic completion?
 * @desc Whether to mark the game as completed and
 * unlock all locations if all goal conditions were met.
 * @type boolean
 * @on Yes
 * @off No
 * @default false
 *
 * 
 * @command completeGame
 * @text Complete Game
 * @desc Triggers a "game completed" event.
 * This unlocks all locations automatically.
 *
 * 
 * @command showCustomMessage
 * @text Show Custom Message
 * @desc Displays a custom message in the ArchiRPG notification system.
 *
 * @arg message
 * @text Message
 * @desc Message text (supports control characters)
 * @type multiline_string
 * @default 
 * 
 * 
 * @command autopatchCheck
 * @text Autopatch Location Check
 * @desc Unlocks a location, changing the event automatically to prevent
 * commands associated with acquiring items from running,
 * such as Show Text, Change Items, Change Party Member, etc...
 *
 * @arg locationIdOrName
 * @text Location ID or Name
 * @desc When using location name, replace spaces with underscores (_)
 * @type string
 * @default 0
 * 
 * 
 * @help
 * Note: When used in RPG Maker MV, plugin commands are prefixed with "ArchiRPG."
 * E.g., "ArchiRPG.startGame", "ArchiRPG.locationCheck My_Location", etc.
 * 
 * [Copyright]
 * This plugin uses "Archipelago.js" by ThePhar (Zach Parks).
 * https://github.com/ThePhar/Archipelago.JS
 *
 * [License]
 * This plugin is released under MIT license.
 * http://opensource.org/licenses/mit-license.php
 */
(function (global, archipelago_js) {
    'use strict';

    let Goal = function (Goal) {
      Goal[Goal["DefeatEnemy"] = 0] = "DefeatEnemy";
      Goal[Goal["DefeatTroop"] = 1] = "DefeatTroop";
      Goal[Goal["ReachMap"] = 2] = "ReachMap";
      return Goal;
    }({});
    let InitialParty = function (InitialParty) {
      InitialParty[InitialParty["Vanilla"] = 0] = "Vanilla";
      return InitialParty;
    }({});
    let SaveAccess = function (SaveAccess) {
      SaveAccess[SaveAccess["Normal"] = 0] = "Normal";
      SaveAccess[SaveAccess["AlwaysEnabled"] = 1] = "AlwaysEnabled";
      SaveAccess[SaveAccess["AlwaysDisabled"] = 2] = "AlwaysDisabled";
      return SaveAccess;
    }({});
    let Notifications = function (Notifications) {
      Notifications[Notifications["None"] = 0] = "None";
      Notifications[Notifications["Toast"] = 1] = "Toast";
      return Notifications;
    }({});
    let NotificationsPosition = function (NotificationsPosition) {
      NotificationsPosition[NotificationsPosition["TopLeft"] = 0] = "TopLeft";
      NotificationsPosition[NotificationsPosition["TopRight"] = 1] = "TopRight";
      NotificationsPosition[NotificationsPosition["BottomLeft"] = 2] = "BottomLeft";
      NotificationsPosition[NotificationsPosition["BottomRight"] = 3] = "BottomRight";
      return NotificationsPosition;
    }({});

    const DEFAULT_DATA = {
      goal: Goal.DefeatEnemy,
      goalTroop: 0,
      goalMap: 0,
      initialParty: InitialParty.Vanilla,
      saveAccess: SaveAccess.Normal,
      notifications: Notifications.None,
      notificationsPosition: NotificationsPosition.BottomLeft
    };

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

    async function connect(player, hostname, port, password) {
      try {
        const response = await ArchiRPG.client.connect({
          name: player,
          game: ArchiRPG.world.name,
          hostname,
          port: port,
          password,
          items_handling: ArchiRPG.world.itemsHandling
        });
        ArchiRPG.slot = response.slot;
        ArchiRPG.team = response.team;
        ArchiRPG.options = response.slot_data;
        return true;
      } catch (err) {
        Logger.error("Failed to connect", err);
        return false;
      }
    }
    window.addEventListener('load', () => {
      ArchiRPG.client.addListener(archipelago_js.SERVER_PACKET_TYPE.CONNECTED, packet => {
        Logger.log("Connected to server: ", packet);
        ArchiRPG.checkedLocations = packet.checked_locations;
      });
      ArchiRPG.client.addListener(archipelago_js.SERVER_PACKET_TYPE.ROOM_UPDATE, packet => {
        Logger.log("Room update: ", packet);
      });
      ArchiRPG.client.addListener(archipelago_js.SERVER_PACKET_TYPE.DATA_PACKAGE, packet => {
        const currGameData = packet.data.games[ArchiRPG.world.name];
        ArchiRPG.dataPackage = currGameData;
      });
      ArchiRPG.client.addListener(archipelago_js.SERVER_PACKET_TYPE.LOCATION_INFO, packet => {
        packet.locations.forEach(item => {
          ArchiRPG.knownLocations[item.location] = item;
        });
      });
    });
    window.addEventListener("beforeunload", function () {
      ArchiRPG.client.disconnect();
    });

    function startGame() {
      ArchiRPG.client.updateStatus(archipelago_js.CLIENT_STATUS.PLAYING);
      ArchiRPG.client.send({
        cmd: "Sync"
      });
    }
    function getLocationId(location) {
      const locationId = typeof location === 'string' ? ArchiRPG.dataPackage.location_name_to_id[location.replace(/_/g, ' ')] : location;
      return locationId;
    }
    function locationScout(location) {
      const locationId = getLocationId(location);
      ArchiRPG.client.locations.scout(archipelago_js.CREATE_AS_HINT_MODE.NO_HINT, locationId);
    }
    function locationCheck(location) {
      const locationId = getLocationId(location);
      ArchiRPG.client.locations.check(locationId);
    }
    function goalCheck(goal, preventCompletion) {
      const data = $gameSystem.archipelagoData;
      data.goalChecks[goal] = true;
      if (!preventCompletion) {
        const allChecks = [data.goalChecks.troop || !ArchiRPG.options.goalTroop, data.goalChecks.map || !ArchiRPG.options.goalMap];
        const allComplete = allChecks.every(check => check);
        if (allComplete) {
          completeGame();
        }
      }
    }
    function completeGame() {
      ArchiRPG.client.updateStatus(archipelago_js.CLIENT_STATUS.GOAL);
      ArchiRPG.client.locations.autoRelease();
    }
    function showReceivedItems(items) {}
    function showUnlockedItems(items) {}
    function showCustomMessage(message) {}

    var API = /*#__PURE__*/Object.freeze({
        __proto__: null,
        completeGame: completeGame,
        getLocationId: getLocationId,
        goalCheck: goalCheck,
        locationCheck: locationCheck,
        locationScout: locationScout,
        showCustomMessage: showCustomMessage,
        showReceivedItems: showReceivedItems,
        showUnlockedItems: showUnlockedItems,
        startGame: startGame
    });

    const __Game_System__initialize = window.Game_System.prototype.initialize;
    window.Game_System.prototype.initialize = function () {
      __Game_System__initialize.call(this);
      this.archipelagoData = {
        nextItemIndex: 0,
        goalChecks: {
          troop: false,
          map: false
        },
        locationChecks: []
      };
    };

    const {
      Game_Party,
      Game_System
    } = window;
    const __DataManager__setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function () {
      __DataManager__setupNewGame.call(this);
      ArchiRPG.API.startGame();
    };
    const __Scene_Title__start = Scene_Title.start;
    Scene_Title.start = function () {
      __Scene_Title__start.call(this);
      ArchiRPG.client.updateStatus(archipelago_js.CLIENT_STATUS.READY);
    };
    const __Game_System__isSaveEnabled = Game_System.prototype.isSaveEnabled;
    Game_System.prototype.isSaveEnabled = function () {
      if (ArchiRPG.options.saveAccess === SaveAccess.AlwaysEnabled) return true;
      if (ArchiRPG.options.saveAccess === SaveAccess.AlwaysDisabled) return false;
      return __Game_System__isSaveEnabled.call(this);
    };
    const __Game_Party__setupStartingMembers = Game_Party.prototype.setupStartingMembers;
    Game_Party.prototype.setupStartingMembers = function () {
      if (ArchiRPG.options.initialParty === InitialParty.Vanilla) {
        return __Game_Party__setupStartingMembers.call(this);
      }
      this._actors = [ArchiRPG.options.initialParty];
    };
    const __Game_Interpreter__updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function () {
      let waiting = __Game_Interpreter__updateWaitMode.call(this);
      if (this._waitMode === 'archi_check') {
        const checkedLocation = ArchiRPG.knownLocations[this._archi_checkLocation];
        if (checkedLocation) {
          showUnlockedItems([checkedLocation]);
        } else {
          waiting = true;
        }
      }
      if (!waiting) {
        this._waitMode = '';
      }
      return waiting;
    };
    if (Game_Interpreter.requestImagesByPluginCommand) {
      const __Game_Interpreter__requestImagesByPluginCommand = Game_Interpreter.requestImagesByPluginCommand;
      Game_Interpreter.requestImagesByPluginCommand = function (commandName, args) {
        if (commandName === makeCommandNameMV('autopatchCheck')) {
          const [location] = args;
          locationScout(location);
        }
        if (commandName === makeCommandNameMV('locationCheck')) {
          const [location] = args;
          locationScout(location);
        }
        if (commandName === makeCommandNameMV('locationScout')) {
          const [location] = args;
          locationScout(location);
        }
        __Game_Interpreter__requestImagesByPluginCommand.call(this, commandName, args);
      };
    } else {}

    makePluginCommand('startGame', () => {
      ArchiRPG.API.startGame();
    });
    makePluginCommand('locationScout', location => {
      const convertedLocation = Number.isNaN(Number(location)) ? location : Number(location);
      ArchiRPG.API.locationScout(convertedLocation);
    });
    makePluginCommand('locationCheck', location => {
      const convertedLocation = Number.isNaN(Number(location)) ? location : Number(location);
      ArchiRPG.API.locationCheck(convertedLocation);
    });
    makePluginCommand('goalCheck', (goal, preventCompletion) => {
      ArchiRPG.API.goalCheck(goal, preventCompletion === 'true');
    });
    makePluginCommand('completeGame', () => {
      ArchiRPG.API.completeGame();
    });
    makePluginCommand('quickCheck', () => {
      const eventId = $gameMap._interpreter.eventId();
      const event = $gameMap.event(eventId);
      const mapId = $gameMap.mapId();
      const eventPageId = event._pageIndex;
      const mapName = $dataMapInfos[mapId];
      const hash = makeHash(mapId, eventId, eventPageId);
      const locationName = `${mapName} (${hash})`;
      ArchiRPG.API.locationCheck(locationName);
    });
    makePluginCommand('showCustomMessage', message => {
      ArchiRPG.API.showCustomMessage(message);
    });
    const AUTOPATCH_SUPPORTED_CODES = [125, 126, 127, 128, 129];
    const AUTOPATCH_SKIP_CODES = [101, 401, ...AUTOPATCH_SUPPORTED_CODES];
    makePluginCommand('autopatchCheck', function (location) {
      const locationId = ArchiRPG.API.getLocationId(location);
      const nextCmd = this.nextEventCode();
      if (!AUTOPATCH_SUPPORTED_CODES.includes(nextCmd)) {
        throw new Error(`Can't auto patch command code ${nextCmd}`);
      }
      while (AUTOPATCH_SKIP_CODES.includes(this.nextEventCode())) {
        this._index++;
      }
      ArchiRPG.API.locationCheck(locationId);
      if (ArchiRPG.knownLocations[locationId]) {
        ArchiRPG.API.showUnlockedItems([ArchiRPG.knownLocations[locationId]]);
      } else {
        ArchiRPG.API.locationScout(locationId);
        this._archi_checkLocation = locationId;
        this.setWaitMode('archi_check');
      }
    });

    const ArchiRPG$1 = window.ArchiRPG || {
      API: {
        connect,
        ...API
      },
      world: {
        name: 'RPG Maker',
        type: window.Utils.RPGMAKER_NAME,
        baseId: 774000000000,
        itemsHandling: archipelago_js.ITEMS_HANDLING_FLAGS.REMOTE_ALL
      },
      client: new archipelago_js.Client(),
      knownLocations: {},
      checkedLocations: [],
      options: DEFAULT_DATA,
      slot: -1,
      team: -1
    };
    window.ArchiRPG = ArchiRPG$1;

})(null, ArchiLib);
