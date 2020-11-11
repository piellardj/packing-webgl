precision mediump float;

varying vec4 vColor;

void main(void)
{
    vec2 toCenter = gl_PointCoord - vec2(.5);
    float sqDistanceToCenter = dot(toCenter, toCenter);
    bool isInDisk = (sqDistanceToCenter < .5 * .5);
    if (!isInDisk) {
        discard;
    }

    gl_FragColor = vColor;
}
