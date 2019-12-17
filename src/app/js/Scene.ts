import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils';
import * as dat from 'dat.gui';

interface Model {
  name: string;
  vertices: THREE.Vector3[];
  rotation: THREE.Vector3;
}

interface ParticleSystem {
  geometry: THREE.BufferGeometry;
  mesh: THREE.Points;
  material: THREE.Material;
  count: number;
  model: Model;
  modelIndex: number;
}

class Scene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private controls: OrbitControls;

  private pSystem: THREE.Points;
  private pointsGeometry: THREE.BufferGeometry;

  private models: Model[];
  private particleSystem: ParticleSystem;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.bind();
  }

  bind() {
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('click', () => {
      console.log(this.particleSystem);
      // const index = (this.particleSystem.modelIndex + 1) % this.models.length;
      // console.log(index);
      // this.particleSystem.modelIndex = index;
      // this.particleSystem.model = this.models[index];
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  init() {
    this.camera.position.set(0.5, 0.5, 0.5);
    this.camera.lookAt(0, 0, 0);
    this.models = [
      {
        name: 'assets/Bunny.obj',
        vertices: [],
        rotation: new THREE.Vector3(4.6, 6.2, 0),
      },
      {
        name: 'assets/Bison.obj',
        vertices: [],
        rotation: new THREE.Vector3(0, 3.14, 0),
      },
    ];

    this.particleSystem = {
      geometry: null,
      material: null,
      mesh: null,
      count: 2000,
      model: null,
      modelIndex: 0,
    };

    const ambientLight = new THREE.AmbientLight(0xcccccc, 1.4);
    this.scene.add(ambientLight);

    const objLoader = new OBJLoader();
    this.models.forEach((model, modelIndex) => {
      objLoader.load(model.name, root => {
        console.log('Load: ', model.name);
        const vertices: THREE.Vector3[] = [];
        root.traverse(item => {
          if (item instanceof THREE.Mesh) {
            item.geometry.rotateX(model.rotation.x);
            item.geometry.rotateY(model.rotation.y);
            item.geometry.rotateZ(model.rotation.z);

            const box = new THREE.Box3().setFromObject(item);

            const translateX = -(box.max.x - box.min.x) / 2;
            const translateZ = -(box.max.z - box.min.z) / 2;
            item.geometry.translate(translateX, 0, translateZ);

            const scaleX = box.max.x - box.min.x;
            const scaleY = box.max.y - box.min.y;
            const scaleZ = box.max.z - box.min.z;

            const scale = Math.max(scaleX, scaleY, scaleZ);
            item.geometry.scale(1 / scale, 1 / scale, 1 / scale);

            if (item.geometry instanceof THREE.Geometry) {
              vertices.push(...item.geometry.vertices);
            }

            if (item.geometry instanceof THREE.BufferGeometry) {
              const geo = new THREE.Geometry().fromBufferGeometry(item.geometry);
              vertices.push(...geo.vertices);
            }

            // const mat = new THREE.MeshNormalMaterial();
            // const m = new THREE.Mesh(item.geometry, mat);
            // this.scene.add(m);
          }
        });

        const rootGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
        model.vertices = GeometryUtils.randomPointsInBufferGeometry(rootGeometry, this.particleSystem.count);
        model.vertices = vertices;

        if (!this.particleSystem.model) {
          this.particleSystem.model = model;
          this.particleSystem.modelIndex = modelIndex;
          this.createParticles();
        }
      });
    });
  }

  createParticles() {
    this.particleSystem.geometry = new THREE.BufferGeometry();
    const positions: number[] = [];

    this.particleSystem.model.vertices.forEach(vertex => {
      positions.push(vertex.x, vertex.y, vertex.z);
    });

    this.particleSystem.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    this.particleSystem.material = new THREE.PointsMaterial({
      color: 0x2fbdf5,
      size: 0.001,
    });

    this.particleSystem.mesh = new THREE.Points(this.particleSystem.geometry, this.particleSystem.material);
    this.scene.add(this.particleSystem.mesh);
  }

  lerp(a: number, b: number, n: number) {
    return (1 - n) * a + n * b;
  }

  render() {
    requestAnimationFrame(() => this.render());
    this.renderer.render(this.scene, this.camera);

    if (false && this.particleSystem.mesh) {
      // @ts-ignore
      const points = this.particleSystem.mesh.geometry.attributes.position.array;
      for (let i = 0; i < points.length; i += 3) {
        const index = i % 3;
        const modelVertex = this.particleSystem.model.vertices[index];

        if (!modelVertex) {
          console.log(this.particleSystem.model);
        }

        points[i] = this.lerp(points[i], modelVertex.x, 0.015);
        points[i + 1] = this.lerp(points[i + 1], modelVertex.y, 0.015);
        points[i + 2] = this.lerp(points[i + 2], modelVertex.z, 0.015);
      }

      // @ts-ignore
      this.particleSystem.mesh.geometry.attributes.position.needsUpdate = true;
    }

    //this.pSystem.rotation.set(this.orientation.x, this.orientation.y, this.orientation.z, 'XYZ');

    this.controls.update();
  }
}

export default new Scene();
