// Augment game options
declare module '../SlotData' {
    export interface ISlotData {
        notifications: Notifications;
        notificationsPosition: NotificationsPosition;
    }
}

export enum Notifications {
    None,
    Toast,
}

export enum NotificationsPosition {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
}
