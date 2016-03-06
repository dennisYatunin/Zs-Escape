var platformAngle = 0;

/*----------------------------- Platform Control -----------------------------*/

var svg = document.getElementById('canvas'),
platform = document.getElementById('platform'),
pointGrabbed = svg.createSVGPoint(),
pointDraggedTo = svg.createSVGPoint();

function drag_platform(evt) {
	pointDraggedTo.x = evt.clientX;
	pointDraggedTo.y = evt.clientY;
	pointDraggedTo =
	pointDraggedTo.matrixTransform(svg.getScreenCTM().inverse());

	platformAngle +=
	Math.atan2(pointDraggedTo.y - 9800, pointDraggedTo.x - 500) -
	Math.atan2(pointGrabbed.y - 9800, pointGrabbed.x - 500);
	platform.setAttributeNS(
		null, 'transform',
		'rotate(' + platformAngle * 180 / Math.PI + ' 500 9800)'
		);

	pointGrabbed.x = pointDraggedTo.x;
	pointGrabbed.y = pointDraggedTo.y;
}

function drop_platform(evt) {
	document.onmousemove = null;
	document.onmouseup = null;
}

platform.addEventListener('mousedown', function (evt) {
	pointGrabbed.x = evt.clientX;
	pointGrabbed.y = evt.clientY;
	pointGrabbed =
	pointGrabbed.matrixTransform(svg.getScreenCTM().inverse());

	document.onmousemove = drag_platform;
	document.onmouseup = drop_platform;
});

/*----------------------------- Zamansky Control -----------------------------*/

const ROLLING_FRICTION_COEF = 0.002
// typical rolling friction coefficient for a bicycle tire on concrete (unitless)
// http://www.engineeringtoolbox.com/rolling-friction-resistance-d_1303.html

var Z = {xPos: 0, yPos: 0, xVel: 0, yVel: 0, bikeAngle: 0, bikeAngleVel: 0, tireAngle: 0, curPower: 100};

