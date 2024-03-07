export type ItemTypeHandler = (itemId: number, ...params: unknown[]) => void;
export type ItemRangePreset = [firstId: number, lastId: number, type: string, ...params: unknown[]];