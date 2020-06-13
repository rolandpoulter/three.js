/**
 * @author mikael emtinger / http://gomo.se/
 * @author alteredq / http://alteredqualia.com/
 * @author ikerr / http://verold.com
 */

import * as THREE from '../../build/three.module.js';


function EditableMesh( originalMesh, editor ) {

	THREE.Object3D.call( this );

	this.editor = editor;

	var that = this;

	this.selectionChangedHandler = function () {

		that.updateSelection( editor.selection );

	};

	editor.signals.selectionChanged.add( this.selectionChangedHandler );

	this.removeHandler = function () {

		editor.signals.selectionChanged.remove( this.selectionChangedHandler );

	};

	this.originalMesh = originalMesh;

	this.copy( this.originalMesh, false );

	this.originalGeometry = this.originalMesh.geometry;

	this.geometry = this.originalGeometry.isBufferGeometry
		? new THREE.Geometry().fromBufferGeometry( this.originalGeometry )
		: this.originalGeometry

	// this.bufferGeometry = this.originalGeometry.isBufferGeometry
	// 	? this.originalGeometry
	// 	: new THREE.BufferGeometry.fromGeometry( this.originalGeometry );

	this.mesh = new THREE.Mesh(
		// this.bufferGeometry,
		this.geometry,
		this.originalMesh.material,
	);

	// this.mesh.visible = false;

	// this.mesh.raycast = function () { return []; };

	this.edges = new THREE.WireframeGeometry(
	// this.edges = new THREE.EdgesGeometry(
		// this.bufferGeometry
		this.geometry
	);

	this.lines = new THREE.LineSegments( this.edges, new THREE.LineBasicMaterial( {
		// linewidth: 10,
		color: 0xffffff,
		// depthTest: false,
		// opacity: 1,
		// transparent: true,
	} ) );

	// this.lines.raycast = function () { return []; };

	this.points = new THREE.Points(
		// this.bufferGeometry,
		this.geometry,
		new THREE.PointsMaterial( {
			sizeAttenuation: false,
			size: 6,
			color: 0x888888,
			// depthTest: false,
			// opacity: 1,
			// transparent: true,
		} )
	);

	// this.points.raycast = function () { return []; };

	// this.add( this.mesh );
	this.add( this.lines );
	this.add( this.points );

	this.type = 'EditableMesh';

}

EditableMesh.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

	constructor: EditableMesh,

	isEditableMesh: true,

	updateSelection: function () {

		console.log('editor selection', this.editor.selection);

		var selection = null;

		var that = this;

		if ( this.editor.selectionType === 'polygons' ) {

			var geometry = new THREE.Geometry();

			this.editor.selection.faces.forEach(function ( face ) {

				var offset = geometry.vertices.length;

				// geometry.vertices.push( that.bufferGeometry.getIndex( face.a ) );
				// geometry.vertices.push( that.bufferGeometry.getIndex( face.b ) );
				// geometry.vertices.push( that.bufferGeometry.getIndex( face.c ) );

				geometry.vertices.push( that.geometry.vertices[ face.a ] );
				geometry.vertices.push( that.geometry.vertices[ face.b ] );
				geometry.vertices.push( that.geometry.vertices[ face.c ] );

				geometry.faces.push(
					new THREE.Face3( offset + 0, offset + 1, offset + 2 )
				);

			});

			// console.log('FACES', faces);
			selection = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( {
				color: 0xffffff,
				depthTest: false,
				opacity: 0.5,
				transparent: true,
			} ) );

		} else if (this.editor.selectionType === 'points') {

			var geometry = new THREE.Geometry();

			this.editor.selection.points.forEach(function ( index ) {

				geometry.vertices.push(
					// that.bufferGeometry.getIndex( index )
					that.geometry.vertices[ index ]
				);

			});

			selection = new THREE.Points( geometry, new THREE.PointsMaterial( {
				sizeAttenuation: false,
				size: 12,
				color: 0xffff00,
				depthTest: false,
			} ) );

		// } else if (this.editor.selectionType === 'lines') {

			// var lines = this.editor.selection.lines.map(function ( index ) {
			//
			// 	return that.bufferGeometry.getIndex( index );
			//
			// });

			// selection = null;

		}

		if (this.selection) {

			this.remove( this.selection );

		}

		if (selection) {

			this.selection = selection;

			this.add( selection );

		}

	}

} );


export { EditableMesh };
