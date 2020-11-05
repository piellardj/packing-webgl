import "./page-interface-generated";

const controlId = {
    LINES_PATTERN: "lines-pattern-style-tabs-id",
    PRIMITIVE: "primitive-tab-id",
    DENSITY: "density-range-id",
    SPACING: "spacing-range-id",
    MIN_SIZE: "min-size-range-id",
    NEW_ITEM: "new-item-button-id",
    ZOOM_SPEED: "zoom-speed-range-id",
    CELL_SIZE: "cell-size-range-id",
    ONE_CELL_ONLY: "one-cell-only-checkbox-id",
    SHOW_GRID: "show-grid-checkbox-id",
    CELL_X: "cell-x-range-id",
    CELL_Y: "cell-y-range-id",
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
Page.Checkbox.addObserver(controlId.ONE_CELL_ONLY, triggerRedraw);
Page.Checkbox.addObserver(controlId.SHOW_GRID, triggerRedraw);
Page.Range.addObserver(controlId.CELL_X, triggerRedraw);
Page.Range.addObserver(controlId.CELL_Y, triggerRedraw);

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
Page.Range.addObserver(controlId.MIN_SIZE, () => {
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

    public static get minSize(): number {
        return Page.Range.getValue(controlId.MIN_SIZE);
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

    public static get cellSize(): number {
        return Page.Range.getValue(controlId.CELL_SIZE);
    }
    public static get oneCellOnly(): boolean {
        return Page.Checkbox.isChecked(controlId.ONE_CELL_ONLY);
    }
    public static get showGrid(): boolean {
        return Page.Checkbox.isChecked(controlId.SHOW_GRID);
    }
    public static get cellX(): number {
        return Page.Range.getValue(controlId.CELL_X);
    }
    public static get cellY(): number {
        return Page.Range.getValue(controlId.CELL_Y);
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
