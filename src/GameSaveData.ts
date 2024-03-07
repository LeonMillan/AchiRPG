import { GoalCheck } from "./Types";

export interface IGameSaveData {
    nextItemIndex: number;
    goalChecks: Record<GoalCheck, boolean>;
    locationChecks: number[];
}
