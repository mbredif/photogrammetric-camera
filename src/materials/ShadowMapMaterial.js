import { Uniform, ShaderMaterial, Matrix4, Vector3, Vector4 } from 'three';
import ShadowMapMaterialVS from './shaders/ShadowMapMaterialVS.glsl';
import ShadowMapMaterialFS from './shaders/ShadowMapMaterialFS.glsl';

class ShadowMapMaterial extends ShaderMaterial {
  constructor() {

    super();

    // this.vertexShader = `
    //     varying float vDistanceCamera;
    //
    //     void main() {
    //
    //         vec4 vPositionImage = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    //         gl_Position = vPositionImage;
    //
    //         // Normalization (0,1)
    //         vDistanceCamera = ((vPositionImage.z / vPositionImage.w) + 1.) / 2.;
    //     }
    // `;
    this.vertexShader = ShadowMapMaterialVS;

    // this.fragmentShader = `
    //     varying float vDistanceCamera;
    //
    //     void main() {
    //
    //       gl_FragColor = vec4(vDistanceCamera, vDistanceCamera, vDistanceCamera, 1.);
    //
    //     }
    // `;
    this.fragmentShader = ShadowMapMaterialFS;
    this.uniforms.size = new Uniform(3);
  }
}

export default ShadowMapMaterial;
