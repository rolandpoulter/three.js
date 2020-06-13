/**
 * @author mrdoob / http://mrdoob.com/
 */

import * as THREE from '../../build/three.module.js';

import { Config } from './Config.js';
import { Loader } from './Loader.js';
import { History as _History } from './History.js';
import { Strings } from './Strings.js';
import { Storage as _Storage } from './Storage.js';

var Editor = function () {

	this.DEFAULT_CAMERA = new THREE.PerspectiveCamera( 50, 1, 0.01, 1000 );
	this.DEFAULT_CAMERA.name = 'Camera';
	this.DEFAULT_CAMERA.position.set( 0, 5, 10 );
	this.DEFAULT_CAMERA.lookAt( new THREE.Vector3() );

	var Signal = signals.Signal;

	this.signals = {

		// script

		editScript: new Signal(),

		// player

		startPlayer: new Signal(),
		stopPlayer: new Signal(),

		// notifications

		editorCleared: new Signal(),

		selectionTypeChanged: new Signal(),
		selectionCommandChanged: new Signal(),
		selectionChanged: new Signal(),

		savingStarted: new Signal(),
		savingFinished: new Signal(),

		transformModeChanged: new Signal(),
		snapChanged: new Signal(),
		spaceChanged: new Signal(),
		rendererChanged: new Signal(),
		rendererUpdated: new Signal(),

		sceneBackgroundChanged: new Signal(),
		sceneFogChanged: new Signal(),
		sceneGraphChanged: new Signal(),
		sceneRendered: new Signal(),

		cameraChanged: new Signal(),

		geometryChanged: new Signal(),

		objectSelected: new Signal(),
		objectFocused: new Signal(),

		objectAdded: new Signal(),
		objectChanged: new Signal(),
		objectRemoved: new Signal(),

		cameraAdded: new Signal(),
		cameraRemoved: new Signal(),

		helperAdded: new Signal(),
		helperRemoved: new Signal(),

		materialAdded: new Signal(),
		materialChanged: new Signal(),
		materialRemoved: new Signal(),

		scriptAdded: new Signal(),
		scriptChanged: new Signal(),
		scriptRemoved: new Signal(),

		windowResize: new Signal(),

		showGridChanged: new Signal(),
		refreshSidebarObject3D: new Signal(),
		historyChanged: new Signal(),

		viewportCameraChanged: new Signal()

	};

	this.config = new Config();
	this.history = new _History( this );
	this.storage = new _Storage();
	this.strings = new Strings( this.config );

	this.loader = new Loader( this );

	this.camera = this.DEFAULT_CAMERA.clone();

	this.scene = new THREE.Scene();
	this.scene.name = 'Scene';
	this.scene.background = new THREE.Color( 0xaaaaaa );

	this.sceneHelpers = new THREE.Scene();

	this.object = {};
	this.geometries = {};
	this.materials = {};
	this.textures = {};
	this.scripts = {};

	this.materialsRefCounter = new Map(); // tracks how often is a material used by a 3D object

	this.animations = {};
	this.mixer = new THREE.AnimationMixer( this.scene );

	this.selectionType = 'objects';
	this.selection = null;

	this.selected = null;
	this.helpers = {};

	this.cameras = {};
	this.viewportCamera = this.camera;

	this.addCamera( this.camera );

};

