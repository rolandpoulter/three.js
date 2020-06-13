
import * as THREE from '../../build/three.module.js';

import { Selection } from './Selection.js';

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

	}

} );


export { EditableMesh };
