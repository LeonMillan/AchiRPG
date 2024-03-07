import { makeHash, makePluginCommand } from "../Utils";
import { GoalCheck } from "../Types";

makePluginCommand('startGame', () => {
    ArchiRPG.API.startGame();
});

makePluginCommand('locationScout', (location: string) => {
    const convertedLocation = Number.isNaN(Number(location)) ? location : Number(location);
    ArchiRPG.API.locationScout(convertedLocation);
});

makePluginCommand('locationCheck', (location: string) => {
    const convertedLocation = Number.isNaN(Number(location)) ? location : Number(location);
    ArchiRPG.API.locationCheck(convertedLocation);
});

makePluginCommand('goalCheck', (goal: GoalCheck, preventCompletion?: string) => {
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

makePluginCommand('showCustomMessage', (message: string) => {
    ArchiRPG.API.showCustomMessage(message);
});

const AUTOPATCH_SUPPORTED_CODES = [
    125, // Change Gold
    126, // Change Items
    127, // Change Weapons
    128, // Change Armors
    129, // Change Party Member
];
const AUTOPATCH_SKIP_CODES = [
    101, // Show Text
    401, // Show Text data
    ...AUTOPATCH_SUPPORTED_CODES,
]
makePluginCommand('autopatchCheck', function(location: string) {
    const locationId = ArchiRPG.API.getLocationId(location);

    // Ensure expected event commands are present
    const nextCmd = this.nextEventCode();
    if (!AUTOPATCH_SUPPORTED_CODES.includes(nextCmd)) {
        throw new Error(`Can't auto patch command code ${nextCmd}`);
    }
    // Skip commands
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

// TODO: remove these
declare const $dataMapInfos: any;
declare const $gameMap: any;
