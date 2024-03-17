// Augment game options
declare module '../SlotData' {
    export interface ISlotData {
        initialParty: InitialParty | number,
        saveAccess: SaveAccess;
    }
}

export enum InitialParty {
    Vanilla = 0,
    // Values above zero will be treated as actor ID
}

export enum SaveAccess {
    Normal,
    AlwaysEnabled,
    AlwaysDisabled,
}

export { ISlotData } from '../SlotData';
