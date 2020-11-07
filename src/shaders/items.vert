attribute vec2 aCoords; // in pixels, centered on {0,0}
attribute float aSize; // in pixels
attribute vec4 aColor;

uniform vec2 uScreenSize; // in pixels

varying vec4 uColor;

void main(void)
{
    gl_Position = vec4(2.0 * aCoords / uScreenSize * vec2(1,-1), 0, 1);
    gl_PointSize = aSize;

    uColor = aColor;
}
