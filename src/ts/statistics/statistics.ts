import { StopWatch } from "./stop-watch";


const totalRuntime = new StopWatch();
let totalFrames = 0;

function initialize(): void {
    totalRuntime.reset();
    totalRuntime.start();

    totalFrames = 0;
}

function registerFrame(): void {
    totalFrames++;
}

function isVerboseFrame(): boolean {
    return (totalFrames % 100) === 0;
}

export {
    initialize,
    registerFrame,
    isVerboseFrame,
}
