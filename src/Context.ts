import { Client, GamePackage, ItemsHandlingFlags, NetworkItem } from 'archipelago.js';
import { ISlotData } from './SlotData';
import { GoalCheck } from './Types';

export interface IArchiRPGAPI {
    connect(playerName: string, hostName: string, port: number, password: string): Promise<boolean>;
    startGame(): void;
    completeGame(): void;
    getLocationId(location: string | number): number;
    locationScout(location: string | number): void;
    locationCheck(location: string | number): void;
    goalCheck(goal: GoalCheck, preventCompletion?: boolean): void;
    showReceivedItems(items: NetworkItem[]): void;
    showUnlockedItems(items: NetworkItem[]): void;
    showCustomMessage(message: string): void;
}

export interface IArchiRPG {
    API: IArchiRPGAPI,
    world: {
        name: string;
        type: 'MV' | 'MZ';
        baseId: number;
        itemsHandling: ItemsHandlingFlags;
    },
    client: Client<ISlotData>;
    options: ISlotData,
    dataPackage: GamePackage,
    knownLocations: Record<number, NetworkItem>,
    checkedLocations: number[],
    slot: number;
    team: number;
}

declare global {
    var ArchiRPG: IArchiRPG;
}
