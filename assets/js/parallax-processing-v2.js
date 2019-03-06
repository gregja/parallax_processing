// Version written by Gregory Jarrige in 2019, implementing some of the best practices of 2019
// like API Promise, function Path2D, strict mode, IIFE, etc.
// plus :
// - the detection of the click on the canvas and on the jeep (for jumping)
// - buttons for moving in the 4 directions
// - implementation of one of the easing function of Robert Penner (for jumping)

window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame || //Chromium
            window.webkitRequestAnimationFrame || //Webkit
            window.mozRequestAnimationFrame || //Mozilla Geko
            window.oRequestAnimationFrame || //Opera Presto
            window.msRequestAnimationFrame || //IE Trident?
            function(callback, element) { //Fallback function
                window.setTimeout(callback, 10);
            }
})();

var parallaxModule = (function () {
    "use strict";

    var canvasElement = null; // canvas generated in the "init" function
    var cntx = null; // cntx 2D
    var mousePos = {x:0, y:0}; // coords of the mouse (to detect collision)

    var screen = {w:400, h:300};
    var tween = {};  // used with easing function (when the jeep jumps)
    tween.active = false;

    var sky = {};
    var mountains = {};
    var jeep = {};

    sky.dx = 2;  // Amount to move sky image
    sky.x = 0;  // x coord to slice sky image
    sky.y = 0;  // y coord to slice sky image
    sky.img = 'later (with promise)';

    mountains.dx = 10; // Amount to move mountain image
    mountains.x = 0; // x coord to slice mountain image
    mountains.y = 0; // x coord to slice mountain image
    mountains.img = 'later (with promise)';

    jeep.x = 100; // x coord of jeep image
    jeep.y = 210; // y coord of jeep image
    jeep.basey = jeep.y; // for repositioning the jeep after a jump
    jeep.sx = 0; // x coord to slice jeep image
    jeep.sy = 0; // x coord to slice jeep image
    jeep.width = 465; // width of the asset in pixels
    jeep.xsplit = jeep.width / 3; // asset splitted in 3 parts (3 pictures of jeep in the image)
    jeep.sxWidth = jeep.xsplit; // x coord offset for slice jeep width
    jeep.height = 60; // height of the asset in pixels
    jeep.img = 'later (with promise)';
    jeep.jump = false;

    const assets_path = 'assets/img/';

    var assets = [];
    assets.push({name: "sky", path: assets_path+"sky.jpg"})
    assets.push({name: "mountains", path: assets_path+"mountains.png"})
    assets.push({name: "jeep", path: assets_path+"jeep.png"})

    // Example of object using the new "Path2D" function
    var triangle = {};
    triangle.x = screen.w + 10;
    triangle.y = screen.h - 20;
    triangle.dx = 2;
    triangle.graph = new Path2D();
    triangle.graph.moveTo( 0,  0 );
    triangle.graph.lineTo(-15, 25);
    triangle.graph.lineTo( 15, 25);
    triangle.graph.closePath();
    // Documentation about the Path2D function :
    //   https://developer.mozilla.org/en-US/docs/Web/API/Path2D
    //   https://developer.mozilla.org/fr/docs/Tutoriel_canvas/Formes_g%C3%A9om%C3%A9triques

    // Load images with Promises, and start the sketch when all the images are loaded
    function loadImages (src) {
        let pics = [];
        src.forEach((item) => {
            pics.push(new Promise((resolve) => {
                let img = new Image();
                img.setAttribute('data-name', item.name);
                img.crossOrigin = "Anonymous";
                img.onload = () => resolve(img);
                img.src = item.path;
            }));
        });
        return Promise.all(pics);
    }

    function init() {
        var domtarget = document.getElementById('game');
        if (!domtarget) {
            console.error('Div "game" not found in the DOM');
            return;
        }

        canvasElement = document.createElement('canvas');
        canvasElement.setAttribute('widht', screen.w);
        canvasElement.setAttribute('height', screen.h);
        domtarget.appendChild(canvasElement);

        cntx = canvasElement.getContext('2d');

        // to catch the arrow keys, use the "keydown" event, not the "keypress" event
        document.addEventListener('keydown', keyPressed, false);
        document.addEventListener('keyup', keyReleased, false);

        canvasElement.addEventListener("mousedown",function(evt){
          mousePos = getMousePos(evt);
            if (findJeepSelected()) {
            jeep.jump = true;
          }
        })

        // Documentation about touch events :
        //    https://developer.mozilla.org/fr/docs/Web/Guide/DOM/Events/Touch_events
        canvasElement.addEventListener("touchstart",function(evt){
            mousePos = getTouchPos(evt);
            findJeepSelected();
            if (findJeepSelected()) {
             	jeep.jump = true;
            }
        })

        let new_line = document.createElement('br');
        domtarget.appendChild(new_line);

        createButton(domtarget, '<< LEFT', (evt)=>{
            moveToTheLeft();
        });
        createButton(domtarget, '^ UP', (evt)=>{
            moveToTheTop();
        });
        createButton(domtarget, 'v DOWN', (evt)=>{
            moveToTheBottom();
        });
        createButton(domtarget, '>> RIGHT', (evt)=>{
            moveToTheRight();
        });

        loadImages(assets).then((images) => {
            images.forEach(item => {
                let name = item.getAttribute('data-name');
                switch(name) {
                    case 'sky': {
                        sky.img = item;
                        break;
                    }
                    case 'mountains': {
                        mountains.img = item;
                        break;
                    }
                    case 'jeep': {
                        jeep.img = item;
                        break;
                    }
                }
            })
            // all images are loaded, so it's time to draw the canvas
            draw();
        });

    }

    function drawRectangle(x, y, w, h) {
        let frame = new Path2D();
        frame.rect(x, y, w, h);
        cntx.fill(frame);
        cntx.stroke(frame);
    }

    function draw() {
        drawRectangle(0, 0, screen.w, screen.h);

        if (jeep.jump) {
            console.log('jump !!');
            jeep.jump = false;
            tween.active = true;
            tween.begin = jeep.basey-50;
            tween.finish = jeep.basey;
            tween.change = tween.finish - tween.begin;
            tween.duration = 30;
            tween.time = 0;
        }
        if (tween.active == true) {
            jeep.y = easeInOutElastic (tween.time++, tween.begin, tween.change, tween.duration);
            if (tween.time > tween.duration) {
              tween.active = false;
            }
        }

        // Documentation about the "drawImage" function :
        //   https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingcntx2D/drawImage
        cntx.drawImage(sky.img, sky.x, sky.y, screen.h, screen.h, 0, 0, screen.w, screen.h);
        cntx.drawImage(mountains.img, mountains.x, mountains.y, screen.h, screen.h, 0, 0, screen.w, screen.h);
        cntx.drawImage(jeep.img, jeep.sx, jeep.sy, jeep.sxWidth, jeep.height, jeep.x, jeep.y, jeep.xsplit, jeep.height);

        if (triangle.x >= 0 || triangle.x+100 <= screen.w) {
          cntx.save();
          cntx.translate(triangle.x, triangle.y);
          cntx.scale( 0.5, 0.5 );
          // the outline
          cntx.lineWidth = 5;
          cntx.strokeStyle = "rgba(102, 102, 102, 1)";
          cntx.stroke(triangle.graph);
          // the fill color
          cntx.fillStyle = "rgba(255, 204, 0, 1)";
          cntx.fill(triangle.graph);
          cntx.restore();
        }

        window.requestAnimationFrame(function() {
            draw();
        });

    }

    function moveToTheLeft() {
        if ((sky.x + sky.dx) > sky.dx) {
            sky.x -= sky.dx;
        } else {
            sky.x = screen.w;
        }

        if ((mountains.x + mountains.dx) > mountains.dx) {
            mountains.x -= mountains.dx;
        } else {
            mountains.x = 398;
        }

        if (jeep.sx > 0) {
            jeep.sx -= jeep.sxWidth;
        } else {
            jeep.sx = (jeep.sxWidth * 2);
        }

        triangle.x += triangle.dx;
    }

    function moveToTheRight() {
        if ((sky.x + sky.dx) < (screen.w - sky.dx)) {
            sky.x += sky.dx;
        } else {
            sky.x = 0;
        }

        if ((mountains.x + mountains.dx) < (screen.w - mountains.dx)) {
            mountains.x += mountains.dx;
        } else {
            mountains.x = 0;
        }

        if (jeep.sx < (jeep.sxWidth * 2)) {
            jeep.sx += jeep.sxWidth;
        } else {
            jeep.sx = 0;
        }

        triangle.x -= triangle.dx;
    }

    function moveToTheBottom() {
        jeep.y += 10;
    }

    function moveToTheTop() {
        jeep.y -= 10;
    }

    function findJeepSelected() {
        // calculate the current coords of the jeep with : jeep.x, jeep.y, jeep.height, jeep.xsplit
        if (mousePos.x >= jeep.x && mousePos.x <= jeep.x+jeep.xsplit) {
            if (mousePos.y >= jeep.y && mousePos.y <= jeep.y + jeep.height) {
                return true;
            }
        }
        return false;
    }

    function keyPressed (e) {
        e.preventDefault();

        const DOWN_ARROW = 40;
        const LEFT_ARROW = 37;
        const RIGHT_ARROW = 39;
        const UP_ARROW = 38;
        const BACKSPACE = 8;

        // Documentation about keyboard events :
        //    https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key

        // If you want compatibility with a large panel of browsers, you must use the code below
        switch (e.keyCode) {
            case LEFT_ARROW:{
                moveToTheLeft();
                break;
            }
            case RIGHT_ARROW:{
                moveToTheRight();
                break;
            }
            case UP_ARROW:{
                moveToTheTop();
                break;
            }
            case DOWN_ARROW:{
                moveToTheBottom();
                break;
            }
        }

        // If you code only for modern browsers, you can simplifiy by using the code below :
        /*
        switch (e.key) {
            case "ArrowLeft":{
                moveToTheLeft();
                break;
            }
            case "ArrowRight":{
                moveToTheRight();
                break;
            }
            case "ArrowUp":{
                moveToTheTop();
                break;
            }
            case "ArrowDown":{
                moveToTheBottom();
                break;
            }
        }
        */
    };

    function keyReleased (e) {
        e.preventDefault();
        // TODO : find something to implement here ;)
    }

    function getMousePos(evt) {
        var rect = canvasElement.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function getTouchPos(evt) {
        var rect = canvasElement.getBoundingClientRect();
        return {
            x: evt.touches[0].clientX - rect.left,
            y: evt.touches[0].clientY - rect.top
        };
    }

    /**
     * One of the easing functions of Robert Penner
     *    http://robertpenner.com/easing/
     *    http://robertpenner.com/easing/penner_chapter7_tweening.pdf
     * Parameters :
     *   t = time
     *   b = beginning position
     *   c = total change in position
     *   d = duration of the tween
     */
    function easeInOutElastic (t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b;
        return -c/2 * ((--t)*(t-2) - 1) + b;
    }

    function createButton(domtarget, name, fnc) {
        let button = document.createElement('button');
        let txt = document.createTextNode(name);
        button.appendChild(txt);
        domtarget.appendChild(button);

        button.addEventListener('click', fnc, false);
        button.addEventListener('touchstart', fnc, false);
    }

    // Declare here public functions and constants (the items not declared here are private)
    return {
        init: init
    };
})();
