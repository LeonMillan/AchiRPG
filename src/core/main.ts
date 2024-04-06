import '@leonmillan/rpgmaker-ts/lib/global';
import { Client, ITEMS_HANDLING_FLAGS } from 'archipelago.js';

import { IArchiRPG } from '../Context';
import { connect } from './client';
import { Params } from './parameters';
import * as API from './api';
import './overrides';
import './commands';

const ArchiRPG: IArchiRPG = window.ArchiRPG || {
    API: {
        connect,
        ...API,
    },
    world: {
        name: Params.GAME_NAME,
        type: window.Utils.RPGMAKER_NAME,
        baseId: Params.BASE_ID,
        itemsHandling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
    },
    client: new Client(),
    scoutedItems: {},
    unknownItemDetails: {
        name: "??????????",
        playerName: "someone",
        isOwnItem: false,
    },
    checkedLocations: [],
    options: {},
    slot: -1,
    team: -1,
};
window.ArchiRPG = ArchiRPG;
