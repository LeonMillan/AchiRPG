import { RPGData } from "@leonmillan/rpgmaker-ts/lib";
import { makeCommandNameMV } from "../../Utils";

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

// TODO: remove these
declare const Game_Interpreter: any;
