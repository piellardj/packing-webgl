import { EPrimitive, Parameters } from "./parameters";

import { PlotterBase } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterSVG } from "./plotter/plotter-svg";

import { PatternBase } from "./patterns/pattern-base";
import { PatternCircle } from "./patterns/pattern-circle";
import { PatternSquare } from "./patterns/pattern-square";

import * as Helper from "./utils/helper";

import "./page-interface-generated";
import { NumberRange } from "./utils/number-range";

const items: PatternBase[] = [];

let needToRedraw = false;
let needToAddItems = false;
Parameters.addItemObserver(() => {
    needToAddItems = true;
    needToRedraw = true;
});

Parameters.addClearObserver(() => {
    items.length = 0;
    needToRedraw = true;
});

function update(): void {
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
            item.reset(canvasPlotter.size, items, Parameters.spacing, acceptedSizesForNewItems);
        }
    }

    if (Parameters.isZooming) {
        const zoomSpeed = 1 + 0.01 * Parameters.zoomSpeed;
        for (const item of items) {
            item.zoomIn(zoomSpeed);

            if (!item.isInDomain(canvasPlotter.size)) { // recycle items that are out of view
                item.needInitialization = true;
            }
        }
        needToRedraw = true;
    }
}

function draw(plotter: PlotterBase): void {
    plotter.initialize();

    for (const item of items) {
        item.draw(plotter);
    }

    plotter.finalize();
}

const canvasPlotter = new PlotterCanvas2D();
Parameters.addRedrawObserver(() => needToRedraw = true);

function mainLoop(): void {
    update();

    if (needToRedraw) {
        draw(canvasPlotter);
        needToRedraw = false;
    }

    requestAnimationFrame(mainLoop);
}
requestAnimationFrame(mainLoop);

Parameters.addDownloadObserver(() => {
    const svgPlotter = new PlotterSVG(canvasPlotter.size);
    draw(svgPlotter);

    const fileName = "packing.svg";
    const svgString = svgPlotter.export();
    Helper.downloadTextFile(fileName, svgString);
});
