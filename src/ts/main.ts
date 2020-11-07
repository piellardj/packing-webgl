import { EPrimitive, Parameters } from "./parameters";

import { PlotterBase } from "./plotter/plotter-base";
import { PlotterSVG } from "./plotter/plotter-svg";

import { PatternBase } from "./patterns/pattern-base";
import { PatternCircle } from "./patterns/pattern-circle";
import { PatternSquare } from "./patterns/pattern-square";

import * as Helper from "./utils/helper";
import { ISize } from "./utils/i-size";
import { NumberRange } from "./utils/number-range";
import { StopWatch } from "./utils/stop-watch";
import * as FrameCounter from "./utils/frame-counter"

import { Grid } from "./space-grid/grid";

import "./page-interface-generated";
import { Color } from "./utils/color";

function performZooming(deltaTimeInSeconds: number, items: PatternBase[], domainSize: ISize): void {
    const zoomSpeed = 1 + deltaTimeInSeconds * Parameters.zoomSpeed;
    for (const item of items) {
        item.zoomIn(zoomSpeed);

        if (!item.isInDomain(domainSize)) { // recycle items that are out of view
            item.needInitialization = true;
        }
    }
}

interface IRecyclingResult {
    nbItemsRecycled: number;
    reorderedItemsList: PatternBase[];
}

/** @returns number of recycled items */
function performRecycling(items: PatternBase[], domainSize: ISize, grid: Grid): IRecyclingResult {
    let nbItemsRecycled = 0;

    const sizeFactor = 1 - Parameters.spacing;
    const acceptedSizesForNewItems = new NumberRange(Parameters.minSize, 1000000);
    const maxTries = Parameters.maxTriesPerFrame;
    let triesLeft = maxTries;

    const reorderedItemsList: PatternBase[] = [];
    const previouslyUninitializedItems: PatternBase[] = [];

    for (const item of items) {
        if (!item.needInitialization) {
            reorderedItemsList.push(item);
        } else {
            previouslyUninitializedItems.push(item);

            triesLeft -= item.reset(domainSize, grid, sizeFactor, acceptedSizesForNewItems, triesLeft);
            const succeeded = !item.needInitialization;
            if (succeeded) {
                grid.registerItem(item);
                nbItemsRecycled++;
            }
        }
    }

    if (FrameCounter.isVerboseFrame() && nbItemsRecycled > 0) {
        const nbTries = maxTries - triesLeft;
        const nbTriesPerItem = (nbTries / nbItemsRecycled).toFixed(1);
        console.log(`${nbItemsRecycled} / ${previouslyUninitializedItems.length} items recycled with a total of ${nbTries} / ${maxTries} tries (${nbTriesPerItem} per item).`);
    }

    reorderedItemsList.push.apply(reorderedItemsList, previouslyUninitializedItems);

    return { nbItemsRecycled, reorderedItemsList };
}

function generateUninitializedItems(amount: number): PatternBase[] {
    let instanciate: () => PatternBase;
    if (Parameters.primitive === EPrimitive.CIRCLE) {
        instanciate = () => new PatternCircle();
    } else {
        instanciate = () => new PatternSquare();
    }

    const items: PatternBase[] = [];
    for (let i = 0; i < amount; i++) {
        const newItem = instanciate();
        items.push(newItem);
    }
    return items;
}

interface IUpdateResult {
    needRedraw: boolean;
    reorderedItemsList: PatternBase[];
}
/** @returns true if changes were made that require redrawing */
function update(deltaTimeInSeconds: number, items: PatternBase[], domainSize: ISize, grid: Grid, nbItemsToAdd: number): IUpdateResult {
    grid.reset(domainSize, Parameters.cellSize, items);

    let changedSomething = false;

    if (nbItemsToAdd > 0) {
        const newItems = generateUninitializedItems(1000);
        items.push.apply(items, newItems); // add new items to existing ones
        changedSomething = true;
    }

    const recyclingResult = performRecycling(items, domainSize, grid);
    changedSomething = changedSomething || (recyclingResult.nbItemsRecycled > 0);

    if (Parameters.isZooming) {
        performZooming(deltaTimeInSeconds, items, domainSize);
        changedSomething = true;
    }

    if (FrameCounter.isVerboseFrame()) {
        console.log(`${items.length} items in total.`);
    }

    return {
        needRedraw: changedSomething,
        reorderedItemsList: recyclingResult.reorderedItemsList,
    };
}

/** Draws the provided items in their order.
 * @returns Whether or not everything could be drawn
 */
function draw(items: PatternBase[], grid: Grid, plotter: PlotterBase): boolean {
    const backgroundColor = Parameters.blackBackground ? Color.BLACK : Color.WHITE;
    plotter.initialize(backgroundColor);

    for (const item of items) {
        item.draw(plotter);
    }

    if (Parameters.showGrid) {
        grid.draw(plotter);
    }

    plotter.finalize();

    return plotter.isReady;
}

function main(): void {
    let itemsList: PatternBase[] = [];
    const canvasPlotter = Helper.chooseCanvasPlotter();
    const grid = new Grid(canvasPlotter.size, Parameters.cellSize);

    let needToAddItems = false;
    let needToRedraw = true;

    Parameters.addRedrawObserver(() => needToRedraw = true);
    Parameters.addItemObserver(() => needToAddItems = true);
    Parameters.addClearObserver(() => {
        itemsList.length = 0;
        needToRedraw = true;
    });

    Parameters.addDownloadObserver(() => {
        const svgPlotter = new PlotterSVG(canvasPlotter.size);
        draw(itemsList, grid, svgPlotter);

        const fileName = "packing.svg";
        const svgString = svgPlotter.export();
        Helper.downloadTextFile(fileName, svgString);
    });

    const stopWatch = new StopWatch(0);
    function mainLoop(time: number): void {
        const timeInSeconds = time * 0.001;
        const deltaTimeInSeconds = stopWatch.elapsedTime(timeInSeconds);
        stopWatch.reset(timeInSeconds);
        FrameCounter.incrementFrame();

        const nbItemsToAdd = needToAddItems ? 1000 : 0;
        needToAddItems = false;
        const updateResult = update(deltaTimeInSeconds, itemsList, canvasPlotter.size, grid, nbItemsToAdd);
        itemsList = updateResult.reorderedItemsList;
        needToRedraw = needToRedraw || updateResult.needRedraw;

        if (needToRedraw) {
            let successfulDraw = false;

            if (Parameters.oneCellOnly) {
                const localItems = grid.getItemsFromCell(Parameters.cellX, Parameters.cellY);
                successfulDraw = draw(localItems, grid, canvasPlotter);
            } else {
                successfulDraw = draw(itemsList, grid, canvasPlotter);
            }

            needToRedraw = !successfulDraw;
        }

        requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);
}

main();
