import { Uniform, ShaderMaterial, Matrix4, Vector3, Vector4 } from 'three';

class ShadowMapMaterial extends ShaderMaterial {
  constructor() {

    super();

    this.vertexShader = `
        varying float vDistanceCamera;

        void main() {

            vec4 vPositionImage = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            gl_Position = vPositionImage;

            // Normalization (0,1)
            vDistanceCamera = ((vPositionImage.z / vPositionImage.w) + 1.) / 2.;
        }
    `;

    this.fragmentShader = `
        varying float vDistanceCamera;

        void main() {

          gl_FragColor = vec4(vDistanceCamera, vDistanceCamera, vDistanceCamera, 1.);

        }
    `;
  }
}

export default ShadowMapMaterial;
