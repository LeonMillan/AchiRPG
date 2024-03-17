import { NetworkItem } from "archipelago.js";

export interface IScoutedItem extends NetworkItem {
    target: NetworkItem["player"];
}

export interface IItemDetails {
    name: string;
    playerName: string;
    isOwnItem: boolean;
}

export interface IShopOverrideItem {
    location?: string;
    price?: number;
    name?: string;
}

export interface ITempData {
    shop: {
        overrideList: IShopOverrideItem[];
        revealArchipelagoItems: boolean;
    };
}

export enum Goal {
    DefeatEnemy,
    DefeatTroop,
    ReachMap,
}

export type GoalCheck = "troop" | "map";
