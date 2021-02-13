import { Color } from "../color/color";

import { PatternCircle } from "../patterns/pattern-circle";
import { PatternHeart } from "../patterns/pattern-heart";
import { PatternRectangle } from "../patterns/pattern-rectangle";
import { PatternSquare } from "../patterns/pattern-square";
import { PatternTriangle } from "../patterns/pattern-triangle";

import { ILine } from "../utils/i-line";
import { ISize } from "../utils/i-size";

abstract class PlotterBase {
    public abstract get size(): ISize;

    public abstract get isReady(): boolean;

    public abstract initialize(backgroundColor: Color): void;
    public abstract finalize(): void;

    public abstract drawSquares(squares: PatternSquare[]): void;
    public abstract drawCircles(circles: PatternCircle[]): void;
    public abstract drawRectangles(rectangles: PatternRectangle[]): void;
    public abstract drawTriangles(triangles: PatternTriangle[]): void;
    public abstract drawHearts(hearts: PatternHeart[]): void;

    /* Lines have  a 1 pixel thickness */
    public abstract drawLines(lines: ILine[], color: Color): void;
}

export { PlotterBase };
