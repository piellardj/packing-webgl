class NumberRange {
    public constructor (public readonly from: number, public readonly to: number) {}

    public isInRange(candidate: number): boolean {
        return this.from <= candidate && candidate <= this.to;
    }
}

export { NumberRange };
