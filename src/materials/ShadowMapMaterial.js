import { Uniform, ShaderMaterial, ShaderChunk } from 'three';
import ShadowMapMaterialVS from './shaders/ShadowMapMaterialVS.glsl';
import ShadowMapMaterialFS from './shaders/ShadowMapMaterialFS.glsl';

class ShadowMapMaterial extends ShaderMaterial {
  constructor() {

    super();

    this.uniforms.size = new Uniform(3);

    this.vertexShader = ShadowMapMaterialVS;

    this.fragmentShader = `
      ${ShaderChunk.packing}
      ${ShadowMapMaterialFS}
    `;

  }
}

export default ShadowMapMaterial;
