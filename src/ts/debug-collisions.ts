import { ECollisionTestType, EPrimitive, Parameters } from "./parameters";
import { PatternBase } from "./patterns/pattern-base";
import { PatternCircle } from "./patterns/pattern-circle";
import { PatternRectangle } from "./patterns/pattern-rectangle";
import { PatternSquare } from "./patterns/pattern-square";
import { PatternTriangle } from "./patterns/pattern-triangle";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { Color } from "./utils/color";
import { ILine } from "./utils/i-line";

interface ITest {
    fixed: PatternBase;
    mobile: PatternBase;
}
interface ITestedPattern<T extends PatternBase> extends ITest {
    fixed: T;
    mobile: T;
}

const testedSquares: ITestedPattern<PatternSquare> = {
    fixed: new PatternSquare(),
    mobile: new PatternSquare(),
};

const testedCircles: ITestedPattern<PatternCircle> = {
    fixed: new PatternCircle(),
    mobile: new PatternCircle(),
};

const testedRectangles: ITestedPattern<PatternRectangle> = {
    fixed: new PatternRectangle(),
    mobile: new PatternRectangle(),
};

const testedTriangles: ITestedPattern<PatternTriangle> = {
    fixed: new PatternTriangle(),
    mobile: new PatternTriangle(),
};

function getCurrentTestItems(): ITest {
    const primitive = Parameters.primitive;
    if (primitive === EPrimitive.SQUARE) {
        return testedSquares;
    } else if (primitive === EPrimitive.CIRCLE) {
        return testedCircles;
    } else if (primitive === EPrimitive.RECTANGLE) {
        return testedRectangles;
    } else { //  if (primitive === EPrimitive.TRIANGLE) {
        return testedTriangles
    }
}

function computeSquare(sideSize: number): ILine[] {
    return [
        { from: { x: -0.5 * sideSize, y: -0.5 * sideSize }, to: { x: 0.5 * sideSize, y: -0.5 * sideSize } },
        { from: { x: 0.5 * sideSize, y: -0.5 * sideSize }, to: { x: 0.5 * sideSize, y: 0.5 * sideSize } },
        { from: { x: 0.5 * sideSize, y: 0.5 * sideSize }, to: { x: -0.5 * sideSize, y: 0.5 * sideSize } },
        { from: { x: -0.5 * sideSize, y: 0.5 * sideSize }, to: { x: -0.5 * sideSize, y: -0.5 * sideSize } },
    ];
}

function mainDebugCollisions(): void {
    const plotter = new PlotterCanvas2D();

    type DrawFunction = (items: PatternBase[]) => unknown;
    function getDrawFunction(): DrawFunction {
        const primitive = Parameters.primitive;
        if (primitive === EPrimitive.SQUARE) {
            return (items: PatternBase[]) => plotter.drawSquares(items as PatternSquare[]);
        } else if (primitive === EPrimitive.CIRCLE) {
            return (items: PatternBase[]) => plotter.drawCircles(items as PatternCircle[]);
        } else if (primitive === EPrimitive.RECTANGLE) {
            return (items: PatternBase[]) => plotter.drawRectangles(items as PatternRectangle[]);
        } else { // if (primitive === EPrimitive.TRIANGLE) {
            return (items: PatternBase[]) => plotter.drawTriangles(items as PatternTriangle[]);
        }
    }

    function mainLoop(): void {
        const currentTestType = Parameters.currentCollisionType;

        const testitems = getCurrentTestItems();

        const canvasSize = Page.Canvas.getSize();
        const mousePosRelative = Page.Canvas.getMousePosition();
        testitems.mobile.center.x = (mousePosRelative[0] - 0.5) * canvasSize[0];
        testitems.mobile.center.y = (mousePosRelative[1] - 0.5) * canvasSize[1];

        if (currentTestType === ECollisionTestType.PRIMITIVE) {
            const minCanvasSide = Math.min(canvasSize[0], canvasSize[1]);
            testitems.fixed.center.x = 0;
            testitems.fixed.center.y = 0;
            testitems.fixed.size = 0.5 * minCanvasSide;
            const lines = computeSquare(testitems.fixed.size);

            // bracket notations allows access to private fields/method while still keeping a bit of type checking
            testitems.mobile.size = testitems.mobile["computeBiggestSizePossibleToAvoidItem"](testitems.fixed, true);

            const drawFunction = getDrawFunction();
            plotter.initialize(Color.BLACK);
            drawFunction([testitems.fixed, testitems.mobile]);
            plotter.drawLines(lines, Color.GREEN);
            plotter.finalize();
        } else {
            const lines = computeSquare(0.5);

            // bracket notations allows access to private fields/method while still keeping a bit of type checking
            testitems.mobile.size = testitems.mobile["computeBiggestSizePossibleToAvoidPoint"]({ x: 0, y: 0 });

            const drawFunction = getDrawFunction();
            plotter.initialize(Color.BLACK);
            drawFunction([testitems.mobile]);
            plotter.drawLines(lines, Color.GREEN);
            plotter.finalize();
        }
        requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);
}

export { mainDebugCollisions }
