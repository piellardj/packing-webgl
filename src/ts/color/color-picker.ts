import { Color } from "./color";

type Palette = Color[];

const SUMMER: Palette = [
    new Color(29, 62, 94),
    new Color(44, 98, 154),
    new Color(68, 174, 163),
    new Color(243, 214, 99),
    new Color(233, 86, 64),
];

const FOREST: Palette = [
    new Color(14, 61, 4),
    new Color(23, 122, 8),
    new Color(183, 58, 69),
    new Color(238, 213, 157),
    new Color(209, 135, 52),
];

const OCEAN: Palette = [
    new Color(8, 29, 60),
    new Color(31, 99, 159),
    new Color(60, 157, 199),
    new Color(175, 240, 255),
    new Color(235, 184, 133),
];

const RUST: Palette = [
    new Color(141,28,11),
    new Color(164,75,38),
    new Color(229,171,84),
    new Color(127,164,161),
    new Color(91,125,123),
    new Color(31,54,54),
];

const GREYSCALE: Palette = [
    new Color(38, 38, 38),
    new Color(76, 76, 76),
    new Color(114, 114, 114),
    new Color(153, 153, 153),
    new Color(191, 191, 191),
    new Color(220, 220, 220),
];

const NEON: Palette = [
    new Color(252, 17, 147),
    new Color(23, 0, 81),
    new Color(106, 39, 197),
    new Color(33, 168, 159),
    new Color(133, 224, 191),
];

const DESERT: Palette = [
    new Color(167,206,160),
    new Color(95,154,121),
    new Color(55,82,83),
    new Color(218,172,115),
    new Color(244,219,142),
    new Color(155,143,100),
    new Color(170,109,75),
];

const FLASHY: Palette = [
    new Color(255,0,0),
    new Color(135,0,255),
    new Color(46,0,255),
    new Color(0,161,255),
    new Color(0,255,46),
    new Color(238,255,0),
    new Color(255,123,0),
];

const VALENTINE: Palette = [
    new Color(85,21,37),
    new Color(220,37,82),
    new Color(243,81,120),
    new Color(250,153,185),
    new Color(249,235,209),
]

const palettes: Palette[] = [
    SUMMER,
    FOREST,
    OCEAN,
    RUST,
    GREYSCALE,
    NEON,
    DESERT,
    FLASHY,
    VALENTINE,
];

abstract class ColorPicker {
    public static highContrastMode: boolean = false;
    public static darkMode: boolean = false;
    public static usePalette: boolean = false;
    private static palette: Palette = palettes[0];

    public static setPalette(id: number): void {
        if (id < 0 || id >= palettes.length) {
            this.usePalette = false;
        } else {
            this.usePalette = true;
            ColorPicker.palette = palettes[id];
        }
    }

    public static getDisplayColor(itemColor: Color, itemNestingLevel: number): Color {
        if (ColorPicker.highContrastMode) {
            return (itemNestingLevel % 2 === +ColorPicker.darkMode) ? Color.WHITE : Color.BLACK;
        } else {
            return itemColor;
        }
    }

    public static getDifferentColorFromPalette(colorToAvoid: Color): Color {
        const paletteSize = ColorPicker.palette.length;
        let result: Color;

        do {
            const colorId = Math.floor(paletteSize * Math.random());
            result = ColorPicker.palette[colorId];
        } while (result === colorToAvoid);

        return result;
    }
}

export { ColorPicker };
