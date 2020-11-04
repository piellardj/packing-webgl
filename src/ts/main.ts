import { EPrimitive, Parameters } from "./parameters";

import { PlotterBase } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterSVG } from "./plotter/plotter-svg";

import { PatternBase } from "./patterns/pattern-base";
import { PatternCircle } from "./patterns/pattern-circle";
import { PatternSquare } from "./patterns/pattern-square";

import { IPoint } from "./interfaces/i-point";
import { ISize } from "./interfaces/i-size";

import * as Helper from "./helper";

import "./page-interface-generated";

const items: PatternBase[] = [];

function randomPointInDomain(domainSize: ISize): IPoint {
    return {
        x: Math.round(domainSize.width * (Math.random() - 0.5)),
        y: Math.round(domainSize.height * (Math.random() - 0.5)),
    };
}

type AddItemFunction = (domainSize: ISize) => unknown;
function addSquare(domainSize: ISize): void {
    const center = randomPointInDomain(domainSize);

    const maxSize = 0.5 * PatternSquare.computeBiggestSideLengthPossible(center, items as PatternSquare[]);
    if (maxSize >= 8) {
        const size = 2 * Math.floor(0.5 * maxSize); // need to be even to avoid aliasing
        const color = Helper.randomHexColor();
        items.push(new PatternSquare(center, size, color));
    }
}

function addCircle(domainSize: ISize): void {
    const center = randomPointInDomain(domainSize);

    const maxSize = 0.5 * PatternCircle.computeBiggestDiameterPossible(center, items as PatternCircle[]);
    if (maxSize >= 8) {
        const size = 2 * Math.floor(0.5 * maxSize); // need to be even to avoid aliasing
        const color = Helper.randomHexColor();
        items.push(new PatternCircle(center, size, color));
    }
}

let needToRedraw = false;
let needToAddItem = false;
Parameters.addItemObserver(() => {
    needToAddItem = true;
    needToRedraw = true;
});

Parameters.addClearObserver(() => {
    items.length = 0;
    needToRedraw = true;
});

function update(): void {
    if (needToAddItem) {
        let addItemFunction: AddItemFunction;
        if (Parameters.primitive === EPrimitive.SQUARE) {
            addItemFunction = addSquare;
        } else if (Parameters.primitive === EPrimitive.CIRCLE) {
            addItemFunction = addCircle;
        }

        for (let i = 0; i < 10000; i++) {
            addItemFunction(canvasPlotter.size);
        }
        needToAddItem = false;
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
