import { CLIENT_STATUS, CONNECTION_STATUS, CREATE_AS_HINT_MODE, NetworkItem } from "archipelago.js";
import { GoalCheck, IItemDetails, IScoutedItem } from "../Types";
import { ISlotData } from "../SlotData";
import { Logger } from "../Utils";

export function isArchipelagoMode(): boolean {
    return true;
}

export function isConnected(): boolean {
    return ArchiRPG.client.status === CONNECTION_STATUS.CONNECTED;
}

export function isDeathlinkParticipant(): boolean {
    return ArchiRPG.tags.includes("DeathLink");
}

export function getClientTags(): string[] {
    return [];
}

export function getRoomIdentifier(): string {
    return ArchiRPG.client.data.seed;
}

export function getGameOption<K extends keyof ISlotData>(key: K, defaultValue: ISlotData[K]): ISlotData[K] {
    return ArchiRPG.options[key] || defaultValue;
}

export function startGame() {
    if (!ArchiRPG.dataPackage) {
        Logger.warn("Game started without data package, Archipelago may not work correctly");
    }
    ArchiRPG.client.updateStatus(CLIENT_STATUS.PLAYING);
    ArchiRPG.client.send({ cmd: "Sync" });
}

export function getLocationId(location: string | number): number {
    if (!ArchiRPG.dataPackage) return 0;

    const locationId = typeof location === 'string'
        ? ArchiRPG.dataPackage.location_name_to_id[location.replace(/_/g, ' ')]
        : location;
    return locationId;
}

export function getScoutedItem(location: string | number): IScoutedItem | undefined {
    const locationId = getLocationId(location);
    return ArchiRPG.scoutedItems[locationId];
}

export function getScoutedItemDetails(location: string | number): IItemDetails {
    const scoutedItem = ArchiRPG.API.getScoutedItem(location);
    if (!scoutedItem) return ArchiRPG.unknownItemDetails;
    return {
        name: ArchiRPG.client.items.name(scoutedItem.target, scoutedItem.item),
        playerName: ArchiRPG.client.players.alias(scoutedItem.target),
        isOwnItem: scoutedItem.target === ArchiRPG.slot,
    };
}

export function isLocationChecked(location: string | number): boolean {
    const locationId = getLocationId(location);
    return ArchiRPG.client.locations.checked.includes(locationId);
}

export function locationScout(location: string | number) {
    const locationId = getLocationId(location);
    ArchiRPG.client.locations.scout(CREATE_AS_HINT_MODE.NO_HINT, locationId);
}

export function locationCheck(location: string | number, hideNotification?: boolean) {
    const locationId = getLocationId(location);
    ArchiRPG.client.locations.check(locationId);
    
    if (hideNotification) return;
    const item = ArchiRPG.API.getScoutedItem(locationId);
    if (item) {
        ArchiRPG.API.showUnlockedItems([item]);
    }
}

export function goalCheck(goal: GoalCheck, preventCompletion?: boolean) {
    // Placeholder
}

export function triggerDeathlink(cause: string = "") {
    const source = ArchiRPG.client.players.alias(ArchiRPG.slot);
    ArchiRPG.client.send({
        cmd: "Bounce",
        tags: ["DeathLink"],
        data: {
            cause,
            source,
            time: Date.now(),
        },
    });
}

export function completeGame() {
    ArchiRPG.client.updateStatus(CLIENT_STATUS.GOAL);
    ArchiRPG.client.locations.autoRelease();
}

export function showReceivedItems(items: NetworkItem[]) {
    // Placeholder, must be overwritten
}

export function showUnlockedItems(items: NetworkItem[]) {
    // Placeholder, must be overwritten
}

export function showCustomMessage(message: string) {
    // Placeholder, must be overwritten
}
