uniform float size;
#ifdef USE_PROJECTIVE_TEXTURING
varying vec4 vPositionWorld;
varying float vDistanceCamera;
varying vec4 vPositionImage;
#endif
varying vec4 vColor;

void main() {
    gl_PointSize = size;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

#ifdef USE_PROJECTIVE_TEXTURING
    vPositionWorld = modelMatrix * vec4( position, 1.0 );
		vPositionImage = gl_Position;
#endif
    vColor = vec4(color, 1.);
}
