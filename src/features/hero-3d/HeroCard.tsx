import { useEffect, useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, extend, useThree, useFrame, ReactThreeFiber } from '@react-three/fiber';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  RapierRigidBody,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import { useTexture, Environment, Lightformer, useGLTF } from '@react-three/drei';
import { useInView } from '@/lib/hooks';

/**
 * The interactive 3D lanyard card (three.js + Rapier). Loaded with `React.lazy` from
 * `Hero.tsx` only on desktop with motion allowed and WebGL available (T-25), so its
 * ~1 MB of JS and the model never reach mobile visitors or other routes.
 *
 * `/models/card.glb` is generated from `assets-src/card.glb` (3,849 KB → 225 KB):
 *   npx @gltf-transform/cli@4 optimize assets-src/card.glb public/models/card.glb \
 *     --compress false --texture-compress webp --texture-size 2048 \
 *     --simplify false --join false --instance false --palette false --flatten false
 * Geometry stays uncompressed on purpose: meshopt/quantize move a dequantization
 * transform onto the nodes, but `Band` only reads `nodes.*.geometry` (the card would
 * render at the wrong scale). The node and material names must survive.
 */
const CARD_MODEL = '/models/card.glb';
const BAND_TEXTURE = '/models/band.webp';

useGLTF.preload(CARD_MODEL);
useTexture.preload(BAND_TEXTURE);

extend({ MeshLineGeometry, MeshLineMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: ReactThreeFiber.Object3DNode<MeshLineGeometry, typeof MeshLineGeometry>;
      meshLineMaterial: ReactThreeFiber.Object3DNode<MeshLineMaterial, typeof MeshLineMaterial>;
    }
  }
}

const segmentProps = {
  type: 'dynamic',
  canSleep: true,
  colliders: false,
  angularDamping: 2,
  linearDamping: 2,
} as const;

// Shape of /models/card.glb (the nodes/materials this component uses).
type CardGLTF = {
  nodes: { card: THREE.Mesh; clip: THREE.Mesh; clamp: THREE.Mesh };
  materials: { base: THREE.MeshStandardMaterial; metal: THREE.Material };
};

function Band({ maxSpeed = 50, minSpeed = 10 }) {
  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null);
  const fixed = useRef<RapierRigidBody>(null);
  const j1 = useRef<RapierRigidBody>(null);
  const j2 = useRef<RapierRigidBody>(null);
  const j3 = useRef<RapierRigidBody>(null);

  const card = useRef<RapierRigidBody>(null);
  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  // Load GLTF and Textures
  const { nodes, materials } = useGLTF(CARD_MODEL) as unknown as CardGLTF;
  const texture = useTexture(BAND_TEXTURE);
  const { width, height } = useThree((state) => state.size);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
  );

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);

  // Anchor point disesuaikan agar ujung tali 'tenggelam' di dalam klip
  // Y dinaikkan dari 1.45 ke 1.55 agar ujung tali naik sedikit dan tidak tembus ke bawah
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.55, 0.05], // Z sedikit dikurangi agar lebih pas di tengah lubang
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
    return () => void (document.body.style.cursor = 'auto');
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (
      !fixed.current ||
      !j1.current ||
      !j2.current ||
      !j3.current ||
      !band.current ||
      !card.current
    )
      return;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (fixed.current) {
      const [j1Lerped, j2Lerped] = [j1, j2].map((ref) => {
        if (ref.current) {
          const lerped = new THREE.Vector3().copy(ref.current.translation());

          const clampedDistance = Math.max(
            0.1,
            Math.min(1, lerped.distanceTo(ref.current.translation())),
          );

          return lerped.lerp(
            ref.current.translation(),
            delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
          );
        }
      });

      curve.points[0]!.copy(j3.current.translation());
      curve.points[1]!.copy(j2Lerped ?? j2.current.translation());
      curve.points[2]!.copy(j1Lerped ?? j1.current.translation());
      curve.points[3]!.copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  // Responsive Position
  const isMobile = width < 10;
  const xOffset = isMobile ? 0 : 2.5;
  const yOffset = 4;

  const handlePointerOver = () => {
    hover(true);
    if (card.current && !dragged) {
      // Berikan "senggolan" atau impuls kecil dengan arah acak
      const impulseX = (Math.random() - 0.5) * 0.1;
      const impulseZ = (Math.random() - 0.5) * 0.1;
      card.current.applyImpulse({ x: impulseX, y: 0, z: impulseZ }, true);
      card.current.applyTorqueImpulse({ x: 0, y: (Math.random() - 0.5) * 0.02, z: 0 }, true);
    }
  };

  return (
    <>
      <group position={[xOffset, yOffset, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.4} // Ukuran diperbesar sedikit
            position={[0, -1.25, -0.05]}
            onPointerOver={handlePointerOver}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              if (card.current) {
                drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
              }
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={materials.base.map}
                map-anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={true} // Aktifkan depthTest agar tali bisa tertutup klip
          resolution={new THREE.Vector2(width, height)}
          useMap={1}
          map={texture}
          repeat={new THREE.Vector2(-3, 1)}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

/** Renders only while the hero is on screen: no frames or physics steps off-screen. */
export default function HeroCard({ onReady }: { onReady?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  return (
    <div ref={ref} className="absolute inset-0 z-0" data-testid="hero-card-canvas">
      <Canvas
        camera={{ position: [0, 0, 13], fov: 25 }}
        dpr={[1, 1.5]}
        frameloop={inView ? 'always' : 'never'}
        onCreated={onReady}
      >
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60} paused={!inView}>
            <Band />
          </Physics>
          <Environment blur={0.75}>
            <Lightformer
              intensity={2}
              color="white"
              position={[0, -1, 5]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[-1, -1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[1, 1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={10}
              color="white"
              position={[-10, 0, 14]}
              rotation={[0, Math.PI / 2, Math.PI / 3]}
              scale={[100, 10, 1]}
            />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}
