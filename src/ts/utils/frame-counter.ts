let frameIndex = 0;

function isVerboseFrame(): boolean {
    return (frameIndex % 100) === 0;
}

function incrementFrame(): void {
    frameIndex++;
}

export { incrementFrame, isVerboseFrame }
