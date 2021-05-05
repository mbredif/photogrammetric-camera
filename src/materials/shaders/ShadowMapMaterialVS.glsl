varying vec4 vPositionImage;
uniform float size;

void main() {

    vPositionImage = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_Position = vPositionImage;
		gl_PointSize = size;

}
