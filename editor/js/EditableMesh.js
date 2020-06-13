
import * as THREE from '../../build/three.module.js';

import { Selection } from './Selection.js';

function EditableMesh( originalMesh, editor ) {

	THREE.Object3D.call( this );

	this.editor = editor;

	var that = this;

	this.selectionChangedHandler = function () {

		that.updateSelection( );

	};

	editor.signals.selectionChanged.add( this.selectionChangedHandler );

	this.removeHandler = function () {

		editor.signals.selectionChanged.remove( this.selectionChangedHandler );

	};

	this.originalMesh = originalMesh;

	originalMesh.editableMesh = this;

	this.copy( this.originalMesh, false );

	this.originalGeometry = this.originalMesh.geometry;

	this.geometry = this.originalGeometry.isBufferGeometry
		? new THREE.Geometry().fromBufferGeometry( this.originalGeometry )
		: this.originalGeometry

	this.mesh = new THREE.Mesh(
		this.geometry,
		this.originalMesh.material,
	);

	this.mesh.editableMesh = this;

	this.mesh.copy( this.originalMesh, false );

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

	this.add( this.lines );
	this.add( this.points );

	this.type = 'EditableMesh';

	this.updateSelection();

}

EditableMesh.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

	constructor: EditableMesh,

	isEditableMesh: true,

	updateSelection: function () {

		var selection = new Selection( this, this.editor );

		if (this.selection) {

			this.remove( this.selection );

		}

		if (selection) {

			this.selection = selection;

			this.add( selection );

		}

	},

	moveGeometry: function ( offset ) {

		var that = this;

		// this.editor.selection.faces.forEach( function ( slug ) {
		//
		// 	var face = that.editor.selection.faces.refs[slug];
		//
		// 	var a = that.geometry.vertices[ face.a ];
		// 	var b = that.geometry.vertices[ face.b ];
		// 	var c = that.geometry.vertices[ face.c ];
		//
		// 	a.add( offset );
		// 	b.add( offset );
		// 	c.add( offset );
		//
		// } );

		// this.editor.selection.lines.forEach( function ( slug ) {
		//
		// 	var line = that.editor.selection.lines.refs[slug];
		//
		// 	var a = that.geometry.vertices[ line[0] ];
		// 	var b = that.geometry.vertices[ line[1] ];
		//
		// 	a.add( offset );
		// 	b.add( offset );
		//
		// } );

		this.editor.selection.points.forEach( function ( point ) {

			var p = that.geometry.vertices[ point ];

			p.add( offset );

			// if ( that.originalGeometry.isBufferGeometry ) {
			// 	that.originalGeometry.setInde[ point ].copy( p );
			// } else {
			// 	that.originalGeometry.vertices[ point ].copy( p );
			// }

		} );

		this.geometry.verticesNeedUpdate = true;
		this.geometry.elementsNeedUpdate = true;
		this.geometry.normalsNeedUpdate = true;

		// this.editor.removeObject( this.originalMesh );
		// this.originalMesh.parent.remove( this.originalMesh );

		// var newMesh = new THREE.Mesh( this.geometry, this.originalMesh.material );
		// newMesh.copy( this.originalMesh, false );
		// this.newMesh = newMesh;
		// this.editor.addObject( newMesh );

		// if ( this.originalGeometry.isBufferGeometry ) {
		// 	this.originalGeometry.fromGeometry( this.geometry );
		// } else {
		// 	this.originalGeometry.copy( this.geometry );
		// }

		// this.originalGeometry.verticesNeedUpdate = true;
		// this.originalGeometry.elementsNeedUpdate = true;
		// this.originalGeometry.normalsNeedUpdate = true;

		// this.originalGeometry.colorsNeedUpdate = true;
		// this.originalGeometry.uvsNeedUpdate = true;

	}

} );


export { EditableMesh };
