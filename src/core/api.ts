import { CLIENT_STATUS, CREATE_AS_HINT_MODE, NetworkItem } from "archipelago.js";
import { GoalCheck } from "../Types";

export function startGame() {
    ArchiRPG.client.updateStatus(CLIENT_STATUS.PLAYING);
    ArchiRPG.client.send({ cmd: "Sync" });
}

export function getLocationId(location: string | number) {
    const locationId = typeof location === 'string'
        ? ArchiRPG.dataPackage.location_name_to_id[location.replace(/_/g, ' ')]
        : location;
    return locationId;
}

export function locationScout(location: string | number) {
    const locationId = getLocationId(location);
    ArchiRPG.client.locations.scout(CREATE_AS_HINT_MODE.NO_HINT, locationId);
}

export function locationCheck(location: string | number) {
    const locationId = getLocationId(location);
    ArchiRPG.client.locations.check(locationId);
}

export function goalCheck(goal: GoalCheck, preventCompletion?: boolean) {
    const data = $gameSystem.archipelagoData;
    data.goalChecks[goal] = true;
    if (!preventCompletion) {
        const allChecks = [
            data.goalChecks.troop || !ArchiRPG.options.goalTroop,
            data.goalChecks.map || !ArchiRPG.options.goalMap,
        ];
        const allComplete = allChecks.every((check) => check);
        if (allComplete) {
            completeGame();
        }
    }
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
