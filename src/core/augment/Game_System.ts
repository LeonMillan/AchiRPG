import * as MV from "@leonmillan/rpgmaker-ts/lib/mv";
import { IGameSaveData } from "../../GameSaveData";

declare module '@leonmillan/rpgmaker-ts/lib/mv' {
    interface Game_System {
        archipelagoData: IGameSaveData;
    }
}

const __Game_System__initialize = window.Game_System.prototype.initialize;
window.Game_System.prototype.initialize = function(this: MV.Game_System) {
    __Game_System__initialize.call(this);
    this.archipelagoData = {
        nextItemIndex: 0,
        goalChecks: {
            troop: false,
            map: false,
        },
        locationChecks: [],
    };
}
