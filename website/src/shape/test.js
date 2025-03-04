
import * as THREE from '../build/three.module.js';

import Stats from './jsm/libs/stats.module.js';

import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { Curves } from './jsm/curves/CurveExtras.js';

// this is a cut-and-paste of the depth shader -- modified to accommodate instancing for this app
var customDepthVertexShader =
    `
			// instanced
			attribute vec3 instanceOffset;
			attribute float instanceScale;

			#include <common>
			#include <uv_pars_vertex>
			#include <displacementmap_pars_vertex>
			#include <morphtarget_pars_vertex>
			#include <skinning_pars_vertex>
			#include <logdepthbuf_pars_vertex>
			#include <clipping_planes_pars_vertex>

			void main() {

				#include <uv_vertex>

				#include <skinbase_vertex>

				#ifdef USE_DISPLACEMENTMAP

					#include <beginnormal_vertex>
					#include <morphnormal_vertex>
					#include <skinnormal_vertex>

				#endif

				#include <begin_vertex>

				// instanced
				transformed *= instanceScale;
				transformed = transformed + instanceOffset;

				#include <morphtarget_vertex>
				#include <skinning_vertex>
				#include <displacementmap_vertex>
				#include <project_vertex>
				#include <logdepthbuf_vertex>
				#include <clipping_planes_vertex>

			}
			`;

// this is a cut-and-paste of the lambert shader -- modified to accommodate instancing for this app
var customLambertVertexShader =
    `
			#define LAMBERT

			// instanced
			attribute vec3 instanceOffset;
			attribute vec3 instanceColor;
			attribute float instanceScale;

			varying vec3 vLightFront;
			varying vec3 vIndirectFront;

			#ifdef DOUBLE_SIDED
				varying vec3 vLightBack;
				varying vec3 vIndirectBack;
			#endif

			#include <common>
			#include <uv_pars_vertex>
			#include <uv2_pars_vertex>
			#include <envmap_pars_vertex>
			#include <bsdfs>
			#include <lights_pars_begin>
			#include <color_pars_vertex>
			#include <fog_pars_vertex>
			#include <morphtarget_pars_vertex>
			#include <skinning_pars_vertex>
			#include <shadowmap_pars_vertex>
			#include <logdepthbuf_pars_vertex>
			#include <clipping_planes_pars_vertex>

			void main() {

				#include <uv_vertex>
				#include <uv2_vertex>
				#include <color_vertex>

				// vertex colors instanced
				#ifdef USE_COLOR
					vColor.xyz = instanceColor.xyz;
				#endif

				#include <beginnormal_vertex>
				#include <morphnormal_vertex>
				#include <skinbase_vertex>
				#include <skinnormal_vertex>
				#include <defaultnormal_vertex>

				#include <begin_vertex>

				// position instanced
				transformed *= instanceScale;
				transformed = transformed + instanceOffset;

				#include <morphtarget_vertex>
				#include <skinning_vertex>
				#include <project_vertex>
				#include <logdepthbuf_vertex>
				#include <clipping_planes_vertex>

				#include <worldpos_vertex>
				#include <envmap_vertex>
				#include <lights_lambert_vertex>
				#include <shadowmap_vertex>
				#include <fog_vertex>

			}
			`;


//

var mesh, renderer, scene, camera, controls;
var stats;

init();
animate();

function init() {

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    document.body.appendChild( renderer.domElement );

    renderer.outputEncoding = THREE.sRGBEncoding;

    scene = new THREE.Scene();

    scene.fog = new THREE.FogExp2( 0x000000, 0.004 );
    renderer.setClearColor( scene.fog.color, 1 );

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 80, 40, 80 );

    scene.add( camera );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableZoom = false;
    controls.maxPolarAngle = Math.PI / 2;

    scene.add( new THREE.AmbientLight( 0xffffff, 0.7 ) );

    var light = new THREE.DirectionalLight( 0xffffff, 0.4 );
    light.position.set( 50, 40, 0 );

    light.castShadow = true;
    light.shadow.camera.left = - 40;
    light.shadow.camera.right = 40;
    light.shadow.camera.top = 40;
    light.shadow.camera.bottom = - 40;
    light.shadow.camera.near = 10;
    light.shadow.camera.far = 180;

    light.shadow.bias = - 0.001;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;

    scene.add( light );

    // light shadow camera helper
    //light.shadowCameraHelper = new CameraHelper( light.shadow.camera );
    //scene.add( light.shadowCameraHelper );


    // instanced buffer geometry

    var geometry = new THREE.InstancedBufferGeometry();
    geometry.copy( new THREE.TorusBufferGeometry( 2, 0.5, 8, 128 ) );

    const INSTANCES = 256;

    var knot = new Curves.TorusKnot( 10 );
    var positions = knot.getSpacedPoints( INSTANCES );

    var offsets = new Float32Array( INSTANCES * 3 ); // xyz
    var colors = new Float32Array( INSTANCES * 3 ); // rgb
    var scales = new Float32Array( INSTANCES * 1 ); // s

    for ( var i = 0, l = INSTANCES; i < l; i ++ ) {

        var index = 3 * i;

        // per-instance position offset
        offsets[ index ] = positions[ i ].x;
        offsets[ index + 1 ] = positions[ i ].y;
        offsets[ index + 2 ] = positions[ i ].z;

        // per-instance color tint - optional
        colors[ index ] = 1;
        colors[ index + 1 ] = 1;
        colors[ index + 2 ] = 1;

        // per-instance scale variation
        scales[ i ] = 1 + 0.5 * Math.sin( 32 * Math.PI * i / INSTANCES );

    }

    geometry.setAttribute( 'instanceOffset', new THREE.InstancedBufferAttribute( offsets, 3 ) );
    geometry.setAttribute( 'instanceColor', new THREE.InstancedBufferAttribute( colors, 3 ) );
    geometry.setAttribute( 'instanceScale', new THREE.InstancedBufferAttribute( scales, 1 ) );


    // material

    var envMap = new THREE.TextureLoader().load( `textures/metal.jpg`, function ( texture ) {

        texture.mapping = THREE.SphericalReflectionMapping;
        texture.encoding = THREE.sRGBEncoding;
        if ( mesh ) mesh.material.needsUpdate = true;

    } );

    var material = new THREE.MeshLambertMaterial( {

        color: 0xffb54a,
        envMap: envMap,
        combine: THREE.MultiplyOperation,
        reflectivity: 0.8,

        vertexColors: true,
        fog: true

    } );

    material.onBeforeCompile = function( shader ) {

        shader.vertexShader = customLambertVertexShader;

    };


    // custom depth material - required for instanced shadows

    var customDepthMaterial = new THREE.MeshDepthMaterial();

    customDepthMaterial.onBeforeCompile = function( shader ) {

        shader.vertexShader = customDepthVertexShader;

    };

    customDepthMaterial.depthPacking = THREE.RGBADepthPacking;

    //

    mesh = new THREE.Mesh( geometry, material );
    mesh.scale.set( 1, 1, 2 );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.customDepthMaterial = customDepthMaterial;
    mesh.frustumCulled = false;

    scene.add( mesh );

    //

    var ground = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 800, 800 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshPhongMaterial( { color: 0x888888 } )
    );
    ground.position.set( 0, - 40, 0 );
    ground.receiveShadow = true;

    scene.add( ground );

    //

    stats = new Stats();
    document.body.appendChild( stats.dom );

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    renderer.setSize( window.innerWidth, window.innerHeight );

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

}

function animate() {

    requestAnimationFrame( animate );

    mesh.rotation.y += 0.005;

    stats.update();

    renderer.render( scene, camera );

}


