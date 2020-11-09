import * as Helpers from "./utils/helper";

import "./page-interface-generated";

const controlId = {
    PRIMITIVE: "primitive-tab-id",
    SPACING: "spacing-range-id",
    MIN_SIZE: "min-size-range-id",
    ALLOW_OVERLAPPING: "allow-overlapping-checkbox-id",
    NEW_ITEM: "new-item-button-id",
    ZOOM_SPEED: "zoom-speed-range-id",
    BLACK_BACKGROUND: "black-background-checkbox-id",
    BLENDING: "blending-checkbox-id",
    INDICATORS: "indicators-checkbox-id",
    MAX_TRIES_PER_FRAME: "max-tries-per-frame-range-id",
    CELL_SIZE: "cell-size-range-id",
    ONE_CELL_ONLY: "one-cell-only-checkbox-id",
    SHOW_GRID: "show-grid-checkbox-id",
    CELL_X: "cell-x-range-id",
    CELL_Y: "cell-y-range-id",
    INSTANCING: "instancing-checkbox-id",
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
Page.Checkbox.addObserver(controlId.ALLOW_OVERLAPPING, triggerRedraw);
Page.Checkbox.addObserver(controlId.BLACK_BACKGROUND, triggerRedraw);
Page.Checkbox.addObserver(controlId.ONE_CELL_ONLY, triggerRedraw);
Page.Checkbox.addObserver(controlId.SHOW_GRID, triggerRedraw);
Page.Checkbox.addObserver(controlId.INSTANCING, triggerRedraw);
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
    RECTANGLE = "rectangle",
}

const isInDebug = Helpers.getQueryStringValue("debug") === "1";
Page.Sections.setVisibility("debug-section", isInDebug);
Page.Canvas.setIndicatorVisibility("main-loop-time", isInDebug);
Page.Canvas.setIndicatorVisibility("draw-time", isInDebug);
Page.Canvas.setIndicatorVisibility("update-time", isInDebug);
Page.Canvas.setIndicatorVisibility("items-reclycled-count", isInDebug);
Page.Canvas.setIndicatorVisibility("items-pending-recycling-count", isInDebug);
Page.Canvas.setIndicatorVisibility("items-recycling-tries-count", isInDebug);
Page.Canvas.setIndicatorVisibility("grid-size",isInDebug);
Page.Canvas.setIndicatorVisibility("grid-cell-size",isInDebug);
Page.Canvas.setIndicatorVisibility("grid-items-per-cell", isInDebug);

if (isInDebug) {
    Page.Checkbox.setChecked(controlId.INDICATORS, true);
} else {
    Page.Checkbox.setChecked(controlId.ONE_CELL_ONLY, false);
    Page.Checkbox.setChecked(controlId.SHOW_GRID, false);
}

const isWebGLVersion = Helpers.getQueryStringValue("webgl") !== "0";
if (!isWebGLVersion) {
    Page.Checkbox.setChecked(controlId.BLENDING, false);
    Page.Controls.setVisibility(controlId.BLENDING, false);
}

function updateIndicatorsVisibility(): void {
    const visible = Page.Checkbox.isChecked(controlId.INDICATORS);
    Page.Canvas.setIndicatorsVisibility(visible);
}
Page.Checkbox.addObserver(controlId.INDICATORS, updateIndicatorsVisibility);
updateIndicatorsVisibility();

abstract class Parameters {
    public static get spacing(): number {
        return Page.Range.getValue(controlId.SPACING);
    }

    public static get minSize(): number {
        return Page.Range.getValue(controlId.MIN_SIZE);
    }

    public static get allowOverlapping(): boolean {
        return Page.Checkbox.isChecked(controlId.ALLOW_OVERLAPPING);
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

    public static get blackBackground(): boolean {
        return Page.Checkbox.isChecked(controlId.BLACK_BACKGROUND);
    }

    public static get blending(): boolean {
        return Page.Checkbox.isChecked(controlId.BLENDING);
    }

    public static get isInDebug(): boolean {
        return isInDebug;
    }
    public static get isWebGLVersion(): boolean {
        return isWebGLVersion;
    }

    /* === DEBUG SECTION === */

    public static get maxTriesPerFrame(): number {
        return Page.Range.getValue(controlId.MAX_TRIES_PER_FRAME);
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

    public static get useInstancing(): boolean {
        return Page.Checkbox.isChecked(controlId.INSTANCING);
    }
    public static disallowInstancing(): void {
        Page.Checkbox.setChecked(controlId.INSTANCING, false);
        Page.Controls.setVisibility(controlId.INSTANCING, false);
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
