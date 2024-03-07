export const PLUGIN_NAME = 'ArchiRPG';

const LOG_PREFIX = `[${PLUGIN_NAME}]`;
export const Logger = {
    log: console.log.bind(null, LOG_PREFIX),
    warn: console.warn.bind(null, LOG_PREFIX),
    error: console.error.bind(null, LOG_PREFIX),
};

/**
 * Get full command name for RPG Maker MV
 */
export function makeCommandNameMV(name: string) {
    return `${PLUGIN_NAME}.${name}`;
}

/**
 * Register a plugin command, compatible with both MV and MZ.
 */
export function makePluginCommand<F extends (...args: string[]) => void>(name: string, func: F) {
    if ('registerCommand' in window.PluginManager) {
        window.PluginManager.registerCommand(PLUGIN_NAME, name, func);
        return;
    }

    const __Game_Interpreter__pluginCommand = window.Game_Interpreter!.prototype.pluginCommand;
    window.Game_Interpreter!.prototype.pluginCommand = function(command, args) {
        if (command === makeCommandNameMV(name)) {
            return func.apply(this, args);
        }
        __Game_Interpreter__pluginCommand.call(this, command, args);
    };
}

export function makeHash(...numbers: number[]): string {
    return numbers.map((n) => n.toString(36).padStart(3, '0')).join('');
}
