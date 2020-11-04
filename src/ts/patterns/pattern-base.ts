import { PlotterBase } from "../plotter/plotter-base";

abstract class PatternBase {
    protected readonly color: string;

    protected constructor(color: string) {
        this.color = color;
    }

    public abstract draw(plotter: PlotterBase): void;

    public abstract zoomIn(zoomFactor: number): void;
}

export { PatternBase }
