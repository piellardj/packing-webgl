import "./page-interface-generated";

const controlId = {
    LINES_PATTERN: "lines-pattern-style-tabs-id",
    PRIMITIVE: "primitive-tab-id",
    DENSITY: "density-range-id",
    SPACING: "spacing-range-id",
    NEW_ITEM: "new-item-button-id",
    ZOOM_SPEED: "zoom-speed-range-id",
    DOWNLOAD: "result-download-id",
};

type RedrawObserver = () => unknown;
const redrawObservers: RedrawObserver[] = [];
function triggerRedraw(): void {
    for (const observer of redrawObservers) {
        observer();
    }
}
Page.Canvas.Observers.canvasResize.push(triggerRedraw);

type AddItemObserver = () => unknown;
const addItemObservers: AddItemObserver[] = [];
function triggerAddItem(): void {
    for (const observer of addItemObservers) {
        observer();
    }
}
Page.Button.addObserver(controlId.NEW_ITEM, triggerAddItem);

type ClearObserver = () => unknown;
const clearObservers: ClearObserver[] = [];
function triggerClear(): void {
    for (const observer of clearObservers) {
        observer();
    }
}
Page.Tabs.addObserver(controlId.PRIMITIVE, triggerClear);
Page.Range.addObserver(controlId.SPACING, () => {
    if (!Parameters.isZooming) {
        triggerClear();
    }
});

enum EPrimitive {
    SQUARE = "square",
    CIRCLE = "circle",
}

abstract class Parameters {
    public static get density(): number {
        return Page.Range.getValue(controlId.DENSITY);
    }

    public static get spacing(): number {
        return Page.Range.getValue(controlId.SPACING);
    }

    public static get primitive(): EPrimitive {
        return Page.Tabs.getValues(controlId.PRIMITIVE)[0] as EPrimitive;
    }

    public static get zoomSpeed(): number {
        return Page.Range.getValue(controlId.ZOOM_SPEED);
    }
    public static get isZooming(): boolean {
        return Math.abs(Parameters.zoomSpeed) > .001; // avoid float precision issues
    }

    public static addRedrawObserver(callback: RedrawObserver): void {
        redrawObservers.push(callback);
    }

    public static addItemObserver(callback: AddItemObserver): void {
        addItemObservers.push(callback);
    }

    public static addClearObserver(callback: ClearObserver): void {
        clearObservers.push(callback);
    }

    public static addDownloadObserver(callback: () => unknown): void {
        Page.FileControl.addDownloadObserver(controlId.DOWNLOAD, callback);
    }
}

export { Parameters, EPrimitive }
