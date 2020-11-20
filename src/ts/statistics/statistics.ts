import { Parameters } from "../parameters";

import { ISize } from "../utils/i-size";

import { StopWatch } from "./stop-watch";

import "../page-interface-generated";

const VERBOSE_INTERVAL = 1000;

const timeSinceLastVerboseFrame = new StopWatch();

let frames = 0;
const timeSpentInMainLoop = new StopWatch();
const timeSpentInDraw = new StopWatch();
const timeSpentInDrawAllocateBuffer = new StopWatch();
const timeSpentInDrawFillBuffer = new StopWatch();
const timeSpentInUpdate = new StopWatch();
const timeSpentInReindex = new StopWatch();
const timeSpentInReindexResetDomain = new StopWatch();
const timeSpentInReindexReindexItems = new StopWatch();
const timeSpentInRecycle = new StopWatch();
const timeSpentInZoom = new StopWatch();

let itemsCount = 0;
let itemsRecycledCount = 0;
let itemsPendingRecyclingCount = 0;
let itemsRecyclingTries = 0;

let nbGridStats = 0;
let gridWidth = 0;
let gridHeight = 0;
let gridCellSize = 0;
let gridRegisteredItems = 0;

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

    const averageDrawAllocateBufferTime = timeSpentInDrawAllocateBuffer.totalTime / frames;
    const drawAllocateBufferTimeRelative = averageDrawAllocateBufferTime / averageDrawTime;

    const averageDrawFillBufferTime = timeSpentInDrawFillBuffer.totalTime / frames;
    const drawFillBufferTimeRelative = averageDrawFillBufferTime / averageDrawTime;

    const averageUpdateTime = timeSpentInUpdate.totalTime / frames;
    const updateTimeRelative = averageUpdateTime / averageMainLoopTime;

    const averageUpdateReindexTime = timeSpentInReindex.totalTime / frames;
    const updateReindexTimeRelative = averageUpdateReindexTime / averageUpdateTime;

    const averageUpdateReindexResetDomainTime = timeSpentInReindexResetDomain.totalTime / frames;
    const updateReindexResetDomainTimeRelative = averageUpdateReindexResetDomainTime / averageUpdateReindexTime;

    const averageUpdateReindexReindexItemsTime = timeSpentInReindexReindexItems.totalTime / frames;
    const updateReindexReindexItemsTimeRelative = averageUpdateReindexReindexItemsTime / averageUpdateReindexTime;

    const averageUpdateRecycleTime = timeSpentInRecycle.totalTime / frames;
    const updateRecycleTimeRelative = averageUpdateRecycleTime / averageUpdateTime;

    const averageUpdateZoomTime = timeSpentInZoom.totalTime / frames;
    const updateZoomTimeRelative = averageUpdateZoomTime / averageUpdateTime;

    if (Parameters.isInDebug) {
        Page.Canvas.setIndicatorText("fps", `${fps.toFixed(0)} (${averageFrameTime.toFixed(2)} ms)`);
        Page.Canvas.setIndicatorText("main-loop-time", `${averageMainLoopTime.toFixed(2)} ms (${(100 * mainLoopTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("draw-time", `${averageDrawTime.toFixed(2)} ms (${(100 * drawTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("draw-allocatebuffer-time", `${averageDrawAllocateBufferTime.toFixed(2)} ms (${(100 * drawAllocateBufferTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("draw-fillbuffer-time", `${averageDrawFillBufferTime.toFixed(2)} ms (${(100 * drawFillBufferTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("update-time", `${averageUpdateTime.toFixed(2)} ms (${(100 * updateTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("update-reindex-time", `${averageUpdateReindexTime.toFixed(2)} ms (${(100 * updateReindexTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("update-reindex-resetdomain-time", `${averageUpdateReindexResetDomainTime.toFixed(2)} ms (${(100 * updateReindexResetDomainTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("update-reindex-reindexitems-time", `${averageUpdateReindexReindexItemsTime.toFixed(2)} ms (${(100 * updateReindexReindexItemsTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("update-recycle-time", `${averageUpdateRecycleTime.toFixed(2)} ms (${(100 * updateRecycleTimeRelative).toFixed(1)} %)`);
        Page.Canvas.setIndicatorText("update-zoom-time", `${averageUpdateZoomTime.toFixed(2)} ms (${(100 * updateZoomTimeRelative).toFixed(1)} %)`);

        Page.Canvas.setIndicatorText("items-reclycled-count", `${(itemsRecycledCount / frames * fps).toFixed(1)}`);
        Page.Canvas.setIndicatorText("items-pending-recycling-count", `${(itemsPendingRecyclingCount / frames).toFixed(1)}`);
        Page.Canvas.setIndicatorText("items-recycling-tries-count", `${(itemsRecyclingTries / frames).toFixed(1)}`);

        if (nbGridStats > 0) {
            const averageGridWidth = Math.round(gridWidth / nbGridStats);
            const averageGridHeight = Math.round(gridHeight / nbGridStats);
            const averageGridCellCount = averageGridWidth * averageGridHeight;
            Page.Canvas.setIndicatorText("grid-size", `${averageGridWidth}x${averageGridHeight} (${averageGridCellCount})`);
            Page.Canvas.setIndicatorText("grid-cell-size", `${(gridCellSize / nbGridStats).toFixed(1)}`);
            Page.Canvas.setIndicatorText("grid-items-per-cell", `${(gridRegisteredItems / nbGridStats / averageGridCellCount).toFixed(1)}`);
        }
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
    timeSpentInDrawAllocateBuffer.reset();
    timeSpentInDrawFillBuffer.reset();
    timeSpentInUpdate.reset();
    timeSpentInReindex.reset();
    timeSpentInReindexResetDomain.reset();
    timeSpentInReindexReindexItems.reset();
    timeSpentInRecycle.reset();
    timeSpentInZoom.reset();

    itemsRecycledCount = 0;
    itemsPendingRecyclingCount = 0;
    itemsRecyclingTries = 0;

    nbGridStats = 0;
}

function registerRecyclingStats(total: number, recycled: number, pendingRecycling: number, nbTriesCount: number): void {
    itemsCount = total;
    itemsRecycledCount += recycled;
    itemsPendingRecyclingCount += pendingRecycling;
    itemsRecyclingTries += nbTriesCount;
}

function registerGridStats(gridSize: ISize, cellSize: number, registeredItems: number): void {
    if (nbGridStats === 0) {
        gridWidth = 0;
        gridHeight = 0;
        gridCellSize = 0;
        gridRegisteredItems = 0;
    }

    nbGridStats++;
    gridWidth += gridSize.width;
    gridHeight += gridSize.height;
    gridCellSize += cellSize;
    gridRegisteredItems += registeredItems;
}

export {
    initialize,
    registerGridStats,
    registerFrame,
    registerRecyclingStats,
    timeSpentInMainLoop,
    timeSpentInDraw,
    timeSpentInDrawAllocateBuffer,
    timeSpentInDrawFillBuffer,
    timeSpentInUpdate,
    timeSpentInReindex,
    timeSpentInReindexResetDomain,
    timeSpentInReindexReindexItems,
    timeSpentInRecycle,
    timeSpentInZoom,
};
