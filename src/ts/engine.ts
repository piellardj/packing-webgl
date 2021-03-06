import { Color } from "./color/color";
import { ColorPicker } from "./color/color-picker";

import { EPrimitive, Parameters } from "./parameters";

import { IPattern } from "./patterns/i-pattern";
import { EVisibility, PatternBase } from "./patterns/pattern-base";
import { PatternCircle } from "./patterns/pattern-circle";
import { PatternHeart } from "./patterns/pattern-heart";
import { PatternRectangle } from "./patterns/pattern-rectangle";
import { PatternSquare } from "./patterns/pattern-square";
import { PatternTriangle } from "./patterns/pattern-triangle";

import { PlotterBase } from "./plotter/plotter-base";

import { Grid } from "./space-grid/grid";

import * as Statistics from "./statistics/statistics";

import { IPoint } from "./utils/i-point";
import { ISize } from "./utils/i-size";
import { NumberRange } from "./utils/number-range";

import "./page-interface-generated";

class Engine {
    private initializedItemsList: PatternBase[]; // stored in the order they must be drawn.
    private uninitializedItemsList: PatternBase[]; // stored in no particular order
    private lastRecyclingTime: number;

    private currentPrimitive: EPrimitive;
    private createItem: () => PatternBase;

    private readonly grid: Grid; // used to index the items' positions for faster recycling

    private readonly zoomCenter: IPoint;

    private static readonly DEFAULT_BACKGROUND_ITEM: IPattern = { nestingLevel: 0, color: Color.BLACK };
    private currentBackgroundItem: IPattern | null;

    public constructor() {
        this.initializedItemsList = [];
        this.uninitializedItemsList = [];
        this.lastRecyclingTime = 0;

        this.grid = new Grid();
        this.zoomCenter = { x: 0, y: 0 }; // canvas center
        this.currentBackgroundItem = null;
    }

    public reset(): void {
        const primitive = Parameters.primitive;

        if (primitive === EPrimitive.SQUARE) {
            this.createItem = () => new PatternSquare();
        } else if (primitive === EPrimitive.CIRCLE) {
            this.createItem = () => new PatternCircle();
        } else if (primitive === EPrimitive.RECTANGLE) {
            this.createItem = () => new PatternRectangle();
        } else if (primitive === EPrimitive.TRIANGLE) {
            this.createItem = () => new PatternTriangle();
        } else if (primitive === EPrimitive.HEART) {
            this.createItem = () => new PatternHeart();
        } else {
            throw new Error(`Invalid primitive "${primitive}.`);
        }

        this.initializedItemsList = [];
        this.uninitializedItemsList = [];
        this.currentPrimitive = primitive;
        this.currentBackgroundItem = null;
        this.zoomCenter.x = 0;
        this.zoomCenter.y = 0;
    }

    public setItemsCount(wantedCount: number): void {
        const initializedCount = this.initializedItemsList.length;
        const uninitializedCount = this.uninitializedItemsList.length;

        const totalItemsCount = initializedCount + uninitializedCount;
        if (wantedCount > totalItemsCount) { // items to add
            const itemsToAdd = wantedCount - totalItemsCount;
            for (let i = 0; i < itemsToAdd; i++) {
                const newItem = this.createItem();
                this.uninitializedItemsList.push(newItem);
            }
        } else if (wantedCount < totalItemsCount) { // items to remove
            if (wantedCount > initializedCount) {
                this.uninitializedItemsList.length = wantedCount - initializedCount;
            } else {
                this.uninitializedItemsList = [];
                this.initializedItemsList.length = wantedCount;
            }
        }
    }

