import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader2 } from 'three/examples/jsm/loaders/OBJLoader2';
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils';
import * as dat from 'dat.gui';

class Scene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private controls: OrbitControls;

  private orientation: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private gui: dat.GUI;

  private pSystem: THREE.Points;
  private pointsGeometry: THREE.BufferGeometry;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.gui = new dat.GUI();
    this.bind();
  }

  bind() {
    window.addEventListener('resize', () => this.onResize);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  init() {
    this.camera.position.set(0.5, 0.5, 0.5);
    this.camera.lookAt(0, 0, 0);

    // this.gui.add(this.orientation, 'x', 0, Math.PI * 2).step(0.05);
    // this.gui.add(this.orientation, 'y', 0, Math.PI * 2).step(0.05);
    // this.gui.add(this.orientation, 'z', 0, Math.PI * 2).step(0.05);

    const ambientLight = new THREE.AmbientLight(0xcccccc, 1.4);
    this.scene.add(ambientLight);

    const mat = new THREE.MeshNormalMaterial();
    const vertices: THREE.Vector3[] = [];
    const objLoader = new OBJLoader2();
    objLoader.load('assets/Bunny.obj', root => {
      root.traverse(item => {
        if (item instanceof THREE.Mesh) {
          item.material = mat;

          item.geometry.rotateX(4.6);
          item.geometry.rotateY(6.2);

          if (item.geometry instanceof THREE.Geometry) {
            const v = GeometryUtils.randomPointsInGeometry(item.geometry, 200);
            vertices.push(...v);
          }

          if (item.geometry instanceof THREE.BufferGeometry) {
            const geo = new THREE.Geometry().fromBufferGeometry(item.geometry);
            const v = GeometryUtils.randomPointsInGeometry(geo, 200);
            vertices.push(...v);
          }

          const box = new THREE.Box3().setFromObject(item);

          this.createParticles(vertices, box);
        }
      });
    });
  }

  createParticles(vertices: THREE.Vector3[], box: THREE.Box3) {
    this.pointsGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    const c = new THREE.Color(0x2fbdf5);

    const scaleX = box.max.x - box.min.x;
    const scaleY = box.max.y - box.min.y;
    const scaleZ = box.max.z - box.min.z;

    const scale = Math.max(scaleX, scaleY, scaleZ) * 1.75;

    vertices.forEach(vertex => {
      positions.push(vertex.x / scale, vertex.y / scale, vertex.z / scale);
      colors.push(c.r, c.g, c.b);
      sizes.push(0.001);
    });

    this.pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x2fbdf5,
      size: 0.001,
    });

    this.pSystem = new THREE.Points(this.pointsGeometry, pointsMaterial);
    const pBox = new THREE.Box3().setFromObject(this.pSystem);
    this.pSystem.translateX(-(pBox.max.x - pBox.min.x) / 2);
    this.pSystem.translateZ(-(pBox.max.z - pBox.min.z) / 2);
    this.scene.add(this.pSystem);
  }

  render() {
    requestAnimationFrame(() => this.render());
    this.renderer.render(this.scene, this.camera);

    // @ts-ignore
    const points = this.pSystem.geometry.attributes.position.array;
    for (let i = 0; i < points.length; i += 1) {
      // @ts-ignore
      points[i] += Math.random() * 0.001 - 0.0005;
    }

    // @ts-ignore
    this.pSystem.geometry.attributes.position.needsUpdate = true;

    //this.pSystem.rotation.set(this.orientation.x, this.orientation.y, this.orientation.z, 'XYZ');

    this.controls.update();
  }
}

export default new Scene();
