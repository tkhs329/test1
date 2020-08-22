const WEBSITE = (() => {

    let website = {},
        scroll = {},
        mouse = {},
        wheel = {},
        gl,
        vertex,
        fragment,
        imgArr = [];

    website.body = document.body;
    website.url = document.URL;
    website.winW = window.innerWidth;
    website.winH = window.innerHeight;
    website.breakPoint = 768;
    website.isDesktop = true;
    website.isFirst = true;
    website.animationFrame = null;

    if (website.breakPoint >= website.winW) {
        website.isDesktop = false;
    }

    const Utils = {

        loadFile(url, data, callback, errorCallback) {
            let request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.onreadystatechange = function() { if (request.readyState == 4) { if (request.status == 200) { callback(request.responseText, data) } else { errorCallback(url); } } };
            request.send(null);
        },

        loadFiles(urls, callback, errorCallback) {
            let numUrls = urls.length,
                numComplete = 0,
                result = [];

            function partialCallback(text, urlIndex) {
                result[urlIndex] = text;
                numComplete++;
                if (numComplete == numUrls) {
                    callback(result);
                }
            }
            for (let i = 0; i < numUrls; i++) { Utils.loadFile(urls[i], i, partialCallback, errorCallback); }
        },

        easing(start, end, multiplier) { return (1 - multiplier) * start + multiplier * end; }
    }

    const GL = () => {

        function Texture(el, i) {

            this.dom = el.img;
            this.i = i;
            this.currentScroll = scroll.currentY;

            this.texture = new THREE.Texture(this.dom);
            this.texture.needsUpdate = true;
            this.texture.minFilter = THREE.LinearFilter;

            this.textureL = new THREE.Texture(this.dom);
            this.textureL.needsUpdate = true;
            this.textureL.minFilter = THREE.LinearFilter;

            this.getPoint();
            this.getSize();
            this.addObjects();
            this.setMesh();
            this.setUniform();

            gl.group.add(this.mesh);
        }

        Texture.prototype.kill = function() {
            setTimeOut(() => {
                gl.scene.remove(this.mesh);
                this.geometry.dispose();
                this.material.dispose();
                this.texture.dispose();
            }, 400);
        }

        Texture.prototype.getPoint = function() {
            this.panelLen = 8;
            this.radius = website.winW * 1.35;

            this.step = (Math.PI * 2) / this.panelLen;

            this.x = Math.sin(this.i * -this.step) * this.radius;
            this.y = 0;
            this.z = Math.cos(this.i * -this.step) * this.radius;

            this.angle = Math.PI + -((Math.PI * 2) / this.panelLen * this.i);
        }


        Texture.prototype.getSize = function() {

            this.width = website.winW * 0.9;
            this.height = this.width;
            this.ratio = this.width / this.height;
            this.viewRatio = window.innerWidth / window.innerHeight;

        }

        Texture.prototype.getFullSize = function() {
            const fov = (gl.camera.fov * Math.PI) / 180;
            const height = Math.abs(gl.camera.position.z * Math.tan(fov / 2) * 2);
            return { width: height * gl.camera.aspect, height };
        }

        Texture.prototype.addObjects = function() {

            this.geometry = new THREE.PlaneBufferGeometry(1, 1, 18, 18);
            this.material = new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                uniforms: {
                    uTexture: { type: 't', value: null },
                    uRes: { type: 'v2', value: new THREE.Vector2(0.5, 0.5) },
                    uPlaneCenter: { value: new THREE.Vector2(0, 0) },
                    uMeshScale: { value: new THREE.Vector2(0, 0) },
                    uStrength: { type: 'f', value: 0 }
                },
                transparent: true,
                vertexShader: vertex,
                fragmentShader: fragment
            });

            this.mesh = new THREE.Mesh(this.geometry, this.material);
        }

        Texture.prototype.setMesh = function() {

            this.mesh.scale.set(this.width, this.height, this.width / 2);

            this.mesh.position.x = this.x;
            this.mesh.position.y = this.y;
            this.mesh.position.z = this.z;

            this.mesh.rotation.y = this.angle;
        }

        Texture.prototype.setUniform = function() {

            this.material.uniforms.uTexture.value = this.texture;
            this.material.uniforms.uTexture.value.needsUpdate = true;

            // this.material.uniforms.uRes.value.x = this.x;
            // this.material.uniforms.uRes.value.y = this.y;

            // this.material.uniforms.uMeshScale.value.x = this.width;
            // this.material.uniforms.uMeshScale.value.y = this.height;

            // this.material.uniforms.uScaleToFullSize.value.x = this.fullSize.width / this.width - 1;
            // this.material.uniforms.uScaleToFullSize.value.y = this.fullSize.height / this.height - 1;

        }

        Texture.prototype.updateUniform = function() {

            // this.material.uniforms.uPlaneCenter.value.x = this.mesh.position.x / this.width;
            // this.material.uniforms.uPlaneCenter.value.y = this.mesh.position.y / this.height;

            this.material.uniforms.uRes.value.x = this.x;
            this.material.uniforms.uRes.value.y = this.y;

            this.material.uniforms.uStrength.value = wheel.angle * 0.001;

            // this.material.uniforms.uRadius.value = 0.8 + scroll.strength;

            // this.material.uniforms.uStretchV.value.y = -(this.mesh.position.y / this.mesh.scale.y - 0.5);

        }

        Texture.prototype.render = function() {
            this.getSize();
            this.setMesh();
            this.updateUniform();
        }

        function Scene() {

            this.scene = new THREE.Scene();

            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });

            this.renderer.setPixelRatio(window.devicePixelRatio || 1);
            this.renderer.setSize(website.winW, website.winH);
            this.renderer.sortObjects = false;

            this.renderer.outputEncoding = THREE.sRGBEncoding;

            this.container = document.getElementById('c');
            this.container.appendChild(this.renderer.domElement);

            this.camera = new THREE.PerspectiveCamera(45, website.winW / website.winH, 1, 13000);
            this.cameraDistance = website.winW;
            this.camera.position.set(0, 0, this.cameraDistance);

            this.group = new THREE.Object3D();
            this.scene.add(this.group);

            this.zoom = -(website.winW * 6);

            this.param1 = {
                distance: 1
            };

            this.param2 = {
                rotate: 0
            };

            this.scaled = false;

            this.resize();
            this.wheel();
            this.render();

            window.addEventListener('mousedown', this.mousedown.bind(this));
            // window.addEventListener('resize', this.resize.bind(this));
        }

        Scene.prototype.mousedown = function() {

            if (!this.scaled) {
                this.scaled = true;
                let zoomIn = anime({
                    targets: [this.param1, this.param2],
                    distance: [1, 0],
                    // rotate: [0, 0.2, 0],
                    duration: 2000,
                    easing: [.74, 0, 0, .99]
                });
            } else {
                this.scaled = false;
                let zoomOut = anime({
                    targets: [this.param1, this.param2],
                    distance: [0, 1],
                    // rotate: [0.2, 0, 0.2],
                    duration: 2000,
                    easing: [.74, 0, 0, .99]
                });
            }
        }

        Scene.prototype.wheel = function() {

            const indicator = new WheelIndicator({
                elem: window,
                callback: function(e) {
                    wheel.direction = e.direction;
                }
            });

            $(document).off(wheel.wheelEvent);

            wheel.wheelEvent = 'onwheel' in document ? 'wheel' : 'onmousewheel' in document ? 'mousewheel' : 'DOMMouseScroll';
            wheel.delta = null;
            wheel.velocity = 0.08;
            wheel.angle = 0;

            $(document).on(wheel.wheelEvent, function(e) {
                wheel.delta = e.originalEvent.deltaY ? -(e.originalEvent.deltaY) : e.originalEvent.wheelDelta ? e.originalEvent.wheelDelta : -(e.originalEvent.detail);
            });
        }

        Scene.prototype.resize = function() {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }

        Scene.prototype.render = function() {

            wheel.angle = Utils.easing(wheel.angle, wheel.delta, wheel.velocity);
            if (wheel.angle > -1.5 || 1.5 > wheel.angle) { wheel.delta = 0; };

            this.camera.rotation.x = this.param2.rotate;

            this.camera.rotation.z = (wheel.angle * 0.0008) + (-0.4 * this.param1.distance);

            this.group.rotation.x = 0.4 * this.param1.distance;
            this.group.rotation.y += 0.0015 - (wheel.angle * 0.001);

            this.group.position.z = this.zoom * this.param1.distance;

            for (let i = 0; i < imgArr.length; i++) {
                imgArr[i].render();
            }

            this.renderer.render(this.scene, this.camera);
        }


        // ---- //

        let IMAGES;

        const preloadImages = new Promise((resolve, reject) => {
            imagesLoaded(document.querySelectorAll('img'), { background: true }, resolve);
        });

        preloadImages.then(target => { IMAGES = target.images; });

        Utils.loadFiles(['/f1/resource/js/_shader/sh.vert', '/f1/resource/js/_shader/sh.frag'], function(shaderText) {

            vertex = shaderText[0];
            fragment = shaderText[1];

            Promise.all([preloadImages]).then(() => {
                for (let i = 0; i < IMAGES.length; i++) {
                    if (IMAGES[i].img.classList.contains('gl-img')) {
                        imgArr.push(new Texture(IMAGES[i], i));
                    }
                }
            });

            return gl = new Scene();
        });
    };

    const App = {

        init() {
            GL();
            App.updates();
        },

        updates() {
            website.animationFrame = window.requestAnimationFrame(App.updates);

            if (gl === undefined) { return };
            gl.render();
        }
    }

    App.init();

})();