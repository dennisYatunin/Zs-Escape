/*--------------------- Important Variable and Constants ---------------------*/

var platformAngle = 0;

const PLATFORM_CRX = 500, PLATFORM_CRY = 9800;
// x- and y-coordinates of platform's center of rotation

/*----------------------------- Platform Control -----------------------------*/

var svg = document.getElementById('canvas'),
platform = document.getElementById('platform'),
pointGrabbed = svg.createSVGPoint(),
pointDraggedTo = svg.createSVGPoint();

function change_platform_angle() {
	pointDraggedTo =
	pointDraggedTo.matrixTransform(svg.getScreenCTM().inverse());

	platformAngle +=
	Math.atan2(pointDraggedTo.y - PLATFORM_CRY, pointDraggedTo.x - PLATFORM_CRX)
	- Math.atan2(pointGrabbed.y - PLATFORM_CRY, pointGrabbed.x - PLATFORM_CRX);
	platform.setAttributeNS(
		null, 'transform',
		'rotate(' + platformAngle * 180 / Math.PI + ' ' + PLATFORM_CRX + ' ' +
		PLATFORM_CRY + ')'
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

	svg.style.cursor = 'url(\'static/hand1.cur\'),auto'; // open palm
	platform.style.cursor = 'url(\'static/hand2.cur\'),auto'; // half-open palm
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

	svg.style.cursor = 'url(\'static/hand3.cur\'),auto'; // closed palm
	platform.style.cursor = 'url(\'static/hand3.cur\'),auto'; // closed palm
});

platform.addEventListener('touchstart', function (evt) {
	pointGrabbed.x = evt.touches[0].clientX;
	pointGrabbed.y = evt.touches[0].clientY;
	pointGrabbed =
	pointGrabbed.matrixTransform(svg.getScreenCTM().inverse());

	document.ontouchmove = drag_platform_touch;
	document.ontouchend = drop_platform_touch;
});

/*--------------------------------- Z Motion ---------------------------------*/

const PLATFORM_CX = 500, PLATFORM_CY = 9770.00308054,
// x- and y-coordinates of platform's center when platformAngle = 0
PLATFORM_H = 46.1077006684, PLATFORM_L = 300;
// half of platform's height and length

var dx, dy;
function circlePlatformColliding(cx, cy, r) {
	cx = cos(-platformAngle) * (cx - PLATFORM_CRX) -
	sin(-platformAngle) * (cy - PLATFORM_CRY) + PLATFORM_CRX;
	cy = sin(-platformAngle) * (cx - PLATFORM_CRX) +
	cos(-platformAngle) * (cy - PLATFORM_CRY) + PLATFORM_CRY;

	dx = Math.abs(cx - PLATFORM_CX);
	dy = Math.abs(cy - PLATFORM_CY);

	if (dx > PLATFORM_L + r) { return false; }
	if (dy > PLATFORM_H + r) { return false; }

	if (dx <= PLATFORM_L) { return true; }
	if (dy <= PLATFORM_H) { return true; }

	dx -= PLATFORM_L;
	dy -= PLATFORM_H;
	return dx * dx + dy * dy <= r * r;
}

const ROLLING_FRICTION_COEF = 0.002
// typical rolling friction coefficient for a bicycle tire on concrete (unitless)
// http://www.engineeringtoolbox.com/rolling-friction-resistance-d_1303.html

var Z = {xPos: 0, yPos: 0, xVel: 0, yVel: 0, bikeAngle: 0, bikeAngleVel: 0, tireAngle: 0, curPower: 100};