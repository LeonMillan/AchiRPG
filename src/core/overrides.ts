import { RPGData, DatabaseArray } from "@leonmillan/rpgmaker-ts/lib";
import { CLIENT_STATUS } from "archipelago.js";
import { makeCommandNameMV } from "../Utils";
import { ITempData } from "../Types";

import './augment/Game_System';
import './augment/Game_Temp';

type ShopGoods = RPGData.CommandArgs<RPGData.CommandCode.ShopProcessingData>;

const __DataManager__setupNewGame = DataManager.setupNewGame;
DataManager.setupNewGame = function() {
    __DataManager__setupNewGame.call(this);
    ArchiRPG.API.startGame();
}

const __Scene_Title__start = Scene_Title.start;
Scene_Title.start = function() {
    __Scene_Title__start.call(this);
    ArchiRPG.client.updateStatus(CLIENT_STATUS.READY);
}

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

function requestScoutForCommand(commandName: string, args: string[]) {
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

// Check for MV/MZ interop and corescript versions
if (Game_Interpreter.requestImagesByPluginCommand) {
    const __Game_Interpreter__requestImagesByPluginCommand = Game_Interpreter.requestImagesByPluginCommand;
    Game_Interpreter.requestImagesByPluginCommand = function(commandName: string, args: string[]) {
        requestScoutForCommand(commandName, args);
        __Game_Interpreter__requestImagesByPluginCommand.call(this, commandName, args);
    };
} else if (Game_Interpreter.requestImages) {
    const __Game_Interpreter__requestImages = Game_Interpreter.requestImages;
    Game_Interpreter.requestImages = function(list: RPGData.Command[], commonList: number[]) {
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
Scene_Shop.prototype.create = function() {
    const { overrideList } = $gameTemp.archiRPG.shop;
    overrideList.forEach((override) => {
        if (override.location) {
            const id = ArchiRPG.API.getLocationId(override.location);
            ArchiRPG.API.locationScout(id);
        }
    });
    return __Scene_Shop__create.call(this);
}

const __Scene_Shop__isReady = Scene_Shop.prototype.isReady;
Scene_Shop.prototype.isReady = function() {
    const { overrideList } = $gameTemp.archiRPG.shop;
    const missingLocation = overrideList.some((override) => {
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
}

Window_ShopBuy.prototype.makeItemList = function() {
    // Needed for MV/MZ interop
    const goodsToItem = this.goodsToItem || function(goods: ShopGoods) {
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
    const { overrideList, revealArchipelagoItems } = $gameTemp.archiRPG.shop;
    const goodsCount = Math.max(this._shopGoods.length, overrideList.length);
    for (let i = 0; i < goodsCount; i++) {
        const goods = this._shopGoods[i] as ShopGoods;
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
                id,
            };
            if (revealArchipelagoItems) {
                const details = ArchiRPG.API.getScoutedItemDetails(id);
                data.name = details.name;
                data.description = details.isOwnItem
                    ? "An Archipelago item for yourself"
                    : "An Archipelago item for \\c[4]" + details.playerName;
            }
            this._data.push(data);
        } else {
            this._data.push(item);
        }
    }
};

const __Window_ShopBuy__isEnabled = Window_ShopBuy.prototype.isEnabled;
Window_ShopBuy.prototype.isEnabled = function(item) {
    if (item && item.isArchipelago) {
        return this.price(item) <= this._money && !ArchiRPG.API.isLocationChecked(item.id);
    }
    return __Window_ShopBuy__isEnabled.call(this, item);
}

const __Window_ShopBuy__price = Window_ShopBuy.prototype.price;
Window_ShopBuy.prototype.price = function(item) {
    if (item && item.isArchipelago && ArchiRPG.API.isLocationChecked(item.id)) {
        return "-----"
    }
    return __Window_ShopBuy__price.call(this, item);
};

const __Scene_Shop__onBuyOk = Scene_Shop.prototype.onBuyOk;
Scene_Shop.prototype.onBuyOk = function() {
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
}

const __Window_ShopStatus__drawPossession = Window_ShopStatus.prototype.drawPossession;
Window_ShopStatus.prototype.drawPossession = function(x, y) {
    if (this._item.isArchipelago) {
        return;
    }
    return __Window_ShopStatus__drawPossession.call(this, x, y)
}

// TODO: remove these
declare const DataManager: any;
declare const SoundManager: any;
declare const Scene_Title: any;
declare const Game_Interpreter: any;
declare const Window_ShopBuy: any;
declare const Window_ShopStatus: any;
declare const Scene_Shop: any;
declare const $gameTemp: unknown & { archiRPG: ITempData };
declare const $gameParty: any;
declare const $dataItems: DatabaseArray<RPGData.IItem>;
declare const $dataWeapons: DatabaseArray<RPGData.IWeapon>;
declare const $dataArmors: DatabaseArray<RPGData.IArmor>;