Editor.prototype = {

	setScene: function ( scene ) {

		this.scene.uuid = scene.uuid;
		this.scene.name = scene.name;

		this.scene.background = ( scene.background !== null ) ? scene.background.clone() : null;

		if ( scene.fog !== null ) this.scene.fog = scene.fog.clone();

		this.scene.userData = JSON.parse( JSON.stringify( scene.userData ) );

		// avoid render per object

		this.signals.sceneGraphChanged.active = false;

		while ( scene.children.length > 0 ) {

			this.addObject( scene.children[ 0 ] );

		}

		this.signals.sceneGraphChanged.active = true;
		this.signals.sceneGraphChanged.dispatch();

	},

	//

	addObject: function ( object, parent, index ) {

		var scope = this;

		object.traverse( function ( child ) {

			if ( child.geometry !== undefined ) scope.addGeometry( child.geometry );
			if ( child.material !== undefined ) scope.addMaterial( child.material );

			scope.addCamera( child );
			scope.addHelper( child );

		} );

		if ( parent === undefined ) {

			this.scene.add( object );

		} else {

			parent.children.splice( index, 0, object );
			object.parent = parent;

		}

		this.signals.objectAdded.dispatch( object );
		this.signals.sceneGraphChanged.dispatch();

	},

	moveObject: function ( object, parent, before ) {

		if ( parent === undefined ) {

			parent = this.scene;

		}

		parent.add( object );

		// sort children array

		if ( before !== undefined ) {

			var index = parent.children.indexOf( before );
			parent.children.splice( index, 0, object );
			parent.children.pop();

		}

		this.signals.sceneGraphChanged.dispatch();

	},

	nameObject: function ( object, name ) {

		object.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	removeObject: function ( object ) {

		if ( object.parent === null ) return; // avoid deleting the camera or scene

		var scope = this;

		object.traverse( function ( child ) {

			scope.removeCamera( child );
			scope.removeHelper( child );

			if ( child.material !== undefined ) scope.removeMaterial( child.material );

		} );

		object.parent.remove( object );

		this.signals.objectRemoved.dispatch( object );
		this.signals.sceneGraphChanged.dispatch();

	},

	addGeometry: function ( geometry ) {

		this.geometries[ geometry.uuid ] = geometry;

	},

	setGeometryName: function ( geometry, name ) {

		geometry.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addMaterial: function ( material ) {

		if ( Array.isArray( material ) ) {

			for ( var i = 0, l = material.length; i < l; i ++ ) {

				this.addMaterialToRefCounter( material[ i ] );

			}

		} else {

			this.addMaterialToRefCounter( material );

		}

		this.signals.materialAdded.dispatch();

	},

	addMaterialToRefCounter: function ( material ) {

		var materialsRefCounter = this.materialsRefCounter;

		var count = materialsRefCounter.get( material );

		if ( count === undefined ) {

			materialsRefCounter.set( material, 1 );
			this.materials[ material.uuid ] = material;

		} else {

			count ++;
			materialsRefCounter.set( material, count );

		}

	},

	removeMaterial: function ( material ) {

		if ( Array.isArray( material ) ) {

			for ( var i = 0, l = material.length; i < l; i ++ ) {

				this.removeMaterialFromRefCounter( material[ i ] );

			}

		} else {

			this.removeMaterialFromRefCounter( material );

		}

		this.signals.materialRemoved.dispatch();

	},

	removeMaterialFromRefCounter: function ( material ) {

		var materialsRefCounter = this.materialsRefCounter;

		var count = materialsRefCounter.get( material );
		count --;

		if ( count === 0 ) {

			materialsRefCounter.delete( material );
			delete this.materials[ material.uuid ];

		} else {

			materialsRefCounter.set( material, count );

		}

	},

	getMaterialById: function ( id ) {

		var material;
		var materials = Object.values( this.materials );

		for ( var i = 0; i < materials.length; i ++ ) {

			if ( materials[ i ].id === id ) {

				material = materials[ i ];
				break;

			}

		}

		return material;

	},

	setMaterialName: function ( material, name ) {

		material.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addTexture: function ( texture ) {

		this.textures[ texture.uuid ] = texture;

	},

	addAnimation: function ( object, animations ) {

		if ( animations.length > 0 ) {

			this.animations[ object.uuid ] = animations;

		}

	},

	//

	addCamera: function ( camera ) {

		if ( camera.isCamera ) {

			this.cameras[ camera.uuid ] = camera;

			this.signals.cameraAdded.dispatch( camera );

		}

	},

	removeCamera: function ( camera ) {

		if ( this.cameras[ camera.uuid ] !== undefined ) {

			delete this.cameras[ camera.uuid ];

			this.signals.cameraRemoved.dispatch( camera );

		}

	},

	//

	addHelper: function () {

		var geometry = new THREE.SphereBufferGeometry( 2, 4, 2 );
		var material = new THREE.MeshBasicMaterial( { color: 0xff0000, visible: false } );

		return function ( object, helper ) {

			if ( helper === undefined ) {

				if ( object.isCamera ) {

					helper = new THREE.CameraHelper( object );

				} else if ( object.isPointLight ) {

					helper = new THREE.PointLightHelper( object, 1 );

				} else if ( object.isDirectionalLight ) {

					helper = new THREE.DirectionalLightHelper( object, 1 );

				} else if ( object.isSpotLight ) {

					helper = new THREE.SpotLightHelper( object, 1 );

				} else if ( object.isHemisphereLight ) {

					helper = new THREE.HemisphereLightHelper( object, 1 );

				} else if ( object.isSkinnedMesh ) {

					helper = new THREE.SkeletonHelper( object.skeleton.bones[ 0 ] );

				} else {

					// no helper for this object type
					return;

				}

				var picker = new THREE.Mesh( geometry, material );
				picker.name = 'picker';
				picker.userData.object = object;
				helper.add( picker );

			}

			this.sceneHelpers.add( helper );
			this.helpers[ object.id ] = helper;

			this.signals.helperAdded.dispatch( helper );

		};

	}(),

	removeHelper: function ( object ) {

		if ( this.helpers[ object.id ] !== undefined ) {

			var helper = this.helpers[ object.id ];
			helper.parent.remove( helper );

			delete this.helpers[ object.id ];

			this.signals.helperRemoved.dispatch( helper );

		}

	},

	//

	addScript: function ( object, script ) {

		if ( this.scripts[ object.uuid ] === undefined ) {

			this.scripts[ object.uuid ] = [];

		}

		this.scripts[ object.uuid ].push( script );

		this.signals.scriptAdded.dispatch( script );

	},

	removeScript: function ( object, script ) {

		if ( this.scripts[ object.uuid ] === undefined ) return;

		var index = this.scripts[ object.uuid ].indexOf( script );

		if ( index !== - 1 ) {

			this.scripts[ object.uuid ].splice( index, 1 );

		}

		this.signals.scriptRemoved.dispatch( script );

	},

	getObjectMaterial: function ( object, slot ) {

		var material = object.material;

		if ( Array.isArray( material ) && slot !== undefined ) {

			material = material[ slot ];

		}

		return material;

	},

	setObjectMaterial: function ( object, slot, newMaterial ) {

		if ( Array.isArray( object.material ) && slot !== undefined ) {

			object.material[ slot ] = newMaterial;

		} else {

			object.material = newMaterial;

		}

	},

	setViewportCamera: function ( uuid ) {

		this.viewportCamera = this.cameras[ uuid ];
		this.signals.viewportCameraChanged.dispatch( this.viewportCamera );

	},

	// selection

	setSelectionType: function ( selectionType ) {

		this.selectionType = selectionType;

		this.signals.selectionTypeChanged.dispatch( selectionType );

	},

	setSelectionCommand: function ( command ) {

		this.signals.selectionCommandChanged.dispatch( command );

	},

	setSelection: function ( intersects, method ) {

		if (!intersects) {
			return;
		}

		method = method || 'toggle';

		function operate( list, slug, value ) {
			var index = list.indexOf( slug );

			function add () {
				if ( value ) {
					list.refs = list.refs || {};
					list.refs[slug] = value;
				}

				list.push( slug );
			}

			function remove () {
				if ( value ) {
					list.refs = list.refs || {};
					delete list.refs[slug];
				}

				list.splice( index, 1 );
			}

			if ( method === 'toggle' ) {

				if ( index === -1 ) {

					add();

				} else {

					remove();

				}

			} else if ( method === 'add' ) {

				if ( index === -1 ) {

					add();

				}

			} else if (method === 'remove') {

				if (index !== -1) {

					remove();

				}

			}
		}

		this.selection = this.selection || {
			faces: [],
			lines: [],
			points: []
		};

		var object = intersects.object;

		var editabledMesh = object.editableMesh || object;

		var point = intersects.point;

		var face = intersects.face;

		if ( this.selectionType === 'polygons' ) {

			var slug = [ face.a, face.b, face.c ].sort().join( ',' );

			operate( this.selection.faces, slug, face );

		} else {

			var geometry = editabledMesh.geometry;

			var points = [
				geometry.vertices[ face.a ],
				geometry.vertices[ face.b ],
				geometry.vertices[ face.c ],
			];

			var distances = points.map(function ( p ) {
				return p.distanceTo( point );
			});

			var minDistance = Math.min.apply( Math, distances );

			var faceIndex = distances.indexOf( minDistance );

			var index = face[ [ 'a', 'b', 'c' ][ faceIndex ] ];

			if ( this.selectionType === 'points' ) {

				// TODO: this could be better
				operate( this.selection.points, index, null );

			} else if ( this.selectionType === 'lines' ) {

				distances[ faceIndex ] = Infinity;

				minDistance = Math.min.apply( Math, distances );

				var nextFaceIndex = distances.indexOf( minDistance );

				var nextIndex = face[ [ 'a', 'b', 'c' ][ nextFaceIndex ] ];

				// distances[ nextFaceIndex ] = Infinity;
				// minDistance = Math.min.apply( Math, distances );
				// var lastFaceIndex = distances.indexOf( minDistance );
				// var lastIndex = face[ [ 'a', 'b', 'c' ][ lastFaceIndex ] ];

				var slug = [ index, nextIndex/* , lastIndex */ ].sort().join( ',' );

				// TODO: use better math to calulate which edge to pick
				operate( this.selection.lines, slug, [ index, nextIndex/* , lastIndex */ ] );

			}

		}

		this.signals.selectionChanged.dispatch( {
			selection: this.selection,
			editableMesh: editabledMesh,
			object: object,
			intersects: intersects
		} );

	},

	addSelection: function ( intersects ) {

		this.polygonSelect( intersects, 'add' );

	},

	removeSelection: function ( intersects ) {

		this.polygonSelect( intersects, 'remove' );

	},

	emptySelection: function ( ) {

		this.selectionCommand = null;
		this.selection = null;

	},

	// select

	select: function ( object ) {

		if ( this.selected === object ) return;

		var uuid = null;

		if ( object !== null ) {

			uuid = object.uuid;

		}

		this.selected = object;

		this.config.setKey( 'selected', uuid );
		this.signals.objectSelected.dispatch( object );

	},

	selectById: function ( id ) {

		if ( id === this.camera.id ) {

			this.select( this.camera );
			return;

		}

		this.select( this.scene.getObjectById( id, true ) );

	},

	selectByUuid: function ( uuid ) {

		var scope = this;

		this.scene.traverse( function ( child ) {

			if ( child.uuid === uuid ) {

				scope.select( child );

			}

		} );

	},

	deselect: function () {

		this.select( null );

	},

	focus: function ( object ) {

		if ( object !== undefined ) {

			this.signals.objectFocused.dispatch( object );

		}

	},

	focusById: function ( id ) {

		this.focus( this.scene.getObjectById( id, true ) );

	},

	clear: function () {

		this.history.clear();
		this.storage.clear();

		this.camera.copy( this.DEFAULT_CAMERA );
		this.scene.name = "Scene";
		this.scene.userData = {};
		this.scene.background = new THREE.Color( 0xaaaaaa );
		this.scene.fog = null;

		var objects = this.scene.children;

		while ( objects.length > 0 ) {

			this.removeObject( objects[ 0 ] );

		}

		this.geometries = {};
		this.materials = {};
		this.textures = {};
		this.scripts = {};

		this.materialsRefCounter.clear();

		this.animations = {};
		this.mixer.stopAllAction();

		this.deselect();

		this.signals.editorCleared.dispatch();

	},

	//

	fromJSON: function ( json ) {

		var scope = this;

		var loader = new THREE.ObjectLoader();
		var camera = loader.parse( json.camera );

		this.camera.copy( camera );
		this.camera.aspect = this.DEFAULT_CAMERA.aspect;
		this.camera.updateProjectionMatrix();

		this.history.fromJSON( json.history );
		this.scripts = json.scripts;

		// if (this.selectionType !== json.selectionType) {
		// 	this.setSelectionType(json.selectionType);
		// }
		// if (this.selection !== json.selection) {
		// 	this.setSelection(json.selection);
		// }

		loader.parse( json.scene, function ( scene ) {

			scope.setScene( scene );

		} );

	},

	toJSON: function () {

		// scripts clean up

		var scene = this.scene;
		var scripts = this.scripts;

		for ( var key in scripts ) {

			var script = scripts[ key ];

			if ( script.length === 0 || scene.getObjectByProperty( 'uuid', key ) === undefined ) {

				delete scripts[ key ];

			}

		}

		//

		return {

			metadata: {},
			project: {
				shadows: this.config.getKey( 'project/renderer/shadows' ),
				shadowType: this.config.getKey( 'project/renderer/shadowType' ),
				vr: this.config.getKey( 'project/vr' ),
				physicallyCorrectLights: this.config.getKey( 'project/renderer/physicallyCorrectLights' ),
				toneMapping: this.config.getKey( 'project/renderer/toneMapping' ),
				toneMappingExposure: this.config.getKey( 'project/renderer/toneMappingExposure' )
			},
			// selectionType: this.selectionType,
			// selection: this.selection,
			camera: this.camera.toJSON(),
			scene: this.scene.toJSON(),
			scripts: this.scripts,
			history: this.history.toJSON()

		};

	},

	objectByUuid: function ( uuid ) {

		return this.scene.getObjectByProperty( 'uuid', uuid, true );

	},

	execute: function ( cmd, optionalName ) {

		this.history.execute( cmd, optionalName );

	},

	undo: function () {

		this.history.undo();

	},

	redo: function () {

		this.history.redo();

	}

};

export { Editor };
