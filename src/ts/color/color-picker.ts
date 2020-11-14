import { Color } from "./color";

abstract class ColorPicker {
    public static highContrastMode: boolean = false;
    public static darkMode: boolean = false;

    public static getDisplayColor(itemColor: Color, itemNestingLevel: number): Color {
        if (ColorPicker.highContrastMode) {
            return (itemNestingLevel % 2 === +ColorPicker.darkMode) ? Color.WHITE : Color.BLACK;
        } else {
            return itemColor;
        }
    }
}

export { ColorPicker }
