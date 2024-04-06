import { RPGData, DatabaseArray } from "@leonmillan/rpgmaker-ts/lib";
import { ITempData } from "../../Types";

type ShopGoods = RPGData.CommandArgs<RPGData.CommandCode.ShopProcessingData>;

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
declare const SoundManager: any;
declare const Window_ShopBuy: any;
declare const Window_ShopStatus: any;
declare const Scene_Shop: any;
declare const $gameTemp: unknown & { archiRPG: ITempData };
declare const $gameParty: any;
declare const $dataItems: DatabaseArray<RPGData.IItem>;
declare const $dataWeapons: DatabaseArray<RPGData.IWeapon>;
declare const $dataArmors: DatabaseArray<RPGData.IArmor>;
