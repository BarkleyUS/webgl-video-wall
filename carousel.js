// Carousel
// =====================================================
//

function Carousel(videos) {
    // Initialize and configure the carousel
    this.videoDimensions = {
        width: 1024,
        height: 1024
    };
    this.sphereDepth = 6000;
    this.sphereSegments = {
        width: 50,
        height: 50
    };
    this.sphereFaces = this.sphereSegments.width * this.sphereSegments.height;
    this.initialCameraPosition = 1500;

    // Set up the scene
    this.renderer = this.initRenderer();
    this.scene = this.initScene();
    this.camera = this.initCamera(this.sphereDepth, this.initialCameraPosition);

    // // Set up videos and panes
    this.videoPanes = this.initVideoPanes(videos, this.videoDimensions, this.sphereSegments);
    this.materials = this.initMaterials(this.videoPanes, this.sphereFaces);

    // // Create the sphere
    this.sphere = this.initSphereMesh(this.sphereDepth, this.sphereSegments, this.materials);
}

Carousel.prototype.initRenderer = function() {
    // Set up the WebGL renderer
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    return renderer;
};

Carousel.prototype.initScene = function() {
    // Create the scene
    return new THREE.Scene();
};

Carousel.prototype.initCamera = function(depth, position) {
    // Set up the camera
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, depth);
    camera.position.z = position;
    return camera;
};

Carousel.prototype.initMaterials = function(videoPanes, faces) {
    // Load all of the video pane materials to apply to the sphere mesh
    var materials = [];
    for (i=0; i < videoPanes.length; i++) {
        materials.push(videoPanes[i].material);
    }
    return materials;
};

Carousel.prototype.initSphereMesh = function(sphereDepth, sphereSegments, materials) {
    // Create the spherical mesh
    var geometry = new THREE.SphereGeometry(sphereDepth/2, sphereSegments.width, sphereSegments.height);
    for (var i=0; i < geometry.faces.length; i++) {
        geometry.faces[i].materialIndex = i % materials.length;
    }
    var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
    return mesh;
};

Carousel.prototype.initVideoPanes = function(videos, dimensions, segments) {
    // Create video panes with calculated positions for the list of videos
    var videoPanes = [];

    for (var i=0; i < videos.length; i++) {
        var video = videos[i];
        var videoPane = new VideoPane(
            video,
            dimensions,
            segments
        );
        videoPanes.push(videoPane);
    }

    return videoPanes;
};

Carousel.prototype.setupScene = function() {
    // Set up the initial scene and add it to the dom
    this.sphere.position.z = this.sphereDepth/2;
    this.scene.add(this.sphere);
    document.body.appendChild(this.renderer.domElement);
};

Carousel.prototype.animate = function() {
    // Animate a frame of the carousel
    var obj = this;
    requestAnimationFrame(function() {
        return obj.animate();
    });

    // Check each video for updates
    for (var i=0; i < obj.videoPanes.length; i++) {
        var videoPane = obj.videoPanes[i];
        if (videoPane.video.readyState === videoPane.video.HAVE_ENOUGH_DATA && videoPane.lastDrawTime !== videoPane.video.currentTime) {
            videoPane.context.drawImage(videoPane.video, 0, 0, obj.videoDimensions.width, obj.videoDimensions.height);
            videoPane.lastDrawTime = videoPane.video.currentTime;
        }
        videoPane.texture.needsUpdate = true;
    }

    // Rotate when videos aren't playing
    this.sphere.rotation.y -= 0.0002;

    // Render the scene
    this.renderer.render(obj.scene, obj.camera);
};


// VideoPane
// =====================================================
//

function VideoPane(video, dimensions, segments) {
    // Initialize video and position
    this.video = video;
    this.lastDrawTime = -1;

    // Set up material
    this.canvas = this.initCanvas(dimensions.width, dimensions.height);
    this.context = this.initContext(this.canvas);
    this.texture = this.initTexture(this.canvas, segments);
    this.material = this.initMaterial(this.texture);
}

VideoPane.prototype.initCanvas = function(width, height) {
    // Set up the canvas
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

VideoPane.prototype.initContext = function(canvas) {
    // Style initial context
    var context = this.canvas.getContext('2d');
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    return context;
};

VideoPane.prototype.initTexture = function(canvas, segments) {
    // Create a repeating texture from the canvas
    var texture = new THREE.Texture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(segments.width, segments.height);
    return texture;
};

VideoPane.prototype.initMaterial = function(texture) {
    // Create basic material to apply to the sphere
    var material = new THREE.MeshBasicMaterial({
        map: texture
    });
    material.side = THREE.BackSide;
    return material;
};
