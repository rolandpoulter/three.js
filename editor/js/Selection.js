
import * as THREE from '../../build/three.module.js';


function Selection( editableMesh, editor ) {

	THREE.Object3D.call( this );

	this.editor = editor;

	// this.selection = editor.selection;

	this.editableMesh = editableMesh;

	this.box = new THREE.Box3();

	var that = this.editableMesh;

	var selection = null;

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

		geometry.computeBoundingBox();
		this.box.copy( geometry.boundingBox ).applyMatrix4( this.editableMesh.matrixWorld );

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

		geometry.computeBoundingBox();
		this.box.copy( geometry.boundingBox ).applyMatrix4( this.editableMesh.matrixWorld );

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

			geometry.vertices.push( that.geometry.vertices[ line[0] ] );
			geometry.vertices.push( that.geometry.vertices[ line[1] ] );

		});

		// var wire = new THREE.EdgesGeometry( geometry );
		// var wire = new THREE.WireframeGeometry( geometry );

		geometry.computeBoundingBox();
		this.box.copy( geometry.boundingBox ).applyMatrix4( this.editableMesh.matrixWorld );

		selection = new THREE.Line( geometry, new THREE.LineBasicMaterial( {
			linewidth: 2,
			color: 0xffff00,
			depthTest: false
		} ) );

	}

	this.center = new THREE.Vector3();

	if ( selection ) {

		this.box.getCenter( this.center );
		this.center.sub(this.editableMesh.position);

		this.add( selection );

	} else {

		this.empty = true;

	}

	this.startPosition = new THREE.Vector3();

}

Selection.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

	constructor: Selection,

	isSelection: true,

	prepareTransform: function ( mode, axis, space ) {

		this.startPosition.copy( this.position );

	},

	previewTransform: function ( mode, axis, space ) {},

	finishTransform: function ( mode, axis, space ) {

		this.diffPosition = new THREE.Vector3().copy( this.startPosition ).sub( this.position );

		this.editableMesh.moveGeometry( this.diffPosition.negate() );

	}

} );


export { Selection };
