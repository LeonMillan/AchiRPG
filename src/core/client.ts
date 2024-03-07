import { ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE } from 'archipelago.js';
import { Logger } from "../Utils";
import { ISlotData } from '../SlotData';

export async function connect(player: string, hostname: string, port: number, password: string): Promise<boolean> {
    try {
        const response = await ArchiRPG.client.connect({
            name: player,
            game: ArchiRPG.world.name,
            hostname,
            port: port,
            password,
            items_handling: ArchiRPG.world.itemsHandling,
        });
        ArchiRPG.slot = response.slot;
        ArchiRPG.team = response.team;
        ArchiRPG.options = (response.slot_data as unknown as ISlotData);
        return true;
    } catch (err: unknown) {
        Logger.error("Failed to connect", err);
        return false;
    }
}

window.addEventListener('load', () => {
    ArchiRPG.client.addListener(SERVER_PACKET_TYPE.CONNECTED, (packet) => {
        Logger.log("Connected to server: ", packet);
        ArchiRPG.checkedLocations = packet.checked_locations;
    });

    ArchiRPG.client.addListener(SERVER_PACKET_TYPE.ROOM_UPDATE, (packet) => {
        Logger.log("Room update: ", packet);
    });

    ArchiRPG.client.addListener(SERVER_PACKET_TYPE.DATA_PACKAGE, (packet) => {
        const currGameData = packet.data.games[ArchiRPG.world.name];
        ArchiRPG.dataPackage = currGameData;
    });

    ArchiRPG.client.addListener(SERVER_PACKET_TYPE.LOCATION_INFO, (packet) => {
        packet.locations.forEach((item) => {
            ArchiRPG.knownLocations[item.location] = item;
        });
    });
});

window.addEventListener("beforeunload", function() {
    ArchiRPG.client.disconnect();
});
