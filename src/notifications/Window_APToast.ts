import * as MV from "@leonmillan/rpgmaker-ts/lib/mv";
import { NotificationsPosition } from "./types";

const { Graphics } = window;

export class Window_APToast extends MV.Window_Base {
    timer: number = 0;
    renderedWidth: number = 0;
    toastPosition: NotificationsPosition = NotificationsPosition.TopLeft;
    messageQueue: string[] = [];

    constructor() {
        //@ts-expect-error
        super();
    }
    initialize() {
        super.initialize.apply(this, this.getRect());
        this.setBackgroundType(1);
        this.openness = 0;
    }

    standardFontSize() { return 22; }
    standardPadding() { return 6; }
    textPadding() { return 4; }

    getRect(): number[] {
        const x = 0;
        const y = 0;
        const width = Graphics.boxWidth * 3 / 4;
        const height = this.fittingHeight(1);
        return [ x, y, width, height ];
    }

    showMessage(message: string) {
        if (this.isOpening() || this.isOpen()) {
            this.messageQueue.push(message);
            return;
        }
        this.renderMessage(message);
    }

    renderMessage(message: string) {
        this.contents.clear();
        this.renderedWidth = this.drawTextEx(message, 0, 0);
        this.timer = this.messageQueue.length > 0 ? 120 : 240;
        this.openness = 0;
        this.updateToastPosition();
        this.open();
    }

    setToastPosition(position: NotificationsPosition) {
        this.toastPosition = position;
        this.updateToastPosition();
    }

    update() {
        super.update();
        if (this.isOpen()) {
            this.timer -= 1;
            if (this.timer <= 0) {
                this.advanceQueue();
            }
        }
    }

    advanceQueue() {
        const nextMessage = this.messageQueue.shift();
        if (!nextMessage) {
            this.close();
            return;
        }
        this.renderMessage(nextMessage);
    }

    updateToastPosition() {
        const right = (this.toastPosition % 2) === 1;
        const bottom = this.toastPosition >= 2;
        const margin = 48;
        this.x = right ? Graphics.boxWidth - this.width : 0;
        this.y = bottom ? Graphics.boxHeight - this.height - margin : margin;
        this.origin.x = right ? -this.contentsWidth() + this.renderedWidth : 0;
    }
}
