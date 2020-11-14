import { mainDebugCollisions } from "./debug-collisions";

import { Engine } from "./engine";

import { Parameters } from "./parameters";

import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterCanvasWebGL } from "./plotter/plotter-canvas-webgl";
import { PlotterSVG } from "./plotter/plotter-svg";

import * as Statistics from "./statistics/statistics";

import * as Helper from "./utils/helper";

import "./page-interface-generated";

function main(): void {
    const canvasPlotter = Parameters.isWebGLVersion ? new PlotterCanvasWebGL() : new PlotterCanvas2D();

    const engine = new Engine();

    let needToRedraw = true;

    Parameters.addRedrawObserver(() => needToRedraw = true);
    Parameters.addClearObserver(() => {
        engine.reset();
        needToRedraw = true;
    });

    Parameters.addDownloadObserver(() => {
        const svgPlotter = new PlotterSVG(canvasPlotter.size);
        engine.draw(svgPlotter);

        const fileName = "packing.svg";
        const svgString = svgPlotter.export();
        Helper.downloadTextFile(fileName, svgString);
    });

    let lastRunTime = 0;
    Statistics.initialize();
    engine.reset();
    function mainLoop(time: number): void {
        Statistics.timeSpentInMainLoop.start();

        const deltaTimeInSeconds = 0.001 * (time - lastRunTime);
        lastRunTime = time;

        const wantedItemsCount = 1000 * Parameters.quantity;
        engine.setItemsCount(wantedItemsCount);

        Statistics.timeSpentInUpdate.start();
        const updateChangedSomething = engine.udpate(deltaTimeInSeconds, canvasPlotter.size);
        needToRedraw = needToRedraw || updateChangedSomething;
        Statistics.timeSpentInUpdate.stop();

        if (needToRedraw) {
            Statistics.timeSpentInDraw.start();
            const successfulDraw = engine.draw(canvasPlotter);
            Statistics.timeSpentInDraw.stop();

            needToRedraw = !successfulDraw;
        }

        Statistics.timeSpentInMainLoop.stop();
        Statistics.registerFrame();
        requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);
}

if (Parameters.isInCollisionsDebug) {
    mainDebugCollisions();
} else {
    main();
}
