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

function update(items: PatternBase[], domainSize: ISize): void {
    if (needToAddItems) {
        for (let i = 0; i < 100; i++) {
            let newItem: PatternBase;
            if (Parameters.primitive === EPrimitive.CIRCLE) {
                newItem = new PatternCircle();
            } else {
                newItem = new PatternSquare();
            }
            items.push(newItem);
        }
        needToAddItems = false;
    }

    const acceptedSizesForNewItems = new NumberRange(Parameters.minSize, 1000000);
    for (const item of items) {
        if (item.needInitialization) {
            item.reset(domainSize, items, Parameters.spacing, acceptedSizesForNewItems);
        }
    }

    if (Parameters.isZooming) {
        const zoomSpeed = 1 + 0.01 * Parameters.zoomSpeed;
        for (const item of items) {
            item.zoomIn(zoomSpeed);

            if (!item.isInDomain(domainSize)) { // recycle items that are out of view
                item.needInitialization = true;
            }
        }
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
