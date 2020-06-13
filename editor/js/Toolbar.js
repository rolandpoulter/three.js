/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UIPanel, UIButton, UICheckbox } from './libs/ui.js';

var Toolbar = function ( editor ) {

	var signals = editor.signals;
	var strings = editor.strings;

	var container = new UIPanel();
	container.setId( 'toolbar' );

	// select tool

	var selectIcon = document.createElement( 'img' );
	selectIcon.title = strings.getKey( 'toolbar/select' );
	selectIcon.src = 'images/cursor.svg';

	var select = new UIButton();
	// select.dom.className = 'Button';
	select.dom.appendChild( selectIcon );
	select.onClick( function () {

		signals.transformModeChanged.dispatch( 'select' );

	} );
	container.add( select );

	// translate / rotate / scale

	var translateIcon = document.createElement( 'img' );
	translateIcon.title = strings.getKey( 'toolbar/translate' );
	translateIcon.src = 'images/translate.svg';

	var translate = new UIButton();
	translate.dom.className = 'Button selected';
	translate.dom.appendChild( translateIcon );
	translate.onClick( function () {

		signals.transformModeChanged.dispatch( 'translate' );

	} );
	container.add( translate );

	var rotateIcon = document.createElement( 'img' );
	rotateIcon.title = strings.getKey( 'toolbar/rotate' );
	rotateIcon.src = 'images/rotate.svg';

	var rotate = new UIButton();
	rotate.dom.appendChild( rotateIcon );
	rotate.onClick( function () {

		signals.transformModeChanged.dispatch( 'rotate' );

	} );
	container.add( rotate );

	var scaleIcon = document.createElement( 'img' );
	scaleIcon.title = strings.getKey( 'toolbar/scale' );
	scaleIcon.src = 'images/scale.svg';

	var scale = new UIButton();
	scale.dom.appendChild( scaleIcon );
	scale.onClick( function () {

		signals.transformModeChanged.dispatch( 'scale' );

	} );
	container.add( scale );

	var local = new UICheckbox( false );
	local.dom.title = strings.getKey( 'toolbar/local' );
	local.onChange( function () {

		signals.spaceChanged.dispatch( this.getValue() === true ? 'local' : 'world' );

	} );
	container.add( local );

	//

	signals.transformModeChanged.add( function ( mode ) {

		select.dom.classList.remove( 'selected' );
		translate.dom.classList.remove( 'selected' );
		rotate.dom.classList.remove( 'selected' );
		scale.dom.classList.remove( 'selected' );

		switch ( mode ) {

			case 'select': select.dom.classList.add( 'selected' ); break;
			case 'translate': translate.dom.classList.add( 'selected' ); break;
			case 'rotate': rotate.dom.classList.add( 'selected' ); break;
			case 'scale': scale.dom.classList.add( 'selected' ); break;

		}

	} );

	return container;

};

export { Toolbar };
