import { DeathLinkData, SERVER_PACKET_TYPE } from 'archipelago.js';

import { onDeathEvent } from './deathHandling';
import './autoTrigger';

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