    public draw(plotter: PlotterBase): boolean {
        Engine.DEFAULT_BACKGROUND_ITEM.color = (Parameters.blackBackground) ? Color.BLACK : Color.WHITE;
        ColorPicker.darkMode = Parameters.blackBackground;
        ColorPicker.highContrastMode = Parameters.highContrast;

        let everythingDrawn = plotter.isReady;
        if (!Parameters.isZooming) {
            const timeSinceLastRecycling = performance.now() - this.lastRecyclingTime;
            const blendingOver = timeSinceLastRecycling > PatternBase.maxBlendingTime;
            if (!blendingOver) {
                everythingDrawn = false;
            }
        }

        const backgroundColor = this.computeBackgroundColor();
        plotter.initialize(backgroundColor);

        let itemsToDraw: PatternBase[];
        if (Parameters.oneCellOnly) {
            itemsToDraw = this.grid.getItemsFromCell(Parameters.cellX, Parameters.cellY);
        } else {
            itemsToDraw = this.initializedItemsList;
        }

        if (this.currentPrimitive === EPrimitive.SQUARE) {
            plotter.drawSquares(itemsToDraw as PatternSquare[]);
        } else if (this.currentPrimitive === EPrimitive.CIRCLE) {
            plotter.drawCircles(itemsToDraw as PatternCircle[]);
        } else if (this.currentPrimitive === EPrimitive.RECTANGLE) {
            plotter.drawRectangles(itemsToDraw as PatternRectangle[]);
        } else if (this.currentPrimitive === EPrimitive.TRIANGLE) {
            plotter.drawTriangles(itemsToDraw as PatternTriangle[]);
        } else if (this.currentPrimitive === EPrimitive.HEART) {
            plotter.drawHearts(itemsToDraw as PatternHeart[]);
        } else {
            throw new Error(`Unsupported primitive ${this.currentPrimitive} for drawing.`);
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

        Statistics.timeSpentInReindex.start();
        const gridChanged = this.reindexItems(domainSize);
        requiresRedraw = requiresRedraw || gridChanged;
        Statistics.timeSpentInReindex.stop();

        Statistics.timeSpentInRecycle.start();
        const itemsRecycled = this.performRecycling(domainSize);
        requiresRedraw = requiresRedraw || itemsRecycled;
        if (itemsRecycled) {
            this.lastRecyclingTime = performance.now();
        }
        Statistics.timeSpentInRecycle.stop();

        Statistics.timeSpentInZoom.start();
        if (Parameters.isZooming) {
            const itemsMoved = (this.initializedItemsList.length > 0);
            this.performZoom(deltaTimeInSeconds, domainSize);
            requiresRedraw = requiresRedraw || itemsMoved;
        }
        Statistics.timeSpentInZoom.stop();

        return requiresRedraw;
    }

    /**
     * @param domainSize in pixels
     * @param cellSize in pixels
     * @returns true if a redraw is required
     */
    private reindexItems(domainSize: ISize): boolean {
        let gridCellSize = Parameters.cellSize;
        if (Parameters.adaptativeGrid) {
            const targetItemsPerCell = Parameters.targetItemsPerGridCell;
            const lastItemsPerCell = this.grid.itemsPerCell;
            gridCellSize = this.grid.cellSize;
            if (lastItemsPerCell < targetItemsPerCell) {
                gridCellSize++;
            } else {
                gridCellSize--;
            }
        }

        return this.grid.reset(domainSize, gridCellSize, this.initializedItemsList);
    }

    private performRecycling(domainSize: ISize): boolean {
        let nbItemsRecycled = 0;

        const allowOverlapping = Parameters.allowOverlapping;
        const sizeFactor = 1 - Parameters.spacing;
        const acceptedSizesForNewItems = new NumberRange(Parameters.minSize, 1000000);
        const maxTries = Parameters.maxTriesPerFrame;
        const backgroundItem = this.backgroundItem;

        let triesLeft = maxTries;
        while (this.uninitializedItemsList.length > 0 && triesLeft > 0) {
            const currentItem = this.uninitializedItemsList.pop();

            const resetResult = currentItem.reset(domainSize, this.grid, sizeFactor, acceptedSizesForNewItems, allowOverlapping, backgroundItem, triesLeft);
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
        this.grid.computeStatistics();

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
        this.updateZoomCenter(domainSize);

        const newInitializedArray: PatternBase[] = [];

        const zoomSpeed = 1 + deltaTimeInSeconds * Parameters.zoomSpeed;
        for (const item of this.initializedItemsList) {
            item.zoomIn(this.zoomCenter, zoomSpeed);

            let visibility: EVisibility;
            if (item.size > PatternBase.MAX_SIZE) {
                visibility = EVisibility.OUT_OF_VIEW;
            } else {
                visibility = item.computeVisibility(domainSize);
            }

            if (visibility === EVisibility.VISIBLE) {
                newInitializedArray.push(item);
            } else {
                this.uninitializedItemsList.push(item); // recycle item

                if (visibility === EVisibility.COVERS_VIEW) {
                    this.currentBackgroundItem = {
                        nestingLevel: item.nestingLevel % 100000, // make ensting levels loop
                        color: item.rawColor,
                    };
                }
            }
        }

        this.initializedItemsList = newInitializedArray;
    }

    private computeBackgroundColor(): Color {
        const backgroundItem = this.backgroundItem;
        return ColorPicker.getDisplayColor(backgroundItem.color, backgroundItem.nestingLevel);
    }

    private updateZoomCenter(domainSize: ISize): void {
        if (Page.Canvas.isMouseDown()) {
            const mousePosition = Page.Canvas.getMousePosition(); // in [0,1]^2
            this.zoomCenter.x = domainSize.width * (mousePosition[0] - 0.5);
            this.zoomCenter.y = domainSize.height * (mousePosition[1] - 0.5);
        }

        const halfWidth = 0.5 * domainSize.width;
        const halfHeight = 0.5 * domainSize.height;

        if (this.zoomCenter.x < -halfWidth) {
            this.zoomCenter.x = -halfWidth
        } else if (this.zoomCenter.x > halfWidth) {
            this.zoomCenter.x = halfWidth;
        }

        if (this.zoomCenter.y < -halfHeight) {
            this.zoomCenter.y = -halfHeight
        } else if (this.zoomCenter.y > halfHeight) {
            this.zoomCenter.y = halfHeight;
        }
    }

    private get backgroundItem(): IPattern {
        return (this.currentBackgroundItem !== null) ? this.currentBackgroundItem : Engine.DEFAULT_BACKGROUND_ITEM;
    }
}

export { Engine };
