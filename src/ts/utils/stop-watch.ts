class StopWatch {
    constructor(private time: number) {}

    public reset(currentTime: number): void {
        this.time = currentTime;
    }

    public elapsedTime(currentTime: number): number {
        return currentTime - this.time;
    }
}

export { StopWatch }
