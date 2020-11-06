import { EPrimitive, Parameters } from "./parameters";

import { PlotterBase } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
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

function performZooming(deltaTimeInSeconds: number, items: PatternBase[], domainSize: ISize): void {
    const zoomSpeed = 1 + deltaTimeInSeconds * Parameters.zoomSpeed;
    for (const item of items) {
        item.zoomIn(zoomSpeed);

        if (!item.isInDomain(domainSize)) { // recycle items that are out of view
            item.needInitialization = true;
        }
    }
}

/** @returns number of recycled items */
function performRecycling(items: PatternBase[], domainSize: ISize, grid: Grid): number {
    let nbItemsRecycled = 0;
    let triesTotal = 0;

    const sizeFactor = 1 - Parameters.spacing;
    const acceptedSizesForNewItems = new NumberRange(Parameters.minSize, 1000000);

    for (const item of items) {
        if (item.needInitialization) {
            triesTotal += item.reset(domainSize, grid, sizeFactor, acceptedSizesForNewItems);
            grid.registerItem(item);
            nbItemsRecycled++;
        }
    }

    if (FrameCounter.isVerboseFrame() && nbItemsRecycled > 0) {
        console.log(`Recycled "${nbItemsRecycled}" with an average nbTries of "${triesTotal / nbItemsRecycled}".`);
    }
    return nbItemsRecycled;
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

/** @returns true if changes were made that require redrawing */
function update(deltaTimeInSeconds: number, items: PatternBase[], domainSize: ISize, grid: Grid): boolean {
    grid.reset(domainSize, Parameters.cellSize, items);

    const nbRecycledItems = performRecycling(items, domainSize, grid);
    let changedSometing = (nbRecycledItems > 0);

    if (Parameters.isZooming) {
        performZooming(deltaTimeInSeconds, items, domainSize);
        changedSometing = true;
    }

    return changedSometing;
}

function draw(items: PatternBase[], plotter: PlotterBase): void {
    plotter.initialize();

    for (const item of items) {
        item.draw(plotter);
    }

    plotter.finalize();
}

function main(): void {
    const itemsList: PatternBase[] = [];
    const canvasPlotter = new PlotterCanvas2D();
    const grid = new Grid(canvasPlotter.size, Parameters.cellSize);

    let needToAddItems = false;
    let needToRedraw = true;

    Parameters.addRedrawObserver(() => needToRedraw = true);
    Parameters.addItemObserver(() => needToAddItems = true);
    Parameters.addClearObserver(() => itemsList.length = 0);

    Parameters.addDownloadObserver(() => {
        const svgPlotter = new PlotterSVG(canvasPlotter.size);
        draw(itemsList, svgPlotter);

        const fileName = "packing.svg";
        const svgString = svgPlotter.export();
        Helper.downloadTextFile(fileName, svgString);
    });

    let nbItems = 0;
    const stopWatch = new StopWatch(0);
    function mainLoop(time: number): void {
        const timeInSeconds = time * 0.001;
        const deltaTimeInSeconds = stopWatch.elapsedTime(timeInSeconds);
        stopWatch.reset(timeInSeconds);
        FrameCounter.incrementFrame();

        if (needToAddItems) {
            const newItems = generateUninitializedItems(1000);
            itemsList.push.apply(itemsList, newItems); // add new items to existing ones
            needToAddItems = false;
        }

        if (nbItems !== itemsList.length) {
            needToRedraw = true;
            nbItems = itemsList.length
        }

        if (update(deltaTimeInSeconds, itemsList, canvasPlotter.size, grid)) {
            needToRedraw = true;
        }

        if (FrameCounter.isVerboseFrame()) {
            console.log(`${grid.totalItems}\t/\t${itemsList.length} initialized items.`);
        }

        if (needToRedraw) {
            if (Parameters.oneCellOnly) {
                const localItems = grid.getItemsFromCell(Parameters.cellX, Parameters.cellY);
                draw(localItems, canvasPlotter);
            } else {
                draw(itemsList, canvasPlotter);
            }

            if (Parameters.showGrid) {
                grid.draw(canvasPlotter);
            }
            needToRedraw = false;
        }

        requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);
}

main();
