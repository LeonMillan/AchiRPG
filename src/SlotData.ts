import { Goal, InitialParty, Notifications, NotificationsPosition, SaveAccess } from './Types';

/**
 * Game options which are received from the server when connected
 */
export interface ISlotData {
    goal: Goal;
    goalTroop: number;
    goalMap: number;
    initialParty: InitialParty | number,
    saveAccess: SaveAccess;
    notifications: Notifications;
    notificationsPosition: NotificationsPosition;
}

export const DEFAULT_DATA: ISlotData = {
    goal: Goal.DefeatEnemy,
    goalTroop: 0,
    goalMap: 0,
    initialParty: InitialParty.Vanilla,
    saveAccess: SaveAccess.Normal,
    notifications: Notifications.None,
    notificationsPosition: NotificationsPosition.BottomLeft,
}
