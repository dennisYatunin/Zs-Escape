const PLATFORM_CX = 500, // x-coordinate of center of platform
PLATFORM_CY = 9800, // y-coordinate of center of platform
PLATFORM_H1 = 76.1046201299, // distance between center of platform and bottom
// of bicycle when platformAngle = 0 (90 - 13.8953798701)
PLATFORM_H2 = 16.1107812069, // distance between center of platform and bottom
// of bicycle when platformAngle = 180 (30.006161077 - 13.8953798701)
PLATFORM_L = 300; // half of distance across platform

var platformAngle = 0;

/*----------------------------- Platform Control -----------------------------*/

var svg = document.getElementById('canvas'),
platform = document.getElementById('platform'),
pointGrabbed = svg.createSVGPoint(),
pointDraggedTo = svg.createSVGPoint();

function change_platform_angle() {
	pointDraggedTo =
	pointDraggedTo.matrixTransform(svg.getScreenCTM().inverse());

	platformAngle +=
	Math.atan2(pointDraggedTo.y - PLATFORM_CY, pointDraggedTo.x - PLATFORM_CX) -
	Math.atan2(pointGrabbed.y - PLATFORM_CY, pointGrabbed.x - PLATFORM_CX);
	platform.setAttributeNS(
		null, 'transform',
		'rotate(' + platformAngle * 180 / Math.PI + ' ' + PLATFORM_CX + ' ' +
		PLATFORM_CY + ')'
		);

	pointGrabbed.x = pointDraggedTo.x;
	pointGrabbed.y = pointDraggedTo.y;
}

function drag_platform_mouse(evt) {
	pointDraggedTo.x = evt.clientX;
	pointDraggedTo.y = evt.clientY;
	change_platform_angle();
}

function drag_platform_touch(evt) {
	pointDraggedTo.x = evt.touches[0].clientX;
	pointDraggedTo.y = evt.touches[0].clientY;
	change_platform_angle();
}

function drop_platform_mouse(evt) {
	document.onmousemove = null;
	document.onmouseup = null;

	svg.style.cursor = 'url(\'static/hand1.cur\'), auto';
}

function drop_platform_touch(evt) {
	document.ontouchmove = null;
	document.ontouchend = null;
}

platform.addEventListener('mousedown', function (evt) {
	pointGrabbed.x = evt.clientX;
	pointGrabbed.y = evt.clientY;
	pointGrabbed =
	pointGrabbed.matrixTransform(svg.getScreenCTM().inverse());

	document.onmousemove = drag_platform_mouse;
	document.onmouseup = drop_platform_mouse;

	svg.style.cursor = 'url(\'static/hand3.cur\'), auto';
});

platform.addEventListener('touchstart', function (evt) {
	pointGrabbed.x = evt.touches[0].clientX;
	pointGrabbed.y = evt.touches[0].clientY;
	pointGrabbed =
	pointGrabbed.matrixTransform(svg.getScreenCTM().inverse());

	document.ontouchmove = drag_platform_touch;
	document.ontouchend = drop_platform_touch;
});

/*----------------------------- Zamansky Control -----------------------------*/

const ROLLING_FRICTION_COEF = 0.002
// typical rolling friction coefficient for a bicycle tire on concrete (unitless)
// http://www.engineeringtoolbox.com/rolling-friction-resistance-d_1303.html

var Z = {xPos: 0, yPos: 0, xVel: 0, yVel: 0, bikeAngle: 0, bikeAngleVel: 0, tireAngle: 0, curPower: 100};

