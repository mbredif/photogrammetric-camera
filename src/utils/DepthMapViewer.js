/**
 * Implementation inspired on 'three/examples/jsm/utils/ShadowMapViewer.js'
 */

import {
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	UniformsUtils
} from 'three';
import { UnpackDepthRGBAShader } from 'three/examples/jsm/shaders/UnpackDepthRGBAShader.js';

/**
 * Example usage:
 *	1) Import DepthMapViewer into your app.
 *
 *	3) Create a depth map viewer and set its size and position optionally:
 *		var depthMapViewer = new DepthMapViewer();
 *		depthMapViewer.size.set( 128, 128 );	//width, height  default: 256, 256
 *		depthMapViewer.position.set( 10, 10 );	//x, y in pixel	 default: 0, 0 (top left corner)
 *
 *	4) Render the depth map viewer in your render loop:
 *		depthMapViewer.render( renderer, depthMap );
 *
 *	5) Optionally: Update the depth map viewer on window resize:
 *		depthMapViewer.updateForWindowResize();
 *
 *	6) If you set the position or size members directly, you need to call depthMapViewer.update();
 */

class DepthMapViewer {

	constructor() {

		//- Internals
		const scope = this;
		let userAutoClearSetting;

		//Holds the initial position and dimension of the HUD
		const frame = {
			x: 10,
			y: 10,
			width: 256,
			height: 256
		};

		const camera = new OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 10 );
		camera.position.set( 0, 0, 2 );
		const scene = new Scene();

		//HUD for shadow map
		const shader = UnpackDepthRGBAShader;

		const uniforms = UniformsUtils.clone( shader.uniforms );
		const material = new ShaderMaterial( {
			uniforms: uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		} );
		const plane = new PlaneGeometry( frame.width, frame.height );
		const mesh = new Mesh( plane, material );

		scene.add( mesh );

		function resetPosition() {

			scope.position.set( scope.position.x, scope.position.y );

		}

		//- API
		// Set to false to disable displaying this depht map
		this.enabled = true;

		// Set the size of the displayed depth map on the HUD
		this.size = {
			width: frame.width,
			height: frame.height,
			set: function ( width, height ) {

				this.width = width;
				this.height = height;

				mesh.scale.set( this.width / frame.width, this.height / frame.height, 1 );

				//Reset the position as it is off when we scale stuff
				resetPosition();

			}
		};

		// Set the position of the displayed shadow map on the HUD
		this.position = {
			x: frame.x,
			y: frame.y,
			set: function ( x, y ) {

				this.x = x;
				this.y = y;

				const width = scope.size.width;
				const height = scope.size.height;

				mesh.position.set( - window.innerWidth / 2 + width / 2 + this.x, window.innerHeight / 2 - height / 2 - this.y, 0 );

			}
		};

		this.render = function ( renderer, depthMap ) {

			if ( this.enabled ) {

				material.uniforms.tDiffuse.value = depthMap;

				userAutoClearSetting = renderer.autoClear;
				renderer.autoClear = false; // To allow render overlay
				renderer.clearDepth();
				renderer.render( scene, camera );
				renderer.autoClear = userAutoClearSetting;	//Restore user's setting

			}

		};

		this.updateForWindowResize = function () {

			if ( this.enabled ) {

				 camera.left = window.innerWidth / - 2;
				 camera.right = window.innerWidth / 2;
				 camera.top = window.innerHeight / 2;
				 camera.bottom = window.innerHeight / - 2;
				 camera.updateProjectionMatrix();

				 this.update();

			}

		};

		this.update = function () {

			this.position.set( this.position.x, this.position.y );
			this.size.set( this.size.width, this.size.height );

		};

		//Force an update to set position/size
		this.update();

	}

}


export default DepthMapViewer;
