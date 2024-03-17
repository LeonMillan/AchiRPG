import { ITempData } from "../../Types";

declare const Game_Temp: any;

const __Game_Temp__initialize = Game_Temp.prototype.initialize;
Game_Temp.prototype.initialize = function() {
    __Game_Temp__initialize.call(this);
    this.archiRPG = {
        shop: {
            overrideList: [],
            revealArchipelagoItems: false,
        },
    } as ITempData;
}
