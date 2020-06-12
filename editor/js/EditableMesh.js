/**
 * @author mikael emtinger / http://gomo.se/
 * @author alteredq / http://alteredqualia.com/
 * @author ikerr / http://verold.com
 */

import * as THREE from '../../build/three.module.js';


function EditableMesh( originalMesh ) {

	THREE.Object3D.call( this );

	this.originalMesh = originalMesh;

	this.copy( this.originalMesh, false );

	this.originalGeometry = this.originalMesh.geometry;

	// this.geometry = originalGeometry.isBufferGeometry
	// 	? new THREE.Geometry.fromBufferGeometry( this.originalGeometry )
	// 	: this.originalGeometry

	this.bufferGeometry = this.originalGeometry.isBufferGeometry
		? this.originalGeometry
		: new THREE.BufferGeometry.fromGeometry( this.originalGeometry );

	this.mesh = new THREE.Mesh(
		this.bufferGeometry,
		this.originalMesh.material,
	);

	// this.mesh.raycast = function () { return []; };

	this.edges = new THREE.EdgesGeometry( this.bufferGeometry );

	this.lines = new THREE.LineSegments( this.edges, new THREE.LineBasicMaterial( {
		linewidth: 10,
		color: 0xffffff,
		// depthTest: false,
		// opacity: 1,
		// transparent: true,
	} ) );

	this.lines.raycast = function () { return []; };

	this.points = new THREE.Points( this.bufferGeometry, new THREE.PointsMaterial( {
		sizeAttenuation: false,
		size: 10,
		color: 0x888888,
		// depthTest: false,
		// opacity: 1,
		// transparent: true,
	} ) );

	this.points.raycast = function () { return []; };

	this.add( this.mesh );
	this.add( this.lines );
	this.add( this.points );

	this.type = 'EditableMesh';

}

EditableMesh.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

	constructor: EditableMesh,

	isEditableMesh: true,

} );


export { EditableMesh };
