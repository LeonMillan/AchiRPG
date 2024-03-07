import { NetworkItem, SERVER_PACKET_TYPE } from "archipelago.js";
import { Logger } from "../Utils";
import { DEFAULT_HANDLERS, DEFAULT_PRESETS, REGISTER_DEFAULT_HANDLERS, REGISTER_DEFAULT_PRESETS } from "./defaults";
import { ItemRangePreset, ItemTypeHandler } from "./types";

declare module "../Context" {
    interface IArchiRPGAPI {
        registerItemTypeHandler: typeof registerItemTypeHandler;
        registerRangePreset: typeof registerRangePreset;
    }
}

const itemTypeHandlers: Record<string, ItemTypeHandler> = {};
const itemRangePresets: ItemRangePreset[] = [];

function registerItemTypeHandler(type: string, handler: ItemTypeHandler): void {
    if (itemTypeHandlers[type]) {
        throw new Error(`Can't register handler for ${type}: item type already registered`);
    }
    itemTypeHandlers[type] = handler;
}

function registerRangePreset(newRange: ItemRangePreset) {
    if (newRange[1] <= newRange[0]) {
        throw new Error(`Can't register item range ${newRange[0]}-${newRange[0]}: malformed range`);
    }
    const conflict = itemRangePresets.some((range) => {
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

function findRangePreset(itemId: number) {
    return itemRangePresets.find((range) => {
        return itemId >= range[0] && itemId <= range[1];
    });
}

function handleItem(item: NetworkItem) {
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
        Object.keys(DEFAULT_HANDLERS).forEach((itemType) => {
            registerItemTypeHandler(itemType, DEFAULT_HANDLERS[itemType]);
        });
    }

    ArchiRPG.client.addListener(SERVER_PACKET_TYPE.RECEIVED_ITEMS, (packet) => {
        Logger.log("Received items", packet);
        if (!$gameSystem) return; // Game not started

        const { nextItemIndex } = $gameSystem.archipelagoData;
        const newItems = packet.items.slice(nextItemIndex);
        newItems.map(handleItem);
        
        ArchiRPG.API.showReceivedItems(newItems);
        $gameSystem.archipelagoData.nextItemIndex = packet.items.length;
    });
});
