import { Uniform, ShaderMaterial, Matrix4, Vector3, Vector4 } from 'three';
import ShadowMapMaterialVS from './shaders/ShadowMapMaterialVS.glsl';
import ShadowMapMaterialFS from './shaders/ShadowMapMaterialFS.glsl';

class ShadowMapMaterial extends ShaderMaterial {
  constructor() {
    super();
    this.vertexShader = ShadowMapMaterialVS;
    this.fragmentShader = ShadowMapMaterialFS;
    this.uniforms.size = new Uniform(3);
  }
}

export default ShadowMapMaterial;
