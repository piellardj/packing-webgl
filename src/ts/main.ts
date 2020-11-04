import { EPrimitive, Parameters } from "./parameters";

import { PlotterBase } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterSVG } from "./plotter/plotter-svg";

import { PatternBase } from "./patterns/pattern-base";
import { PatternCircle } from "./patterns/pattern-circle";
import { PatternSquare } from "./patterns/pattern-square";

import * as Helper from "./helper";

import "./page-interface-generated";

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
        for (let i = 0; i < 1000; i++) {
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

    for (const item of items) {
        if (item.needInitialization) {
            item.reset(canvasPlotter.size, items);
        }
    }

    const zoomSpeed = Parameters.zoomSpeed;
    if (zoomSpeed > 0) {
        const actualZoomSpeed = 1 + 0.01 * zoomSpeed;
        for (const item of items) {
            item.zoomIn(actualZoomSpeed);
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
