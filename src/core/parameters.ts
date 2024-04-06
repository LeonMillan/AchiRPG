const { PluginManager } = window;

const PLUGIN_NAME = "ArchiRPG";
const PLUGIN_PARAMS = PluginManager.parameters(PLUGIN_NAME);

function getParam<T = string>(key: string, defValue: T): T {
    if (!(key in PLUGIN_PARAMS)) return defValue;
    return PLUGIN_PARAMS[key] as T;
}

function getParamNum(key: string, defValue: number): number {
    if (!(key in PLUGIN_PARAMS)) return defValue;
    const parsedVal = Number(PLUGIN_PARAMS[key]);
    return Number.isNaN(parsedVal) ? defValue : parsedVal;
}

function getParamBool(key: string, defValue: boolean): boolean {
    if (!(key in PLUGIN_PARAMS)) return defValue;
    return (PLUGIN_PARAMS[key] as string).toLowerCase() === 'true';
}

function getParamJson<T>(key: string, defValue: T): T {
    if (!(key in PLUGIN_PARAMS)) return defValue;
    return JSON.parse(PLUGIN_PARAMS[key] as string);
}

export const Params = {
    GAME_NAME: getParam("GameName", "RPG Maker"),
    BASE_ID: getParam("BaseID", 774_000_000_000),
    ENABLE_SAVE_BINDING: getParamBool("EnableSaveBinding", true),
};
