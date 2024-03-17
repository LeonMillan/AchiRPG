import { Client, GamePackage, ItemsHandlingFlags, NetworkItem } from 'archipelago.js';
import { ISlotData } from './SlotData';
import { GoalCheck, IItemDetails, IScoutedItem } from './Types';

export interface IArchiRPGAPI {
    connect(playerName: string, hostName: string, port: number, password: string): Promise<boolean>;
    startGame(): void;
    completeGame(): void;
    getLocationId(location: string | number): number;
    getScoutedItem(location: string | number): IScoutedItem | undefined;
    getScoutedItemDetails(location: string | number): IItemDetails;
    isLocationChecked(location: string | number): boolean;
    locationScout(location: string | number): void;
    locationCheck(location: string | number): void;
    goalCheck(goal: GoalCheck, preventCompletion?: boolean): void;
    showReceivedItems(items: NetworkItem[]): void;
    showUnlockedItems(items: NetworkItem[]): void;
    showCustomMessage(message: string): void;
    getGameOption<K extends keyof ISlotData>(key: K): ISlotData[K] | undefined;
    getGameOption<K extends keyof ISlotData>(key: K, defaultValue: ISlotData[K]): ISlotData[K];
}

export interface IArchiRPG {
    API: IArchiRPGAPI;
    world: {
        name: string;
        type: 'MV' | 'MZ';
        baseId: number;
        itemsHandling: ItemsHandlingFlags;
    };
    client: Client<ISlotData>;
    options: ISlotData;
    dataPackage: GamePackage;
    scoutedItems: Record<number, IScoutedItem>;
    unknownItemDetails: IItemDetails;
    checkedLocations: number[];
    slot: number;
    team: number;
}

declare global {
    var ArchiRPG: IArchiRPG;
}
