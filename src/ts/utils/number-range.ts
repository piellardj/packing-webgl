class NumberRange {
    public constructor (public from: number, public to: number) {}

    public isInRange(candidate: number): boolean {
        return this.from <= candidate && candidate <= this.to;
    }

    public clamp(value: number): number {
        if (value < this.from) {
            return this.from;
        } else if (value > this.to) {
            return this.to;
        }
        return value;
    }

    public get span(): number {
        return this.to - this.from;
    }
}

export { NumberRange };
