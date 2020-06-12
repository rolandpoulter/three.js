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

	if (previous) {

		if (previous.editor !== editor) {

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

		if (this.object.isEditableMesh) {

			this.editableMesh = this.object;

		} else if (this.object.isMesh) {

			this.editableMesh = new EditableMesh( this.object );

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

		} else if (this.selectionType) {

			this.name = name + ': ' + this.selectionType;

		} else {

			this.name = name;

		}

	},

	setupEditableMesh: function () {

		if (this.pendingEditableMesh) {
			return;
		}

		this.pendingEditableMesh = true;

		this.editor.removeObject( this.object );

		this.editor.addObject( this.editableMesh );

		this.editor.deselect();

		this.editor.emptySelection();

		this.editor.setSelectionCommand( this );

	},

	cleanupEditableMesh: function ( commitBufferChanges ) {

		this.pendingEditableMesh = false;

		this.editor.setSelectionCommand( null );

		this.editor.removeObject( this.editableMesh );

		var object = this.object;

		if ( commitBufferChanges ) {
			// TODO:
		}

		this.editor.addObject( object );

		this.editor.select( object );

	},

	execute: function () {

		if (this.editor.mode !== this.selectionType) {

			this.editor.setSelectionType( this.selectionType );

		}

		this.setupEditableMesh();

	},

	complete: function () {

		if (this.editor.mode !== this.lastMode) {

			this.editor.setSelectionType( this.lastMode );

		}

		this.cleanupEditableMesh( true );

	},

	undo: function () {

		if (this.editor.mode !== this.lastMode) {

			this.editor.setSelectionType( this.lastMode );

		}

		if (this.lastMode === 'objects') {

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
