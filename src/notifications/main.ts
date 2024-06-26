import '@leonmillan/rpgmaker-ts/lib/global';
import { ChatJSONPacket, ITEM_FLAGS, NetworkItem, SERVER_PACKET_TYPE } from 'archipelago.js';
import { Window_APToast } from './Window_APToast';
import { Notifications } from "./types";

const { SceneManager } = window;

declare module '@leonmillan/rpgmaker-ts/lib/mv' {
    interface Scene_Base {
        _archiToastWindow: Window_APToast;
    }
}

declare module '@leonmillan/rpgmaker-ts/lib/mz' {
    interface Scene_Base {
        _archiToastWindow: Window_APToast;
    }
}

const COLOR_INDEX = {
    PlayerName: 4,
    ItemName: 6,
    TrapName: 10,
};

const ICON_INDEX = {
    Chat: 4,
    Trap: 10,
    GoldStar: 87,
    SilverStar: 88,
    BronzeStar: 89,
};

window.addEventListener('load', () => {
    ArchiRPG.client.addListener(SERVER_PACKET_TYPE.PRINT_JSON, (packet) => {
        if (packet.type === 'Chat') handleChatMessage(packet);
    });
});

function getPlayerColor() {
    return COLOR_INDEX.PlayerName;
}

function getItemColor(item: NetworkItem) {
    const isTrap = !!(item.flags & ITEM_FLAGS.TRAP);
    
    return isTrap ? COLOR_INDEX.TrapName : COLOR_INDEX.ItemName;
}

function getItemIcon(item: NetworkItem) {
    const isProgression = !!(item.flags & ITEM_FLAGS.PROGRESSION);
    const isImportant = !!(item.flags & ITEM_FLAGS.NEVER_EXCLUDE);
    const isTrap = !!(item.flags & ITEM_FLAGS.TRAP);
    
    let iconIndex = ICON_INDEX.BronzeStar;
    if (isImportant) iconIndex = ICON_INDEX.SilverStar;
    if (isProgression) iconIndex = ICON_INDEX.GoldStar;
    if (isTrap) iconIndex = ICON_INDEX.Trap;

    return iconIndex;
}

function makeMessage(message: string, icon?: number) {
    if (!icon) return message;
    const position = ArchiRPG.API.getGameOption('notificationsPosition', 0);
    const leftAlign = (position % 2) === 0;
    return leftAlign
        ? `\\I[${icon}] ${message}`
        : `${message} \\I[${icon}]`;
}

function handleReceivedItem(item: NetworkItem) {
    const isOwnItem = item.player === ArchiRPG.slot;
    if (isOwnItem) return;
    const playerName = ArchiRPG.client.players.alias(item.player);
    const itemName = ArchiRPG.client.items.name(ArchiRPG.slot, item.item);
    const itemIcon = getItemIcon(item);
    const itemColor = getItemColor(item);
    const playerColor = getPlayerColor();
    
    const msgPlayer = `\\C[${playerColor}]${playerName}\\C[0]`;
    const msgItem = `\\C[${itemColor}]${itemName}\\C[0]`;
    const message = makeMessage(`${msgPlayer} sent you ${msgItem}`, itemIcon);

    showNotification(message);
}

function handleUnlockedItem(item: NetworkItem) {
    const isOwnItem = item.player === ArchiRPG.slot;
    const playerName = ArchiRPG.client.players.alias(item.player);
    const itemName = ArchiRPG.client.items.name(item.player, item.item);
    const itemIcon = getItemIcon(item);
    const itemColor = getItemColor(item);
    const playerColor = getPlayerColor();
    
    const msgPlayer = `\\C[${playerColor}]${playerName}\\C[0]`;
    const msgItem = `\\C[${itemColor}]${itemName}\\C[0]`;
    const message = makeMessage(
        isOwnItem
            ? `You got ${msgItem}`
            : `You found ${msgItem} for ${msgPlayer}`,
        itemIcon,
    );

    showNotification(message);
}

function handleChatMessage(packet: ChatJSONPacket) {
    const playerName = ArchiRPG.client.players.name(packet.slot);
    const playerColor = getPlayerColor();

    const msgPlayer = `\\C[${playerColor}]${playerName}\\C[0]`;
    const message = makeMessage(`${msgPlayer}: ${packet.message}`, ICON_INDEX.Chat);

    showNotification(message);
}

function showNotification(message: string) {
    const type = ArchiRPG.API.getGameOption('notifications', Notifications.Toast);
    switch (type) {
        case Notifications.Toast:
            showNotificationToast(message);
            break;
    
        default:
            break;
    }
}

function showNotificationToast(message: string) {
    if (!SceneManager._scene) return;
    const position = ArchiRPG.API.getGameOption('notificationsPosition', 0);
    const scene = SceneManager._scene;
    let toast = scene._archiToastWindow || new Window_APToast();
    toast.showMessage(message);
    toast.setToastPosition(position);
    if (!scene._archiToastWindow) {
        scene._archiToastWindow = toast;
        scene.addChildAt(toast, scene.children.length);
    } else if (scene.children.indexOf(toast) < scene.children.length - 1) {
        scene.removeChild(toast);
        scene.addChildAt(toast, scene.children.length);
    }
}

const __SceneManager__changeScene = SceneManager.changeScene;
SceneManager.changeScene = function() {
    const prevScene = this._scene;
    __SceneManager__changeScene.call(this);
    if (prevScene && this._scene !== prevScene && prevScene._archiToastWindow) {
        const toast = prevScene._archiToastWindow;
        this._scene._archiToastWindow = toast;
        this._scene.addChildAt(toast, this._scene.children.length);
    }
}

const __SceneManager__onSceneStart = SceneManager.onSceneStart;
SceneManager.onSceneStart = function() {
    const prevScene = this._scene;
    __SceneManager__onSceneStart.call(this);
    if (prevScene && this._scene !== prevScene && prevScene._archiToastWindow) {
        const toast = prevScene._archiToastWindow;
        this._scene._archiToastWindow = toast;
        this._scene.addChildAt(toast, this._scene.children.length);
    }
}

ArchiRPG.API.showReceivedItems = function (items: NetworkItem[]) {
    items.forEach(handleReceivedItem);
};

ArchiRPG.API.showUnlockedItems = function (items: NetworkItem[]) {
    items.forEach(handleUnlockedItem);
};

ArchiRPG.API.showCustomMessage = function (message: string) {
    showNotification(message);
};
