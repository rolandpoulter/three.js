/**
 * @author dforrer / https://github.com/dforrer
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

import { Command } from '../Command.js';
import { EditableMesh } from '../EditableMesh.js';
import * as THREE from '../../../build/three.module.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @constructor
 */
var SetSelectionTypeCommand = function ( editor, object, selectionType, previous ) {

	if ( previous ) {

		if ( previous.editor !== editor ) {

			previous.editor = editor;

		}

		if ( object ) {

			previous.setObject( object );

		}

		previous.setSelectionType( selectionType );

		return previous;

	}

	Command.call( this, editor );

	this.pendingEditableMesh = false;
	this.type = 'SetSelectionTypeCommand';

	this.setObject( object );
	this.setSelectionType( selectionType );

	// this.editor.setSelectionCommand( this );

};

SetSelectionTypeCommand.prototype = {

	setObject: function ( object ) {

		this.object = object;

		if ( this.object.isEditableMesh ) {

			this.editableMesh = this.object;

		} else if ( this.object.isMesh ) {

			this.editableMesh = new EditableMesh( this.object, editor );

		} else {

			throw new Error('Can only edit Mesh objects');

		}

		this.updateName();

	},

	setSelectionType: function ( selectionType ) {

		this.lastMode = this.editor.mode;

		this.selectionType = selectionType;

		this.updateName();
	},

	updateName: function () {

		var name = 'Set Selection Type';

		if ( this.object !== undefined && this.object ) {

			this.name = name + ': ' + this.selectionType + ': ' + object.name;

		} else if ( this.selectionType ) {

			this.name = name + ': ' + this.selectionType;

		} else {

			this.name = name;

		}

	},

	setupEditableMesh: function () {

		this.editor.setSelectionCommand( this );

		if (this.pendingEditableMesh) {
			return;
		}

		this.pendingEditableMesh = true;

		// var toJSON = object.toJSON;
		// object.toJSON = function () {
		// 	object.visible = true;
		// 	return toJSON.call(object);
		// };
		// object.toJSON.original = toJSON;
		// this.object.visible = false;

		this.editor.sceneHelpers.add( this.editableMesh );

		// this.editor.removeObject( this.object );
		// this.editor.addObject( this.editableMesh );

		this.editor.deselect();

		this.editor.emptySelection();

	},

	cleanupEditableMesh: function ( commitBufferChanges ) {

		this.pendingEditableMesh = false;

		this.editor.setSelectionCommand( null );

		this.editableMesh.removeHandler();

		this.editor.removeObject( this.editableMesh );
		// this.editableMesh.parent.remove( this.editableMesh );

		var object = this.object;

		if ( commitBufferChanges ) {
			// TODO:
		}

		// object.toJSON = object.toJSON.original || object.toJSON;
		// object.visible = true;
		// this.editor.addObject( object );

		this.editor.select( object );

	},

	execute: function () {

		if ( this.editor.mode !== this.selectionType ) {

			this.editor.setSelectionType( this.selectionType );

			if ( this.selectionType === 'objects' ) {

				this.cleanupEditableMesh( true );

			} else {

				this.setupEditableMesh();

			}
		}

	},

	undo: function () {

		if ( this.editor.mode !== this.lastMode ) {

			this.editor.setSelectionType( this.lastMode );

		}

		if ( this.lastMode === 'objects' ) {

			this.cleanupEditableMesh( false );

		}

	},

	toJSON: function () {

		var output = Command.prototype.toJSON.call( this );
		output.object = this.object.toJSON();

		return output;

	},

	fromJSON: function ( json ) {

		Command.prototype.fromJSON.call( this, json );

		this.object = this.editor.objectByUuid( json.object.object.uuid );

		if ( this.object === undefined ) {

			var loader = new THREE.ObjectLoader();
			this.object = loader.parse( json.object );

		}

	}

};

export { SetSelectionTypeCommand };
