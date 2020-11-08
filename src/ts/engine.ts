import { EPrimitive, Parameters } from "./parameters";

import { PatternBase } from "./patterns/pattern-base";
import { PatternCircle } from "./patterns/pattern-circle";
import { PatternRectangle } from "./patterns/pattern-rectangle";
import { PatternSquare } from "./patterns/pattern-square";

import { PlotterBase } from "./plotter/plotter-base";

import { Grid } from "./space-grid/grid";

import { Color } from "./utils/color";
import { ISize } from "./utils/i-size";
import { NumberRange } from "./utils/number-range";

import * as Statistics from "./statistics/statistics";

class Engine {
    public defaultBackgroundColor: Color; // background color of the "empty" space

    private initializedItemsList: PatternBase[]; // stored in the order they must be drawn.
    private uninitializedItemsList: PatternBase[]; // stored in no particular order

    private currentPrimitive: EPrimitive;
    private createItem: () => PatternBase;

    private grid: Grid; // used to index the items' positions for faster recycling

    public constructor() {
        this.defaultBackgroundColor = Color.BLACK;

        this.initializedItemsList = [];
        this.uninitializedItemsList = [];
    }

    public reset(): void {
        const primitive = Parameters.primitive;

        if (primitive === EPrimitive.SQUARE) {
            this.createItem = () => new PatternSquare();
        } else if (primitive === EPrimitive.CIRCLE) {
            this.createItem = () => new PatternCircle();
        } else if (primitive === EPrimitive.RECTANGLE) {
            this.createItem = () => new PatternRectangle();
        } else {
            throw new Error(`Invalid primitive "${primitive}.`);
        }

        this.initializedItemsList = [];
        this.uninitializedItemsList = [];
        this.currentPrimitive = primitive;
    }

    public addItems(count: number): void {
        for (let i = 0; i < count; i++) {
            const newItem = this.createItem();
            this.uninitializedItemsList.push(newItem);
        }
    }

    public draw(plotter: PlotterBase): boolean {
        const everythingDrawn = plotter.isReady;

        plotter.initialize(this.defaultBackgroundColor);

        if (this.currentPrimitive === EPrimitive.SQUARE) {
            plotter.drawSquares(this.initializedItemsList as PatternSquare[]);
        } else if (this.currentPrimitive === EPrimitive.CIRCLE) {
            plotter.drawCircles(this.initializedItemsList as PatternCircle[]);
        } else if (this.currentPrimitive === EPrimitive.RECTANGLE) {
            plotter.drawRectangles(this.initializedItemsList as PatternRectangle[]);
        }

        if (Parameters.showGrid) {
            this.grid.draw(plotter);
        }

        plotter.finalize();

        return everythingDrawn;
    }

    /** @returns true if the update changed something that requires a redraw */
    public udpate(deltaTimeInSeconds: number, domainSize: ISize): boolean {
        const mayRecycle = this.uninitializedItemsList.length > 0;
        const willZoom = this.initializedItemsList.length > 0 && Parameters.isZooming;
        const needToInitializeGrid = typeof this.grid === "undefined";
        const needUpdate = mayRecycle || willZoom || needToInitializeGrid;
        if (!needUpdate) {
            return false;
        }

        let requiresRedraw = false;

        const gridChanged = this.reindexItems(domainSize);
        requiresRedraw = requiresRedraw || gridChanged;

        const itemsRecycled = this.performRecycling(domainSize);
        requiresRedraw = requiresRedraw || itemsRecycled;

        if (Parameters.isZooming) {
            const itemsMoved = (this.initializedItemsList.length > 0);
            this.performZoom(deltaTimeInSeconds, domainSize);
            requiresRedraw = requiresRedraw || itemsMoved;
        }

        return requiresRedraw;
    }

    /**
     * @param domainSize in pixels
     * @param cellSize in pixels
     * @returns true if a redraw is required
     */
    private reindexItems(domainSize: ISize): boolean {
        if (typeof this.grid === "undefined") {
            this.grid = new Grid({ width: 1, height: 1 }, 1);
        }

        const gridCellSize = Parameters.cellSize;
        return this.grid.reset(domainSize, gridCellSize, this.initializedItemsList);
    }

    private performRecycling(domainSize: ISize): boolean {
        let nbItemsRecycled = 0;

        const allowOverlapping = Parameters.allowOverlapping;
        const sizeFactor = 1 - Parameters.spacing;
        const acceptedSizesForNewItems = new NumberRange(Parameters.minSize, 1000000);
        const maxTries = Parameters.maxTriesPerFrame;

        let triesLeft = maxTries;
        while (this.uninitializedItemsList.length > 0 && triesLeft > 0) {
            const currentItem = this.uninitializedItemsList.pop();

            const resetResult = currentItem.reset(domainSize, this.grid, sizeFactor, acceptedSizesForNewItems, allowOverlapping, triesLeft);
            triesLeft -= resetResult.nbTries;
            if (resetResult.success) {
                this.initializedItemsList.push(currentItem);
                this.grid.registerItem(currentItem);
                nbItemsRecycled++;
            } else {
                this.uninitializedItemsList.push(currentItem);
            }
        }

        const totalItemsCount = this.initializedItemsList.length + this.uninitializedItemsList.length;
        const nbPendingRecycling = this.uninitializedItemsList.length;
        const nbTriesUsed = maxTries - triesLeft;
        Statistics.registerRecyclingStats(totalItemsCount, nbItemsRecycled, nbPendingRecycling, nbTriesUsed);
        return nbItemsRecycled > 0;
    }

    /**
     * Performs zoom on initialized items.
     * During zooming, items might go out of view. In that case:
     *   - these items are added to the uninitializedItemsList
     *   - these items are removed from the initializedItemsList
     * Does not modify the order of the initializedItemsList.
     * @returns true if something changed and requires a redraw
     */
    private performZoom(deltaTimeInSeconds: number, domainSize: ISize): void {
        const newInitializedArray: PatternBase[] = [];

        const zoomSpeed = 1 + deltaTimeInSeconds * Parameters.zoomSpeed;
        for (const item of this.initializedItemsList) {
            item.zoomIn(zoomSpeed);

            if (!item.isInDomain(domainSize)) { // recycle items that are out of view
                this.uninitializedItemsList.push(item);
            } else {
                newInitializedArray.push(item);
            }
        }

        this.initializedItemsList = newInitializedArray;
    }
}

export { Engine }
