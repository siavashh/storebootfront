<?php
add_action( 'wp_enqueue_scripts', 'enqueue_parent_styles' );

function enqueue_parent_styles() {
	wp_enqueue_style( 'parent-style', get_template_directory_uri() . '/style.css' );
}

function _sbftheme_assets() {
	wp_enqueue_style( '_sbftheme-stylesheet', get_stylesheet_directory_uri() . '/dist/css/main.css', array(), '1.0.0', 'all' );
	wp_enqueue_script( '_sbftheme-scripts', get_stylesheet_directory_uri() . '/dist/js/bundle.js', array(), '1.0.0', true );
}

add_action( 'wp_enqueue_scripts', '_sbftheme_assets' );