export enum Goal {
    DefeatEnemy,
    DefeatTroop,
    ReachMap,
}

export type GoalCheck = "troop" | "map";

export enum InitialParty {
    Vanilla = 0,
}

export enum SaveAccess {
    Normal,
    AlwaysEnabled,
    AlwaysDisabled,
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
