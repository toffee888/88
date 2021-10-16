AFRAME.registerComponent('model-viewer', {
  schema: {
    gltfModel: {default: ''},
    title: {default: ''},
    uploadUIEnabled: {default: true}
  },
  init: function () {
    var el = this.el;

    el.setAttribute('renderer', {colorManagement: true});
    el.setAttribute('cursor', {rayOrigin: 'mouse', fuse: false});
    el.setAttribute('webxr', {optionalFeatures: 'hit-test, local-floor'});
    el.setAttribute('raycaster', {objects: '.raycastable'});

    this.onModelLoaded = this.onModelLoaded.bind(this);

    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);

    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    this.onMouseDownLaserHitPanel = this.onMouseDownLaserHitPanel.bind(this);
    this.onMouseUpLaserHitPanel = this.onMouseUpLaserHitPanel.bind(this);

    this.onOrientationChange = this.onOrientationChange.bind(this);

    this.initCameraRig();
    this.initEntities();


    // Disable context menu on canvas when pressing mouse right button;
    this.el.sceneEl.canvas.oncontextmenu = function (evt) { evt.preventDefault(); };

    window.addEventListener('orientationchange', this.onOrientationChange);

    // VR controls.
    this.laserHitPanelEl.addEventListener('mousedown', this.onMouseDownLaserHitPanel);
    this.laserHitPanelEl.addEventListener('mouseup', this.onMouseUpLaserHitPanel);


    // Mouse 2D controls.
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('wheel', this.onMouseWheel);

    // Mobile 2D controls.
    document.addEventListener('touchend', this.onTouchEnd);
    document.addEventListener('touchmove', this.onTouchMove);


    this.modelEl.addEventListener('model-loaded', this.onModelLoaded);
  },

  initUploadInput: function () {

    if (AFRAME.utils.device.checkARSupport()) {
      css += '@media only screen and (max-width: 800px) {' +
      '.a-upload-model-input {width: 60%;}}';
    }

    inputEl.value = inputDefaultValue;

    uploadContainerEl.appendChild(inputEl);
    uploadContainerEl.appendChild(submitButtonEl);

    this.el.sceneEl.appendChild(uploadContainerEl);
  },

  update: function () {
    if (!this.data.gltfModel) { return; }
    this.modelEl.setAttribute('gltf-model', this.data.gltfModel);
  },

  initCameraRig: function () {
    var cameraRigEl = this.cameraRigEl = document.createElement('a-entity');
    var cameraEl = this.cameraEl = document.createElement('a-entity');
    var rightHandEl = this.rightHandEl = document.createElement('a-entity');
    var leftHandEl = this.leftHandEl = document.createElement('a-entity');

    cameraEl.setAttribute('camera', {fov: 60});
    cameraEl.setAttribute('look-controls', {
      magicWindowTrackingEnabled: false,
      mouseEnabled: false,
      touchEnabled: false
    });

    rightHandEl.setAttribute('rotation', '0 90 0');
    rightHandEl.setAttribute('laser-controls', {hand: 'right'});
    rightHandEl.setAttribute('raycaster', {objects: '.raycastable'});
    rightHandEl.setAttribute('line', {color: '#118A7E'});

    leftHandEl.setAttribute('rotation', '0 90 0');
    leftHandEl.setAttribute('laser-controls', {hand: 'right'});
    leftHandEl.setAttribute('raycaster', {objects: '.raycastable'});
    leftHandEl.setAttribute('line', {color: '#118A7E'});

    cameraRigEl.appendChild(cameraEl);
    cameraRigEl.appendChild(rightHandEl);
    cameraRigEl.appendChild(leftHandEl);

    this.el.appendChild(cameraRigEl);
  },

  initEntities: function () {
    // Container for our entities to keep the scene clean and tidy.
    var containerEl = this.containerEl = document.createElement('a-entity');
    // Plane used as a hit target for laser controls when in VR mode
    var laserHitPanelEl = this.laserHitPanelEl = document.createElement('a-entity');
    // Models are often not centered on the 0,0,0.
    // We will center the model and rotate a pivot.
    var modelPivotEl = this.modelPivotEl = document.createElement('a-entity');
    // This is our glTF model entity.
    var modelEl = this.modelEl = document.createElement('a-entity');
    // Shadow blurb for 2D and VR modes. Scaled to match the size of the model.
    var shadowEl = this.shadowEl = document.createElement('a-entity');
    // Real time shadow only used in AR mode.
    var arShadowEl = this.arShadowEl = document.createElement('a-entity');
    // The title / legend displayed above the model.
    var titleEl = this.titleEl = document.createElement('a-entity');
    // Reticle model used to position the model in AR mode.
    var reticleEl = this.reticleEl = document.createElement('a-entity');
    // Scene ligthing.
    var lightEl = this.lightEl = document.createElement('a-entity');
    var sceneLightEl = this.sceneLightEl = document.createElement('a-entity');

    sceneLightEl.setAttribute('light', {
      type: 'hemisphere',
      intensity: 1
    });

    modelPivotEl.id = 'modelPivot';

    this.el.appendChild(sceneLightEl);

    reticleEl.setAttribute('gltf-model', '#reticle');
    reticleEl.setAttribute('scale', '0.8 0.8 0.8');
    reticleEl.setAttribute('ar-hit-test', {targetEl: '#modelPivot'});
    reticleEl.setAttribute('visible', 'false');

    modelEl.id = 'model';

    laserHitPanelEl.id = 'laserHitPanel';
    laserHitPanelEl.setAttribute('position', '0 0 -10');
    laserHitPanelEl.setAttribute('geometry', 'primitive: plane; width: 30; height: 20');
    laserHitPanelEl.setAttribute('material', 'color: red');
    laserHitPanelEl.setAttribute('visible', 'false');
    laserHitPanelEl.classList.add('raycastable');

    this.containerEl.appendChild(laserHitPanelEl);

    modelEl.setAttribute('rotation', '0 -30 0');
    modelEl.setAttribute('animation-mixer', '');
    modelEl.setAttribute('shadow', 'cast: true; receive: false');

    modelPivotEl.appendChild(modelEl);

    shadowEl.setAttribute('rotation', '-90 -30 0');
    shadowEl.setAttribute('geometry', 'primitive: plane; width: 1.0; height: 1.0');
    shadowEl.setAttribute('material', 'src: #shadow; transparent: true; opacity: 0.001');
    shadowEl.setAttribute('hide-on-enter-ar', '');

    modelPivotEl.appendChild(shadowEl);

    arShadowEl.setAttribute('rotation', '-90 0 0');
    arShadowEl.setAttribute('geometry', 'primitive: plane; width: 30.0; height: 30.0');
    arShadowEl.setAttribute('shadow', 'recieve: true');
    arShadowEl.setAttribute('ar-shadows', 'opacity: 1');
    arShadowEl.setAttribute('visible', 'false');

    modelPivotEl.appendChild(arShadowEl);

    titleEl.id = 'title';
    titleEl.setAttribute('text', 'value: ' + this.data.title + '; width: 6');
    titleEl.setAttribute('hide-on-enter-ar', '');
    titleEl.setAttribute('visible', 'false');

    this.containerEl.appendChild(titleEl);

    lightEl.id = 'light';
    lightEl.setAttribute('position', '-2 4 2');
    lightEl.setAttribute('light', {
      type: 'directional',
      castShadow: true,
      shadowMapHeight: 1024,
      shadowMapWidth: 1024,
      shadowCameraLeft: -7,
      shadowCameraRight: 5,
      shadowCameraBottom: -5,
      shadowCameraTop: 5,
      intensity: 0.5,
      target: 'modelPivot'
    });

    this.containerEl.appendChild(lightEl);
    this.containerEl.appendChild(modelPivotEl);

    this.el.appendChild(containerEl);
    this.el.appendChild(reticleEl);
  },


  onMouseWheel: function (evt) {
    var modelPivotEl = this.modelPivotEl;
    var modelScale = this.modelScale || modelPivotEl.object3D.scale.x;
    modelScale -= evt.deltaY / 100;
    modelScale = Math.min(Math.max(0.8, modelScale), 2.0);
    // Clamp scale.
    modelPivotEl.object3D.scale.set(modelScale, modelScale, modelScale);
    this.modelScale = modelScale;
  },

  onMouseDownLaserHitPanel: function (evt) {
    var cursorEl = evt.detail.cursorEl;
    var intersection = cursorEl.components.raycaster.getIntersection(this.laserHitPanelEl);
    if (!intersection) { return; }
    cursorEl.setAttribute('raycaster', 'lineColor', 'white');
    this.activeHandEl = cursorEl;
    this.oldHandX = undefined;
    this.oldHandY = undefined;
  },

  onMouseUpLaserHitPanel: function (evt) {
    var cursorEl = evt.detail.cursorEl;
    if (cursorEl === this.leftHandEl) { this.leftHandPressed = false; }
    if (cursorEl === this.rightHandEl) { this.rightHandPressed = false; }
    cursorEl.setAttribute('raycaster', 'lineColor', 'white');
    if (this.activeHandEl === cursorEl) { this.activeHandEl = undefined; }
  },

  onOrientationChange: function () {
    if (AFRAME.utils.device.isLandscape()) {
      this.cameraRigEl.object3D.position.z -= 1;
    } else {
      this.cameraRigEl.object3D.position.z += 1;
    }
  },

  tick: function () {
    var modelPivotEl = this.modelPivotEl;
    var intersection;
    var intersectionPosition;
    var laserHitPanelEl = this.laserHitPanelEl;
    var activeHandEl = this.activeHandEl;
    if (!this.el.sceneEl.is('vr-mode')) { return; }
    if (!activeHandEl) { return; }
    intersection = activeHandEl.components.raycaster.getIntersection(laserHitPanelEl);
    if (!intersection) {
      activeHandEl.setAttribute('raycaster', 'lineColor', 'white');
      return;
    }
    activeHandEl.setAttribute('raycaster', 'lineColor', '#007AFF');
    intersectionPosition = intersection.point;
    this.oldHandX = this.oldHandX || intersectionPosition.x;
    this.oldHandY = this.oldHandY || intersectionPosition.y;

    modelPivotEl.object3D.rotation.y -= (this.oldHandX - intersectionPosition.x) / 4;
    modelPivotEl.object3D.rotation.x += (this.oldHandY - intersectionPosition.y) / 4;

    this.oldHandX = intersectionPosition.x;
    this.oldHandY = intersectionPosition.y;
  },

  onTouchMove: function (evt) {
    if (evt.touches.length === 1) { this.onSingleTouchMove(evt); }
    if (evt.touches.length === 2) { this.onPinchMove(evt); }
  },

  onSingleTouchMove: function (evt) {
    var dX;
    var dY;
    var modelPivotEl = this.modelPivotEl;
    this.oldClientX = this.oldClientX || evt.touches[0].clientX;
    this.oldClientY = this.oldClientY || evt.touches[0].clientY;

    dX = this.oldClientX - evt.touches[0].clientX;
    dY = this.oldClientY - evt.touches[0].clientY;

    modelPivotEl.object3D.rotation.y -= dX / 200;
    this.oldClientX = evt.touches[0].clientX;

    modelPivotEl.object3D.rotation.x -= dY / 100;

    // Clamp x rotation to [-90,90]
    modelPivotEl.object3D.rotation.x = Math.min(Math.max(-Math.PI / 2, modelPivotEl.object3D.rotation.x), Math.PI / 2);
    this.oldClientY = evt.touches[0].clientY;
  },

  onTouchEnd: function (evt) {
    this.oldClientX = undefined;
    this.oldClientY = undefined;
    if (evt.touches.length < 2) { this.oldDistance = undefined; }
  },

  onMouseUp: function (evt) {
    this.leftRightButtonPressed = false;
    if (evt.buttons === undefined || evt.buttons !== 0) { return; }
    this.oldClientX = undefined;
    this.oldClientY = undefined;
  },

  onMouseMove: function (evt) {
    if (this.leftRightButtonPressed) {
      this.dragModel(evt);
    } else {
      this.rotateModel(evt);
    }
  },

  dragModel: function (evt) {
    var dX;
    var dY;
    var modelPivotEl = this.modelPivotEl;
    if (!this.oldClientX) { return; }
    dX = this.oldClientX - evt.clientX;
    dY = this.oldClientY - evt.clientY;
    modelPivotEl.object3D.position.y += dY / 200;
    modelPivotEl.object3D.position.x -= dX / 200;
    this.oldClientX = evt.clientX;
    this.oldClientY = evt.clientY;
  },

  rotateModel: function (evt) {
    var dX;
    var dY;
    var modelPivotEl = this.modelPivotEl;
    if (!this.oldClientX) { return; }
    dX = this.oldClientX - evt.clientX;
    dY = this.oldClientY - evt.clientY;
    modelPivotEl.object3D.rotation.y -= dX / 100;
    modelPivotEl.object3D.rotation.x -= dY / 200;

    // Clamp x rotation to [-90,90]
    modelPivotEl.object3D.rotation.x = Math.min(Math.max(-Math.PI / 2, modelPivotEl.object3D.rotation.x), Math.PI / 2);

    this.oldClientX = evt.clientX;
    this.oldClientY = evt.clientY;
  },

  onModelLoaded: function () {
    this.centerAndScaleModel();
  },

  centerAndScaleModel: function () {
    var box;
    var size;
    var center;
    var scale;
    var modelEl = this.modelEl;
    var shadowEl = this.shadowEl;
    var gltfObject = modelEl.getObject3D('mesh');

    // Reset position and scales.
    modelEl.object3D.position.set(0, 0, 0);
    modelEl.object3D.scale.set(0.7, 0.7, 0.7);
    this.cameraRigEl.object3D.position.z = -3.0;

    // Calculate model size.
    modelEl.object3D.updateMatrixWorld();
    box = new THREE.Box3().setFromObject(gltfObject);
    size = box.getSize(new THREE.Vector3());

    // Calculate scale factor to resize model to human scale.
    scale = 1.6 / size.y;
    scale = 2.0 / size.x < scale ? 2.0 / size.x : scale;
    scale = 2.0 / size.z < scale ? 2.0 / size.z : scale;

    modelEl.object3D.scale.set(scale, scale, scale);

    // Center model at (0, 0, 0).
    modelEl.object3D.updateMatrixWorld();
    box = new THREE.Box3().setFromObject(gltfObject);
    center = box.getCenter(new THREE.Vector3());
    size = box.getSize(new THREE.Vector3());

    shadowEl.object3D.scale.y = size.x;
    shadowEl.object3D.scale.x = size.y;
    shadowEl.object3D.position.y = -size.y / 2;
    shadowEl.object3D.position.z = -center.z;
    shadowEl.object3D.position.x = -center.x;

    modelEl.object3D.position.x = -center.x;
    modelEl.object3D.position.y = -center.y;
    modelEl.object3D.position.z = -center.z;

    // When in mobile landscape we want to bring the model a bit closer.
    if (AFRAME.utils.device.isLandscape()) { this.cameraRigEl.object3D.position.z -= 1; }
  },

  onMouseDown: function (evt) {
    if (evt.buttons) { this.leftRightButtonPressed = evt.buttons === 3; }
    this.oldClientX = evt.clientX;
    this.oldClientY = evt.clientY;
  }
});
