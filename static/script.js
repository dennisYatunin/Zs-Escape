/*--------------------- Important Variable and Constants ---------------------*/

var platform = document.getElementById('platform'),
platformAngle = 0;

const PLATFORM_CRX = 500, PLATFORM_CRY = 9800,
// x- and y-coordinates of platform's center of rotation
PLATFORM_CX = 500, PLATFORM_CY = 9770.00308054,
// x- and y-coordinates of platform's center when platformAngle = 0
PLATFORM_L = 300, PLATFORM_H = 46.1077006684;
// half of platform's length and height

platform.setAttributeNS(null, 'x', PLATFORM_CRX);
platform.setAttributeNS(null, 'y', PLATFORM_CRY);


var Z = document.getElementById('Z');

const Z_L1 = 47.3567056205,
// horizontal distance between Z's leftmost point and his center of rotation
Z_L2 = 52.6432943795,
// horizontal distance between Z's rightmost point and his center of rotation
Z_H = 60.6010016694;
// vertical distance between Z's bottom-most point and his center of rotation

Z.setAttributeNS(null, 'x', PLATFORM_CX - Z_L2 / 2 + Z_L1 / 2);
Z.setAttributeNS(null, 'y', PLATFORM_CY - PLATFORM_H - Z_H);

/*----------------------------- Platform Control -----------------------------*/

var svg = document.getElementById('canvas'),
pointGrabbed = svg.createSVGPoint(),
pointDraggedTo = svg.createSVGPoint();

function change_platform_angle() {
	pointDraggedTo =
	pointDraggedTo.matrixTransform(svg.getScreenCTM().inverse());

	platformAngle +=
	Math.atan2(
		pointDraggedTo.y - PLATFORM_CRY, pointDraggedTo.x - PLATFORM_CRX
		) -
	Math.atan2(
		pointGrabbed.y - PLATFORM_CRY, pointGrabbed.x - PLATFORM_CRX
		);
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

var Zx = Z.getAttributeNS(null, 'x'), Zy = Z.getAttributeNS(null, 'y'),
// x- and y-coordinates of Z's center of mass (center of rotation)
Zxv = 0, Zyv = 0,
// x- and y-components of the velocity of Z's center of mass
Zangle = 0,
// Z's current angle relative to the horizontal
Zanglev = 0,
// Z's current angular velocity
Zpower = 0;
// Z's current maximum power output

const FRONT_WHEEL_DX = 31.3299944347, FRONT_WHEEL_DY = 39.4546466327,
BACK_WHEEL_DX = -26.0434056758, BACK_WHEEL_DY = 39.4546466327,
WHEEL_R = 20.0333889814;

var dx, dy;
function circlePlatformColliding(cx, cy, r) {
	dx = cx - PLATFORM_CRX;
	dy = cy - PLATFORM_CRY;

	cx = cos(-platformAngle) * dx - sin(-platformAngle) * dy + PLATFORM_CRX;
	cy = sin(-platformAngle) * dx + cos(-platformAngle) * dy + PLATFORM_CRY;

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

var Ffront, Fback, cx, cy, edgeColliding;
function platformPushZ() {
	Ffront = 0;
	cx = cos(Zangle) * FRONT_WHEEL_DX - sin(Zangle) * FRONT_WHEEL_DY + Zx;
	cy = sin(Zangle) * FRONT_WHEEL_DX + cos(Zangle) * FRONT_WHEEL_DY + Zy;
	if (circlePlatformColliding(cx, cy, WHEEL_R)) {

	}
}

const ROLLING_FRICTION_COEF = 0.002
// typical rolling friction coefficient for a bicycle tire on concrete (unitless)
// http://www.engineeringtoolbox.com/rolling-friction-resistance-d_1303.html

var Z = {xPos: 0, yPos: 0, xVel: 0, yVel: 0, bikeAngle: 0, bikeAngleVel: 0, tireAngle: 0, curPower: 100};