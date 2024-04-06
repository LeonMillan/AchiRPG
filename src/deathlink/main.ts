import { DeathLinkData, SERVER_PACKET_TYPE } from 'archipelago.js';

import { onDeathEvent } from './deathHandling';
import './autoTrigger';
import './types';

ArchiRPG.API.isDeathlinkParticipant = function() {
    return ArchiRPG.API.getGameOption('deathLink', 0) === 1;
}

const __getClientTags = ArchiRPG.API.getClientTags;
ArchiRPG.API.getClientTags = function() {
    const tags = __getClientTags();
    return tags.concat("DeathLink");
}

window.addEventListener('load', () => {
    ArchiRPG.client.addListener(SERVER_PACKET_TYPE.BOUNCED, (packet) => {
        if (packet.tags?.includes("DeathLink")) {
            const deathData = packet.data as DeathLinkData;
            onDeathEvent(deathData);
        }
    });
});
