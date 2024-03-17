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
 * @command autopatchShop
 * @text Autopatch Shop 
 * @desc Patches a shop processing command, changing the available goods.
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
          ArchiRPG.scoutedItems[item.location] = {
            ...item,
            target: item.player
          };
        });
      });
    });
    window.addEventListener("beforeunload", function () {
      ArchiRPG.client.disconnect();
    });

    function getGameOption(key, defaultValue) {
      return ArchiRPG.options[key] || defaultValue;
    }
    function startGame() {
      if (!ArchiRPG.dataPackage) {
        Logger.warn("Game started without data package, Archipelago may not work correctly");
      }
      ArchiRPG.client.updateStatus(archipelago_js.CLIENT_STATUS.PLAYING);
      ArchiRPG.client.send({
        cmd: "Sync"
      });
    }
    function getLocationId(location) {
      if (!ArchiRPG.dataPackage) return 0;
      const locationId = typeof location === 'string' ? ArchiRPG.dataPackage.location_name_to_id[location.replace(/_/g, ' ')] : location;
      return locationId;
    }
    function getScoutedItem(location) {
      const locationId = getLocationId(location);
      return ArchiRPG.scoutedItems[locationId];
    }
    function getScoutedItemDetails(location) {
      const scoutedItem = ArchiRPG.API.getScoutedItem(location);
      if (!scoutedItem) return ArchiRPG.unknownItemDetails;
      return {
        name: ArchiRPG.client.items.name(scoutedItem.target, scoutedItem.item),
        playerName: ArchiRPG.client.players.alias(scoutedItem.target),
        isOwnItem: scoutedItem.target === ArchiRPG.slot
      };
    }
    function isLocationChecked(location) {
      const locationId = getLocationId(location);
      return ArchiRPG.client.locations.checked.includes(locationId);
    }
    function locationScout(location) {
      const locationId = getLocationId(location);
      ArchiRPG.client.locations.scout(archipelago_js.CREATE_AS_HINT_MODE.NO_HINT, locationId);
    }
    function locationCheck(location, hideNotification) {
      const locationId = getLocationId(location);
      ArchiRPG.client.locations.check(locationId);
      if (hideNotification) return;
      const item = ArchiRPG.API.getScoutedItem(locationId);
      if (item) {
        ArchiRPG.API.showUnlockedItems([item]);
      }
    }
    function goalCheck(goal, preventCompletion) {}
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
        getGameOption: getGameOption,
        getLocationId: getLocationId,
        getScoutedItem: getScoutedItem,
        getScoutedItemDetails: getScoutedItemDetails,
        goalCheck: goalCheck,
        isLocationChecked: isLocationChecked,
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

    const __Game_Temp__initialize = Game_Temp.prototype.initialize;
    Game_Temp.prototype.initialize = function () {
      __Game_Temp__initialize.call(this);
      this.archiRPG = {
        shop: {
          overrideList: [],
          revealArchipelagoItems: false
        }
      };
    };

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
    const __Game_Interpreter__updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function () {
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
    };
    function requestScoutForCommand(commandName, args) {
      if (commandName === makeCommandNameMV('autopatchCheck')) {
        const [location] = args;
        ArchiRPG.API.locationScout(location);
      }
      if (commandName === makeCommandNameMV('locationCheck')) {
        const [location] = args;
        ArchiRPG.API.locationScout(location);
      }
      if (commandName === makeCommandNameMV('locationScout')) {
        const [location] = args;
        ArchiRPG.API.locationScout(location);
      }
    }
    if (Game_Interpreter.requestImagesByPluginCommand) {
      const __Game_Interpreter__requestImagesByPluginCommand = Game_Interpreter.requestImagesByPluginCommand;
      Game_Interpreter.requestImagesByPluginCommand = function (commandName, args) {
        requestScoutForCommand(commandName, args);
        __Game_Interpreter__requestImagesByPluginCommand.call(this, commandName, args);
      };
    } else if (Game_Interpreter.requestImages) {
      const __Game_Interpreter__requestImages = Game_Interpreter.requestImages;
      Game_Interpreter.requestImages = function (list, commonList) {
        __Game_Interpreter__requestImages.call(this, list, commonList);
        if (!list || list.length === 0) return;
        for (let i = 0; i < list.length; i++) {
          const command = list[i];
          if (command.code !== 356) continue;
          const args = command.parameters[0].split(" ");
          const commandName = args.shift();
          if (commandName) requestScoutForCommand(commandName, args);
        }
      };
    }
    const __Scene_Shop__create = Scene_Shop.prototype.create;
    Scene_Shop.prototype.create = function () {
      const {
        overrideList
      } = $gameTemp.archiRPG.shop;
      overrideList.forEach(override => {
        if (override.location) {
          const id = ArchiRPG.API.getLocationId(override.location);
          ArchiRPG.API.locationScout(id);
        }
      });
      return __Scene_Shop__create.call(this);
    };
    const __Scene_Shop__isReady = Scene_Shop.prototype.isReady;
    Scene_Shop.prototype.isReady = function () {
      const {
        overrideList
      } = $gameTemp.archiRPG.shop;
      const missingLocation = overrideList.some(override => {
        if (override.location) {
          const hasScoutedData = !!ArchiRPG.API.getScoutedItem(override.location);
          if (!hasScoutedData) {
            return true;
          }
        }
        return false;
      });
      if (missingLocation) return false;
      return __Scene_Shop__isReady.call(this);
    };
    Window_ShopBuy.prototype.makeItemList = function () {
      const goodsToItem = this.goodsToItem || function (goods) {
        switch (goods[0]) {
          case 0:
            return $dataItems[goods[1]];
          case 1:
            return $dataWeapons[goods[1]];
          case 2:
            return $dataArmors[goods[1]];
          default:
            return null;
        }
      };
      this._data = [];
      this._price = [];
      const {
        overrideList,
        revealArchipelagoItems
      } = $gameTemp.archiRPG.shop;
      const goodsCount = Math.max(this._shopGoods.length, overrideList.length);
      for (let i = 0; i < goodsCount; i++) {
        const goods = this._shopGoods[i];
        const override = overrideList[i];
        const item = goods && goodsToItem(goods);
        const itemPrice = item ? item.price : 0;
        const price = override.price || (goods[2] === 0 ? itemPrice : goods[3]);
        this._price.push(price);
        if (override.location) {
          const id = ArchiRPG.API.getLocationId(override.location);
          const data = {
            isArchipelago: true,
            name: ArchiRPG.unknownItemDetails.name,
            description: "????????????",
            id
          };
          if (revealArchipelagoItems) {
            const details = ArchiRPG.API.getScoutedItemDetails(id);
            data.name = details.name;
            data.description = details.isOwnItem ? "An Archipelago item for yourself" : "An Archipelago item for \\c[4]" + details.playerName;
          }
          this._data.push(data);
        } else {
          this._data.push(item);
        }
      }
    };
    const __Window_ShopBuy__isEnabled = Window_ShopBuy.prototype.isEnabled;
    Window_ShopBuy.prototype.isEnabled = function (item) {
      if (item && item.isArchipelago) {
        return this.price(item) <= this._money && !ArchiRPG.API.isLocationChecked(item.id);
      }
      return __Window_ShopBuy__isEnabled.call(this, item);
    };
    const __Window_ShopBuy__price = Window_ShopBuy.prototype.price;
    Window_ShopBuy.prototype.price = function (item) {
      if (item && item.isArchipelago && ArchiRPG.API.isLocationChecked(item.id)) {
        return "-----";
      }
      return __Window_ShopBuy__price.call(this, item);
    };
    const __Scene_Shop__onBuyOk = Scene_Shop.prototype.onBuyOk;
    Scene_Shop.prototype.onBuyOk = function () {
      const boughtItem = this._buyWindow.item();
      if (boughtItem.isArchipelago) {
        ArchiRPG.API.locationCheck(boughtItem.id);
        $gameParty.loseGold(this.buyingPrice());
        this._buyWindow.activate();
        this._goldWindow.refresh();
        this._statusWindow.refresh();
        this._buyWindow.refresh();
        SoundManager.playShop();
        return;
      }
      return __Scene_Shop__onBuyOk.call(this);
    };
    const __Window_ShopStatus__drawPossession = Window_ShopStatus.prototype.drawPossession;
    Window_ShopStatus.prototype.drawPossession = function (x, y) {
      if (this._item.isArchipelago) {
        return;
      }
      return __Window_ShopStatus__drawPossession.call(this, x, y);
    };

    const AUTOPATCH_CHECK_SUPPORTED_CODES = [125, 126, 127, 128, 129];
    const AUTOPATCH_CHECK_SKIP_CODES = [101, 401, ...AUTOPATCH_CHECK_SUPPORTED_CODES];
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
    makePluginCommand('showCustomMessage', message => {
      ArchiRPG.API.showCustomMessage(message);
    });
    makePluginCommand('autopatchCheck', function (location) {
      const locationId = ArchiRPG.API.getLocationId(location);
      const nextCmd = this.nextEventCode();
      if (!AUTOPATCH_CHECK_SUPPORTED_CODES.includes(nextCmd)) {
        throw new Error(`Can't auto patch command code ${nextCmd}`);
      }
      while (AUTOPATCH_CHECK_SKIP_CODES.includes(this.nextEventCode())) {
        this._index++;
      }
      ArchiRPG.API.locationCheck(locationId);
      const locationInfo = ArchiRPG.API.getScoutedItem(locationId);
      if (locationInfo) {
        ArchiRPG.API.showUnlockedItems([locationInfo]);
      } else {
        ArchiRPG.API.locationScout(locationId);
        this._archi_checkLocation = locationId;
        this.setWaitMode('archi_check');
      }
    });
    makePluginCommand('autopatchShop', function (...tags) {
      const revealArchipelagoItems = tags.includes("revealArchipelagoItems");
      const nextCmd = this.nextEventCode();
      if (nextCmd !== 302) {
        throw new Error(`Can't auto patch command code ${nextCmd}`);
      }
      const overrideList = [];
      for (let i = this._index + 1; this._list[i]; i++) {
        const command = this._list[i];
        if ([302, 605].includes(command.code)) continue;
        if (![108, 408].includes(command.code)) break;
        const parsedComment = parseDictString(command.parameters[0]);
        overrideList.push({
          name: parsedComment["name"],
          location: parsedComment["location"],
          price: parsedComment["price"] ? Number(parsedComment["price"]) : undefined
        });
      }
      $gameTemp.archiRPG.shop.overrideList = overrideList;
      $gameTemp.archiRPG.shop.revealArchipelagoItems = revealArchipelagoItems;
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
      scoutedItems: {},
      unknownItemDetails: {
        name: "??????????",
        playerName: "someone",
        isOwnItem: false
      },
      checkedLocations: [],
      options: {},
      slot: -1,
      team: -1
    };
    window.ArchiRPG = ArchiRPG$1;

})(null, ArchiLib);
