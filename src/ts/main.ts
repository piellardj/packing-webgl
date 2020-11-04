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

import "./page-interface-generated";

let needToRedraw = false;
let needToAddItems = false;

function performZooming(items: PatternBase[], domainSize: ISize): void {
    const zoomSpeed = 1 + 0.01 * Parameters.zoomSpeed;
    for (const item of items) {
        item.zoomIn(zoomSpeed);

        if (!item.isInDomain(domainSize)) { // recycle items that are out of view
            item.needInitialization = true;
        }
    }
}

let iRecycling = 0;
function performRecycling(items: PatternBase[], domainSize: ISize): void {
    let nbItemsRecycled = 0;
    let triesTotal = 0;

    const acceptedSizesForNewItems = new NumberRange(Parameters.minSize, 1000000);
    for (const item of items) {
        if (item.needInitialization) {
            triesTotal += item.reset(domainSize, items, Parameters.spacing, acceptedSizesForNewItems);
            nbItemsRecycled++;
        }
    }

    iRecycling++;
    if (iRecycling % 100 === 0) {
        console.log(`Recycled "${nbItemsRecycled}" with an average nbTries of "${triesTotal / nbItemsRecycled}".`);
    }
}

function generateItems(items: PatternBase[], amount: number): void {
    let instanciate: () => PatternBase;
    if (Parameters.primitive === EPrimitive.CIRCLE) {
        instanciate = () => new PatternCircle();
    } else {
        instanciate = () => new PatternSquare();
    }

    for (let i = 0; i < amount; i++) {
        const newItem = instanciate();
        items.push(newItem);
    }
}

function update(items: PatternBase[], domainSize: ISize): void {
    if (needToAddItems) {
        generateItems(items, 100);
        needToAddItems = false;
    }

    performRecycling(items, domainSize);

    if (Parameters.isZooming) {
        performZooming(items, domainSize);
        needToRedraw = true;
    }
}

function draw(items: PatternBase[], plotter: PlotterBase): void {
    plotter.initialize();

    for (const item of items) {
        item.draw(plotter);
    }

    plotter.finalize();
}

const itemsList: PatternBase[] = [];
const canvasPlotter = new PlotterCanvas2D();

function mainLoop(): void {
    const plotter = canvasPlotter;

    update(itemsList, plotter.size);

    if (needToRedraw) {
        draw(itemsList, plotter);
        needToRedraw = false;
    }

    requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);

Parameters.addRedrawObserver(() => needToRedraw = true);

Parameters.addItemObserver(() => {
    needToAddItems = true;
    needToRedraw = true;
});

Parameters.addClearObserver(() => {
    itemsList.length = 0;
    needToRedraw = true;
});

Parameters.addDownloadObserver(() => {
    const svgPlotter = new PlotterSVG(canvasPlotter.size);
    draw(itemsList, svgPlotter);

    const fileName = "packing.svg";
    const svgString = svgPlotter.export();
    Helper.downloadTextFile(fileName, svgString);
});
