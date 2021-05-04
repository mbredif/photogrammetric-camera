varying float vDistanceCamera;

void main() {

    vec4 vPositionImage = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_Position = vPositionImage;

    // Normalization (0,1)
    vDistanceCamera = ((vPositionImage.z / vPositionImage.w) + 1.) / 2.;
}
