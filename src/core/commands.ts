import { makePluginCommand, parseDictString } from "../Utils";
import { GoalCheck, IShopOverrideItem, ITempData } from "../Types";

const AUTOPATCH_CHECK_SUPPORTED_CODES = [
    125, // Change Gold
    126, // Change Items
    127, // Change Weapons
    128, // Change Armors
    129, // Change Party Member
];
const AUTOPATCH_CHECK_SKIP_CODES = [
    101, // Show Text
    401, // Show Text data
    ...AUTOPATCH_CHECK_SUPPORTED_CODES,
];

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

makePluginCommand('showCustomMessage', (message: string) => {
    ArchiRPG.API.showCustomMessage(message);
});

makePluginCommand('autopatchCheck', function(location: string) {
    const locationId = ArchiRPG.API.getLocationId(location);

    // Ensure expected event commands are present
    const nextCmd = this.nextEventCode();
    if (!AUTOPATCH_CHECK_SUPPORTED_CODES.includes(nextCmd)) {
        throw new Error(`Can't auto patch command code ${nextCmd}`);
    }
    // Skip commands
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

makePluginCommand('autopatchShop', function(...tags: string[]) {
    const revealArchipelagoItems = tags.includes("revealArchipelagoItems");
    
    // Ensure that the next event command is "Shop Processing"
    const nextCmd = this.nextEventCode();
    if (nextCmd !== 302) {
        throw new Error(`Can't auto patch command code ${nextCmd}`);
    }

    // Check for comment lines to override shop list
    const overrideList: IShopOverrideItem[] = [];
    for (let i = this._index + 1; this._list[i]; i++) {
        const command = this._list[i];
        // Skip "Shop Processing" commands
        if ([302, 605].includes(command.code)) continue;
        // Only use "Comment" commands, stop processing if we find something else
        if (![108, 408].includes(command.code)) break;
        
        const parsedComment = parseDictString(command.parameters[0]);
        overrideList.push({
            name: parsedComment["name"],
            location: parsedComment["location"],
            price: parsedComment["price"] ? Number(parsedComment["price"]) : undefined,
        });
    }

    $gameTemp.archiRPG.shop.overrideList = overrideList;
    $gameTemp.archiRPG.shop.revealArchipelagoItems = revealArchipelagoItems;
});

// TODO: remove these
declare const $dataMapInfos: any;
declare const $gameMap: any;
declare const $gameTemp: unknown & {
    archiRPG: ITempData;
};
