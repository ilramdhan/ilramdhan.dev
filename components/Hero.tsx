import React, { useRef, useState, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Linkedin, Twitter, Instagram, Youtube, Mail, Gamepad2, Phone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as api from '../lib/api';
import { ensureFullUrl } from '../lib/utils';
import { useTypewriter } from 'react-simple-typewriter';
import * as THREE from 'three';
import { Canvas, extend, useThree, useFrame, ReactThreeFiber } from '@react-three/fiber';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint, RapierRigidBody } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import { useTexture, Environment, Lightformer, useGLTF } from '@react-three/drei';

extend({ MeshLineGeometry, MeshLineMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: ReactThreeFiber.Object3DNode<
        MeshLineGeometry,
        typeof MeshLineGeometry
      >;
      meshLineMaterial: ReactThreeFiber.Object3DNode<
        MeshLineMaterial,
        typeof MeshLineMaterial
      >;
    }
  }
}

const SocialIconMap: { [key: string]: React.ElementType } = {
    github: Github, linkedin: Linkedin, twitter: Twitter, instagram: Instagram, youtube: Youtube, mail: Mail, whatsapp: Phone, steam: Gamepad2
};

const segmentProps = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 2,
  linearDamping: 2,
} as const;

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
  const { nodes, materials } = useGLTF("/assets/3d/card.glb");
  // Use tag_texture for the band
  const texture = useTexture("/assets/images/tag_texture.png");
  const { width, height } = useThree((state) => state.size);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);

  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => void (document.body.style.cursor = "auto");
    }
    return () => void (document.body.style.cursor = "auto");
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
      // @ts-ignore
      const [j1Lerped, j2Lerped] = [j1, j2].map((ref) => {
        if (ref.current) {
          const lerped = new THREE.Vector3().copy(ref.current.translation());

          const clampedDistance = Math.max(
            0.1,
            Math.min(1, lerped.distanceTo(ref.current.translation()))
          );

          return lerped.lerp(
            ref.current.translation(),
            delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
          );
        }
      });

      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2Lerped ?? j2.current.translation());
      curve.points[2].copy(j1Lerped ?? j1.current.translation());
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel(
        { x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z },
        false
      );
    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  // Responsive Position
  const isMobile = width < 10;
  const xOffset = isMobile ? 0 : 2.5;
  const yOffset = 4;

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
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.25, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => {
              // @ts-ignore
              e.target.releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e) => {
              // @ts-ignore
              e.target.setPointerCapture(e.pointerId);
              if (card.current) {
                  drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
              }
            }}
          >
            {/* @ts-expect-error geometry/map are not declared? */}
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                // @ts-expect-error geometry/map are not declared?
                map={materials.base.map}
                map-anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0.15}
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
            <mesh
              // @ts-expect-error geometry/map are not declared?
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            {/* @ts-expect-error geometry/map are not declared? */}
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
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

// Preload assets
useGLTF.preload("/assets/3d/card.glb");
useTexture.preload("/assets/images/tag_texture.png");

export function Hero() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
  });

  const words = profile?.hero_title ? profile.hero_title.split(',').map(s => s.trim()) : [''];

  const [text] = useTypewriter({
    words: words,
    loop: 0, // 0 means infinite
    delaySpeed: 2000,
    typeSpeed: 100,
    deleteSpeed: 50,
  });

  const handleContactClick = () => {
      if (location.pathname === '/') {
          const element = document.querySelector('#contact');
          element?.scrollIntoView({ behavior: 'smooth' });
      } else {
          navigate('/');
          setTimeout(() => {
              const element = document.querySelector('#contact');
              element?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
      }
  };

  if (isLoading) {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 mb-8">
                <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-full mb-6 animate-pulse mx-auto lg:mx-0"></div>
                <div className="h-16 sm:h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-lg mb-6 animate-pulse"></div>
                <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8 animate-pulse mx-auto lg:mx-0"></div>
            </div>
        </section>
    )
  }

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Canvas Layer - Full Screen Absolute */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 13], fov: 25 }} className="pointer-events-none">
              <ambientLight intensity={Math.PI} />
              <Suspense fallback={null}>
                  <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
                      <Band />
                  </Physics>
                  <Environment blur={0.75}>
                      <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
                      <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
                      <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
                      <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
                  </Environment>
              </Suspense>
          </Canvas>
      </div>

      {/* Content Layer - Relative Z-10 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pointer-events-none">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Text Content - Enable Pointer Events */}
            <motion.div 
                className="flex-1 text-center lg:text-left pointer-events-auto"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                {profile?.badge_text && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-sm font-medium mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        {profile.badge_text}
                    </span>
                )}
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
                    <span>{text || '\u00A0'}</span>
                </h1>
                <p className="mt-4 max-w-2xl mx-auto lg:mx-0 text-xl text-slate-600 dark:text-slate-400 mb-8">
                    {profile?.short_description}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                    <button 
                    onClick={() => navigate('/projects')}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
                    >
                    View Projects <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                    onClick={handleContactClick}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white font-semibold transition-all"
                    >
                    Contact Me
                    </button>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6">
                    {profile?.social_links && typeof profile.social_links === 'object' && Object.entries(profile.social_links).map(([key, value]) => {
                        if (!value) return null;
                        const Icon = SocialIconMap[key];
                        if (!Icon) return null;
                        const href = key === 'mail' ? `mailto:${value}` : ensureFullUrl(value as string) || '#';
                        return (
                            <a key={key} href={href} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors">
                                {/* @ts-ignore */}
                                <Icon className="h-6 w-6" />
                            </a>
                        );
                    })}
                </div>
            </motion.div>

            {/* Spacer for the 3D Card on Desktop */}
            <div className="flex-1 h-[500px] w-full hidden lg:block pointer-events-none">
                {/* Area ini dibiarkan kosong agar teks tidak menimpa area kartu di desktop */}
            </div>
        </div>
      </div>
    </section>
  );
}
