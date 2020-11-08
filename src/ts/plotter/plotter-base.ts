import { Color } from "../utils/color";
import { ILine } from "../utils/i-line";
import { ISize } from "../utils/i-size";

import { PatternCircle } from "../patterns/pattern-circle";
import { PatternSquare } from "../patterns/pattern-square";
import { PatternRectangle } from "../patterns/pattern-rectangle";

abstract class PlotterBase {
    public abstract get size(): ISize;

    public abstract get isReady(): boolean;

    public abstract initialize(backgroundColor: Color): void;
    public abstract finalize(): void;

    public abstract drawSquares(squares: PatternSquare[]): void;
    public abstract drawCircles(circles: PatternCircle[]): void;
    public abstract drawRectangles(rectangles: PatternRectangle[]): void;

    /* Lines have  a 1 pixel thickness */
    public abstract drawLines(lines: ILine[], color: Color): void;
}

export { PlotterBase };

