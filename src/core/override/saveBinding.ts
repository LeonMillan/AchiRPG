import { Params } from '../parameters';

const __DataManager__makeSavefileInfo = DataManager.makeSavefileInfo;
DataManager.makeSavefileInfo = function() {
    const info = __DataManager__makeSavefileInfo.call(this);
    info.apSeed = ArchiRPG.API.getRoomIdentifier();
    return info;
}

const __DataManager__isThisGameFile = DataManager.isThisGameFile;
DataManager.isThisGameFile = function(savefileId) {
    const result = __DataManager__isThisGameFile.call(this);
    if (Params.ENABLE_SAVE_BINDING && ArchiRPG.API.isArchipelagoMode()) {
        if (!ArchiRPG.API.isConnected()) return false;
        const globalInfo = this.loadGlobalInfo();
        if (!globalInfo) return false;
        if (!globalInfo[savefileId]) return false;
        return globalInfo[savefileId].apSeed === ArchiRPG.API.getRoomIdentifier();
    }
    return result;
}

// TODO: remove these
declare const DataManager: any;
