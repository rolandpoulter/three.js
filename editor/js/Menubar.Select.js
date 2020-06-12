/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIPanel, UIRow, UIHorizontalRule } from './libs/ui.js';

import { SetSelectionTypeCommand } from './commands/SetSelectionTypeCommand.js';

var MenubarSelect = function ( editor ) {

	var strings = editor.strings;

	var container = new UIPanel();
	container.setClass( 'menu' );

	var title = new UIPanel();
	title.setClass( 'title' );
	title.setTextContent( strings.getKey( 'menubar/select' ) );
	container.add( title );

	var options = new UIPanel();
	options.setClass( 'options' );
	container.add( options );

	var activeCommand = null;

	// polygons

	var polygonsMode = new UIRow();
	polygonsMode.setClass( 'option' );
	polygonsMode.setTextContent( strings.getKey( 'menubar/select/polygons' ) );
	polygonsMode.onClick( function () {

		var object = editor.selected;

		var command = new SetSelectionTypeCommand( editor, object, 'polygons', activeCommand );
		editor.execute( command );

		activeCommand = activeCommand || command;

	} );
	options.add( polygonsMode );

	// lines

	var linesMode = new UIRow();
	linesMode.setClass( 'option' );
	linesMode.setTextContent( strings.getKey( 'menubar/select/lines' ) );
	linesMode.onClick( function () {

		var object = editor.selected;

		var command = new SetSelectionTypeCommand( editor, object, 'lines', activeCommand );
		editor.execute( command );

		activeCommand = activeCommand || command;

	} );
	options.add( linesMode );

	// points

	var pointsMode = new UIRow();
	pointsMode.setClass( 'option' );
	pointsMode.setTextContent( strings.getKey( 'menubar/select/points' ) );
	pointsMode.onClick( function () {

		var object = editor.selected;

		var command = new SetSelectionTypeCommand( editor, object, 'points', activeCommand );
		editor.execute( command );

		activeCommand = activeCommand || command;

	} );
	options.add( pointsMode );

	// ---

	options.add( new UIHorizontalRule() );

	// objects

	var objectsMode = new UIRow();
	objectsMode.setClass( 'inactive' );
	objectsMode.setTextContent( strings.getKey( 'menubar/select/objects' ) );
	objectsMode.onClick( function () {

		var object = editor.selected;

		var command = new SetSelectionTypeCommand( editor, object, 'objects', activeCommand );
		editor.execute( command );

		activeCommand = null;

	} );
	options.add( objectsMode );

	// selection mode changed

	editor.signals.selectionTypeChanged.add( function ( selectionType ) {

		polygonsMode.setClass( 'option' );
		linesMode.setClass( 'option' );
		pointsMode.setClass( 'option' );
		objectsMode.setClass( 'option' );

		if (selectionType === 'objects') {

			objectsMode.setClass( 'inactive' );

		} if (selectionType === 'polygons') {

			polygonsMode.setClass( 'inactive' );

		} else if (selectionType === 'lines') {

			linesMode.setClass( 'inactive' );

		} else if (selectionType === 'points') {

			pointsMode.setClass( 'inactive' );

		}

	});

	return container;

};

export { MenubarSelect };
