import { Light, LightShadow, Object3D } from 'three';


class ProjectiveTextureLight extends Light {
  constructor(camera, texture, color, intensity) {
    super(color, intensity);
    this.shadow = new LightShadow(camera);
    this.texture = texture;
    this.target = new Object3D();
    this.type = 'SpotLight';
    this.isSpotLight = true;
  }
}

export default ProjectiveTextureLight;
