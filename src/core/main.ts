import '@leonmillan/rpgmaker-ts/lib/global';
import { Client, ITEMS_HANDLING_FLAGS } from 'archipelago.js';

import { IArchiRPG } from '../Context';
import { DEFAULT_DATA } from '../SlotData';
import { connect } from './client';
import * as API from './api';
import './overrides';
import './commands';

const ArchiRPG: IArchiRPG = window.ArchiRPG || {
    API: {
        connect,
        ...API,
    },
    world: {
        name: 'RPG Maker',
        type: window.Utils.RPGMAKER_NAME,
        baseId: 774_000_000_000,
        itemsHandling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
    },
    client: new Client(),
    knownLocations: {},
    checkedLocations: [],
    options: DEFAULT_DATA,
    slot: -1,
    team: -1,
};
window.ArchiRPG = ArchiRPG;
