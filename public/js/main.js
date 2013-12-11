
// Emulate hover on tablets and smartphones
$( ".ch-item" ).click(function(e) {
 	$(this).toggleClass( "flipped" );
 	e.preventDefault();
});