attribute vec2 aCoords; // in pixels, centered on {0,0}
attribute float aSize; // in pixels, 
attribute float aAspectRatio;
attribute vec4 aColor; // in [0,1]^4, alpha <= 0 to hide point

uniform vec2 uScreenSize; // in pixels

varying vec4 vColor;
varying vec2 vSize;

void main(void)
{
    const vec2 OUT_OF_SCREEN = vec2(1000000, 10000000);

    float isPointHidden = step(aColor.a, 0.0);

    vec2 realPosition = 2.0 * aCoords / uScreenSize * vec2(1,-1);
    vec2 position = realPosition + isPointHidden * OUT_OF_SCREEN;
    gl_Position = vec4(position, 0, 1);

    gl_PointSize = aSize;

    float sizeX = min(1.0, aAspectRatio);
    float sizeY = min(1.0, 1.0 / aAspectRatio);

    vSize = vec2(sizeX, sizeY);
    vColor = aColor;
}