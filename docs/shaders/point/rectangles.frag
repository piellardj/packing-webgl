precision mediump float;

varying vec4 vColor;
varying vec2 vSize;

void main(void)
{
    vec2 absPosition = 2.0 * abs(gl_PointCoord - 0.5);
    if (absPosition.x > vSize.x || absPosition.y > vSize.y) {
        discard;
    }

    gl_FragColor = vColor;
}
