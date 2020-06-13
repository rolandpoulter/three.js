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
		this.geometry,
		this.originalMesh.material,
	);

	this.edges = new THREE.WireframeGeometry( this.geometry );

	this.lines = new THREE.LineSegments( this.edges, new THREE.LineBasicMaterial( {
		linewidth: 1,
		color: 0xffffff,
	} ) );

	this.points = new THREE.Points(
		this.geometry,
		new THREE.PointsMaterial( {
			sizeAttenuation: false,
			size: 4,
			color: 0x888888,
		} )
	);

	// this.add( this.mesh );
	this.add( this.lines );
	this.add( this.points );

	this.type = 'EditableMesh';

}

EditableMesh.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

	constructor: EditableMesh,

	isEditableMesh: true,

	updateSelection: function () {

		var selection = null;

		var that = this;

		if ( this.editor.selectionType === 'polygons' ) {

			var geometry = new THREE.Geometry();

			this.editor.selection.faces.forEach(function ( slug ) {

				var face = that.editor.selection.faces.refs[slug];

				var offset = geometry.vertices.length;

				geometry.vertices.push( that.geometry.vertices[ face.a ] );
				geometry.vertices.push( that.geometry.vertices[ face.b ] );
				geometry.vertices.push( that.geometry.vertices[ face.c ] );

				geometry.faces.push(
					new THREE.Face3( offset + 0, offset + 1, offset + 2 )
				);

			});

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
					that.geometry.vertices[ index ]
				);

			});

			selection = new THREE.Points( geometry, new THREE.PointsMaterial( {
				sizeAttenuation: false,
				size: 8,
				color: 0xffff00,
				depthTest: false,
			} ) );

		} else if (this.editor.selectionType === 'lines') {

			var geometry = new THREE.Geometry();

			this.editor.selection.lines.forEach(function ( slug ) {

				var line = that.editor.selection.lines.refs[slug];

				// var offset = geometry.vertices.length;

				geometry.vertices.push( that.geometry.vertices[ line[0] ] );
				geometry.vertices.push( that.geometry.vertices[ line[1] ] );
				// geometry.vertices.push( that.geometry.vertices[ line[2] ] );

				// geometry.faces.push(
				// 	new THREE.Face3( offset + 0, offset + 1, offset + 2 )
				// );

			});

			// var wire = new THREE.EdgesGeometry( geometry );
			// var wire = new THREE.WireframeGeometry( geometry );

			selection = new THREE.Line( geometry, new THREE.LineBasicMaterial( {
				linewidth: 2,
				color: 0xffff00,
				depthTest: false
			} ) );

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
