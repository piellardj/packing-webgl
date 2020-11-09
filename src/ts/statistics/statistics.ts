import { StopWatch } from "./stop-watch";

import "../page-interface-generated";
import { Parameters } from "../parameters";

const VERBOSE_INTERVAL = 1000;

const timeSinceLastVerboseFrame = new StopWatch();

let frames = 0;
const timeSpentInMainLoop = new StopWatch();
const timeSpentInDraw = new StopWatch();
const timeSpentInUpdate = new StopWatch();

let itemsCount = 0;
let itemsRecycledCount = 0;
let itemsPendingRecyclingCount = 0;
let itemsRecyclingTries = 0;

function initialize(): void {
    timeSinceLastVerboseFrame.reset();
    timeSinceLastVerboseFrame.start();
    frames = 0;
}

function registerFrame(): void {
    frames++;

    if (isVerboseFrame()) {
        updateIndicators();
        resetAll();
    }
}

function isVerboseFrame(): boolean {
    return timeSinceLastVerboseFrame.totalTime > VERBOSE_INTERVAL;
}

function updateIndicators(): void {
    const fps = 1000 * frames / timeSinceLastVerboseFrame.totalTime;
    const averageFrameTime = timeSinceLastVerboseFrame.totalTime / frames;

    const averageMainLoopTime = timeSpentInMainLoop.totalTime / frames;
    const mainLoopTimeRelative = averageMainLoopTime / averageFrameTime;

    const averageDrawTime = timeSpentInDraw.totalTime / frames;
    const drawTimeRelative = averageDrawTime / averageMainLoopTime;

    const averageUpdateTime = timeSpentInUpdate.totalTime / frames;
    const updateTimeRelative = averageUpdateTime / averageMainLoopTime;

    if (Parameters.isInDebug) {
        Page.Canvas.setIndicatorText("fps", `${fps.toFixed(0)} (${averageFrameTime.toFixed(2)} ms)`);
        Page.Canvas.setIndicatorText("main-loop-time", `${averageMainLoopTime.toFixed(2)} ms (${(100 * mainLoopTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("draw-time", `${averageDrawTime.toFixed(2)} ms (${(100 * drawTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("update-time", `${averageUpdateTime.toFixed(2)} ms (${(100 * updateTimeRelative).toFixed(1)} %)`);

        Page.Canvas.setIndicatorText("items-reclycled-count", `${(itemsRecycledCount / frames * fps).toFixed(1)}`);
        Page.Canvas.setIndicatorText("items-pending-recycling-count", `${(itemsPendingRecyclingCount / frames).toFixed(1)}`);
        Page.Canvas.setIndicatorText("items-recycling-tries-count", `${(itemsRecyclingTries / frames).toFixed(1)}`);
    } else {
        Page.Canvas.setIndicatorText("fps", fps.toFixed(0));
    }

    Page.Canvas.setIndicatorText("items-count", `${itemsCount}`);
    Page.Canvas.setIndicatorText("items-visible-count", `${(itemsCount - itemsPendingRecyclingCount / frames).toFixed(0)}`);

}

function resetAll(): void {
    timeSinceLastVerboseFrame.reset();

    frames = 0;
    timeSpentInMainLoop.reset();
    timeSpentInDraw.reset();
    timeSpentInUpdate.reset();

    itemsRecycledCount = 0;
    itemsPendingRecyclingCount = 0;
    itemsRecyclingTries = 0;
}

function registerRecyclingStats(total: number, recycled: number, pendingRecycling: number, nbTriesCount: number): void {
    itemsCount = total;
    itemsRecycledCount += recycled;
    itemsPendingRecyclingCount += pendingRecycling;
    itemsRecyclingTries += nbTriesCount;
}

export {
    initialize,
    registerFrame,
    registerRecyclingStats,
    timeSpentInMainLoop,
    timeSpentInDraw,
    timeSpentInUpdate,
}
