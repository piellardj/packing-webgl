precision lowp float;

varying vec4 vColor;
varying vec2 vLocalCoords; // in [-1,-1]^2

void main(void)
{
    float sqDistanceToCenter = dot(vLocalCoords, vLocalCoords);
    bool isInDisk = (sqDistanceToCenter < 1.0);
    if (!isInDisk) {
        discard;
    }

    gl_FragColor = vColor;
}
