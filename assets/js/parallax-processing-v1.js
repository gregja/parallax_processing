// Original version proposed by Kris Hadlock in the tutorial he published in 2012 :
//   http://www.ibm.com/developerworks/library/wa-parallaxprocessing/

$(document).ready(function() {
	var w = $("#parallax-canvas").width();
	var h = $("#parallax-canvas").height();

	var sky = new Image();
	sky.src = "assets/img/sky.jpg";
	var skydx = 2;  // Amount to move sky image
	var skyx = 0;  // x coord to slice sky image

	var mountains = new Image();
	mountains.src ="assets/img/mountains.png";
	var mountainsdx = 10; // Amount to move mountain image
	var mountainsx = 0; // x coord to slice mountain image

	var jeep = new Image();
	jeep.src ="assets/img/jeep.png";
	var jeepx = 100; // x coord of jeep image
	var jeepy = 210; // y coord of jeep image
	var jeepsx = 0; // x coord to slice jeep image
	var jeepsxWidth = 155; // x coord offset for slice jeep width

	var cntx =  $("#parallax-canvas")[0].getContext("2d");
	setInterval(draw, 10, cntx);

	$(window).keydown(function(evt) {
		switch (evt.keyCode) {
			case 37: // Left arrow
				if ((skyx + skydx) > skydx)
				  skyx -= skydx;
				else
				  skyx = w;

				if ((mountainsx + mountainsdx) > mountainsdx)
				  mountainsx -= mountainsdx;
				else
				  mountainsx = 398;

				if (jeepsx > 0)
					jeepsx -= jeepsxWidth;
				else
					jeepsx = (jeepsxWidth*2);

			break;

			case 39: // Right arrow
				if ((skyx + skydx) < (w - skydx))
				  skyx += skydx;
				else
				  skyx = 0;

				if ((mountainsx + mountainsdx) < (w - mountainsdx))
				  mountainsx += mountainsdx;
				else
				  mountainsx = 0;

				if (jeepsx < (jeepsxWidth*2))
				   jeepsx += jeepsxWidth;
				else
				   jeepsx = 0;

				break;
		}
	});

	function draw(_cntx) {
		drawRectangle(_cntx, 0, 0, w, h);
		_cntx.drawImage(sky, skyx, 0, 300, 300, 0, 0, w, 300);
		_cntx.drawImage(mountains, mountainsx, 0, 300, 300, 0, 0, w, 300);
		_cntx.drawImage(jeep, jeepsx, 0, jeepsxWidth, 60, jeepx, jeepy, 155, 60);
	}

	function drawRectangle(_cntx, x, y, w, h) {
		_cntx.beginPath();
		_cntx.rect(x,y,w,h);
		_cntx.closePath();
		_cntx.fill();
		_cntx.stroke();
	}
});
