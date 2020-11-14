class StopWatch {
    private _totalTime: number;
    private _lastCheckpoint: number;
    private _isRunning: boolean;

    constructor() {
        this._totalTime = 0;
        this._isRunning = false;
    }

    public start(): void {
        if (!this._isRunning) {
            this._lastCheckpoint = performance.now();
            this._isRunning = true;
        } else {
            console.log("Error: stopwatch is already started");
        }
    }

    public stop(): void {
        if (this._isRunning) {
            const now = performance.now();
            this._totalTime += now - this._lastCheckpoint;
            this._lastCheckpoint = now;
            this._isRunning = false;
        } else {
            console.log("Error: stopwatch is already stopped.");
        }
    }

    public reset(): void {
        this._totalTime = 0;
        this._lastCheckpoint = performance.now();
    }

    public get totalTime(): number {
        if (this._isRunning) {
            return this._totalTime + (performance.now() - this._lastCheckpoint);
        } else {
            return this._totalTime;
        }
    }
}

export { StopWatch };
