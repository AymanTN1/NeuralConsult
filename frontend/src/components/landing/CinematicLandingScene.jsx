import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SMOKE_COUNT = 620;
const SOOT_COUNT = 140;
const SMOKE_PLUMES = Array.from({ length: 11 }, (_, index) => ({
  id: index,
  drift: ((index % 4) - 1.5) * 16,
  duration: 1.9 + index * 0.14,
  delay: index * 0.12,
  scale: 0.92 + index * 0.12
}));

const LUNG_SURFACE_CURVES = {
  left: [
    [
      [0.38, 1.28, 0.42],
      [0.08, 0.82, 0.46],
      [-0.22, 0.14, 0.48],
      [-0.48, -0.8, 0.46],
      [-0.78, -1.78, 0.42]
    ],
    [
      [0.18, 2.02, 0.38],
      [-0.06, 1.36, 0.42],
      [-0.28, 0.52, 0.44],
      [-0.58, -0.56, 0.42]
    ],
    [
      [0.58, 1.02, 0.32],
      [0.22, 0.56, 0.36],
      [-0.1, -0.18, 0.38],
      [-0.38, -1.06, 0.36]
    ],
    [
      [0.52, 0.34, 0.34],
      [0.18, -0.08, 0.36],
      [-0.18, -0.72, 0.38],
      [-0.52, -1.58, 0.34]
    ]
  ],
  right: [
    [
      [-0.42, 1.56, 0.42],
      [-0.08, 1.28, 0.46],
      [0.26, 1.02, 0.48],
      [0.66, 0.86, 0.46],
      [0.98, 0.84, 0.42]
    ],
    [
      [-0.36, 0.96, 0.38],
      [-0.02, 0.56, 0.42],
      [0.28, 0.08, 0.46],
      [0.56, -0.6, 0.44],
      [0.84, -1.44, 0.4]
    ],
    [
      [-0.18, 2.1, 0.32],
      [0.02, 1.44, 0.36],
      [0.28, 0.62, 0.38],
      [0.52, -0.2, 0.36]
    ],
    [
      [-0.48, 0.32, 0.34],
      [-0.1, -0.04, 0.36],
      [0.22, -0.66, 0.38],
      [0.56, -1.56, 0.34]
    ]
  ]
};

const BRONCHIAL_LUNG_CURVES = {
  left: [
    [
      [0.62, 1.86, 0.2],
      [0.42, 1.3, 0.22],
      [0.18, 0.76, 0.24],
      [-0.12, 0.18, 0.26],
      [-0.42, -0.38, 0.28]
    ],
    [
      [0.52, 1.72, 0.16],
      [0.14, 1.22, 0.18],
      [-0.08, 0.62, 0.2],
      [-0.36, -0.2, 0.22],
      [-0.64, -1.18, 0.24]
    ],
    [
      [0.32, 1.46, 0.14],
      [0.02, 0.92, 0.16],
      [-0.22, 0.16, 0.18],
      [-0.52, -0.92, 0.2]
    ]
  ],
  right: [
    [
      [-0.56, 1.88, 0.2],
      [-0.3, 1.38, 0.22],
      [0.02, 0.92, 0.24],
      [0.36, 0.44, 0.26],
      [0.72, -0.08, 0.28]
    ],
    [
      [-0.44, 1.66, 0.16],
      [-0.1, 1.14, 0.18],
      [0.18, 0.52, 0.2],
      [0.48, -0.32, 0.22],
      [0.78, -1.34, 0.24]
    ],
    [
      [-0.26, 1.52, 0.14],
      [0.04, 0.94, 0.16],
      [0.28, 0.26, 0.18],
      [0.58, -0.82, 0.2]
    ]
  ]
};

const createTubeGeometry = (points, radius) =>
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    96,
    radius,
    18,
    false
  );

const createLungGeometry = (side) => {
  const points =
    side === "left"
      ? [
          [0.26, 3.18],
          [-0.22, 3.06],
          [-0.88, 2.58],
          [-1.36, 1.66],
          [-1.62, 0.42],
          [-1.58, -1.02],
          [-1.2, -2.54],
          [-0.58, -3.86],
          [0.08, -4.42],
          [0.62, -4.08],
          [0.98, -3.2],
          [1.06, -2.04],
          [0.82, -1.04],
          [0.38, -0.26],
          [0.18, 0.46],
          [0.26, 1.34],
          [0.36, 2.18],
          [0.26, 3.18]
        ]
      : [
          [-0.24, 3.28],
          [0.26, 3.18],
          [0.96, 2.62],
          [1.42, 1.58],
          [1.66, 0.2],
          [1.58, -1.4],
          [1.18, -2.96],
          [0.56, -4.16],
          [-0.12, -4.52],
          [-0.68, -4.02],
          [-0.98, -3.02],
          [-1.02, -1.74],
          [-0.8, -0.64],
          [-0.46, 0.22],
          [-0.26, 0.96],
          [-0.22, 1.72],
          [-0.18, 2.38],
          [-0.24, 3.28]
        ];

  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  shape.splineThru(points.slice(1).map(([x, y]) => new THREE.Vector2(x, y)));

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.64,
    bevelEnabled: true,
    bevelSegments: 16,
    bevelSize: 0.07,
    bevelThickness: 0.07,
    curveSegments: 112,
    steps: 2
  });
  geometry.center();
  return geometry;
};

const BioLungSystem = ({ progress, scrollVelocity }) => {
  const leftShellRef = useRef(null);
  const rightShellRef = useRef(null);
  const leftTarRef = useRef(null);
  const rightTarRef = useRef(null);
  const stainRefs = useRef([]);
  const smokeRef = useRef(null);
  const sootRef = useRef(null);
  const tracheaRef = useRef(null);
  const leftLungGeometry = useMemo(() => createLungGeometry("left"), []);
  const rightLungGeometry = useMemo(() => createLungGeometry("right"), []);
  const leftSurfaceGeometries = useMemo(
    () => LUNG_SURFACE_CURVES.left.map((curve) => createTubeGeometry(curve, 0.028)),
    []
  );
  const rightSurfaceGeometries = useMemo(
    () => LUNG_SURFACE_CURVES.right.map((curve) => createTubeGeometry(curve, 0.028)),
    []
  );
  const leftBranchGeometries = useMemo(
    () => BRONCHIAL_LUNG_CURVES.left.map((curve) => createTubeGeometry(curve, 0.044)),
    []
  );
  const rightBranchGeometries = useMemo(
    () => BRONCHIAL_LUNG_CURVES.right.map((curve) => createTubeGeometry(curve, 0.044)),
    []
  );
  const smokeData = useMemo(() => {
    const seeds = new Float32Array(SMOKE_COUNT * 4);
    for (let index = 0; index < SMOKE_COUNT; index += 1) {
      seeds[index * 4] = Math.random() * 2 - 1;
      seeds[index * 4 + 1] = Math.random();
      seeds[index * 4 + 2] = Math.random() * 2 - 1;
      seeds[index * 4 + 3] = Math.random() * 0.8 + 0.2;
    }
    return seeds;
  }, []);
  const sootData = useMemo(() => {
    const seeds = new Float32Array(SOOT_COUNT * 4);
    for (let index = 0; index < SOOT_COUNT; index += 1) {
      seeds[index * 4] = Math.random() * 2 - 1;
      seeds[index * 4 + 1] = Math.random() * 2 - 1;
      seeds[index * 4 + 2] = Math.random() * 2 - 1;
      seeds[index * 4 + 3] = Math.random() * 0.9 + 0.1;
    }
    return seeds;
  }, []);
  const tarSeeds = useMemo(
    () =>
      Array.from({ length: 20 }, () => ({
        x: THREE.MathUtils.randFloat(-0.82, 0.82),
        y: THREE.MathUtils.randFloat(-2.25, 1.8),
        z: THREE.MathUtils.randFloat(0.18, 0.44),
        scaleX: THREE.MathUtils.randFloat(0.18, 0.54),
        scaleY: THREE.MathUtils.randFloat(0.16, 0.56),
        drift: THREE.MathUtils.randFloat(0.6, 1.3)
      })),
    []
  );

  const burnProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const shellColor = useMemo(
    () => new THREE.Color().lerpColors(new THREE.Color("#e87d88"), new THREE.Color("#2a2b2e"), burnProgress),
    [burnProgress]
  );
  const tarColor = useMemo(
    () => new THREE.Color().lerpColors(new THREE.Color("#ab5f66"), new THREE.Color("#0a0a0c"), burnProgress),
    [burnProgress]
  );
  const clinicalGlow = useMemo(
    () => new THREE.Color().lerpColors(new THREE.Color("#ffb3ba"), new THREE.Color("#4a4d52"), burnProgress),
    [burnProgress]
  );
  const fissureColor = useMemo(
    () => new THREE.Color().lerpColors(new THREE.Color("#944149"), new THREE.Color("#52575d"), burnProgress),
    [burnProgress]
  );
  const branchColor = useMemo(
    () => new THREE.Color().lerpColors(new THREE.Color("#d47781"), new THREE.Color("#3c3e42"), burnProgress),
    [burnProgress]
  );
  const smokeColor = useMemo(
    () => new THREE.Color().lerpColors(new THREE.Color("#edf4ff"), new THREE.Color("#959ea8"), burnProgress),
    [burnProgress]
  );

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    const lungPulse = 1 + Math.sin(elapsed * 1.25) * 0.018;
    const breathCompression = 1 - burnProgress * 0.16;
    const toxicShift = 0.18 + burnProgress * 0.62;
    const smokeOpacity = THREE.MathUtils.clamp(0.12 + burnProgress * 0.28 + scrollVelocity * 0.12, 0.12, 0.48);
    const sootOpacity = THREE.MathUtils.clamp(0.04 + burnProgress * 0.28, 0.04, 0.36);

    [leftShellRef.current, rightShellRef.current].forEach((lung) => {
      if (!lung) return;
      lung.scale.set(0.92 * lungPulse, 0.98 * breathCompression, 0.72 + Math.cos(elapsed * 1.1) * 0.014);
      lung.position.y = Math.sin(elapsed * 1.15) * 0.04;
      lung.material.color.copy(shellColor);
      lung.material.emissive.copy(clinicalGlow);
      lung.material.emissiveIntensity = 0.03 + (1 - burnProgress) * 0.12;
    });

    [leftTarRef.current, rightTarRef.current].forEach((overlay) => {
      if (!overlay) return;
      overlay.position.y = Math.sin(elapsed * 1.15) * 0.04;
      overlay.material.color.copy(tarColor);
      overlay.material.opacity = THREE.MathUtils.clamp(0.02 + burnProgress * 0.84, 0.02, 0.92);
    });

    stainRefs.current.forEach((stain, index) => {
      if (!stain) return;
      const seed = tarSeeds[index % tarSeeds.length];
      const offset = Math.sin(elapsed * seed.drift + index * 0.4) * 0.02;
      stain.position.z = 0.24 + offset;
      stain.material.opacity = THREE.MathUtils.clamp(0.02 + burnProgress * 0.82, 0.02, 0.92);
      stain.material.color.copy(tarColor);
    });

    if (tracheaRef.current) {
      tracheaRef.current.material.color.copy(branchColor);
      tracheaRef.current.material.emissive.copy(branchColor);
      tracheaRef.current.material.emissiveIntensity = 0.04 + (1 - burnProgress) * 0.08;
    }

    if (sootRef.current) {
      const positions = sootRef.current.geometry.attributes.position.array;
      for (let index = 0; index < SOOT_COUNT; index += 1) {
        const i3 = index * 3;
        const i4 = index * 4;
        const x = sootData[i4];
        const y = sootData[i4 + 1];
        const z = sootData[i4 + 2];
        const drift = sootData[i4 + 3];
        positions[i3] = x * 1.45 + Math.sin(elapsed * drift + index) * 0.06;
        positions[i3 + 1] = y * 1.7 + Math.cos(elapsed * drift + index * 0.6) * 0.06;
        positions[i3 + 2] = z * 0.9 + Math.sin(elapsed * drift + index * 0.25) * 0.04;
      }
      sootRef.current.geometry.attributes.position.needsUpdate = true;
      sootRef.current.material.opacity = sootOpacity;
      sootRef.current.material.size = 0.028 + burnProgress * 0.05;
      sootRef.current.material.color.copy(tarColor);
    }

    if (smokeRef.current) {
      const positions = smokeRef.current.geometry.attributes.position.array;
      for (let index = 0; index < SMOKE_COUNT; index += 1) {
        const i3 = index * 3;
        const i4 = index * 4;
        const swirl = smokeData[i4 + 3];
        const angle = elapsed * (0.34 + swirl * 0.16 + scrollVelocity * 0.08) + index * 0.11;
        const spread = 0.3 + burnProgress * 1.38 + scrollVelocity * 0.34;
        const lift = (smokeData[i4 + 1] * 5.6 + elapsed * (0.58 + swirl + scrollVelocity * 0.24)) % 7.2;
        positions[i3] = Math.cos(angle) * spread * smokeData[i4] * 0.82;
        positions[i3 + 1] = -1.7 + lift;
        positions[i3 + 2] = Math.sin(angle) * spread * smokeData[i4 + 2] * 0.76;
      }
      smokeRef.current.geometry.attributes.position.needsUpdate = true;
      smokeRef.current.material.opacity = smokeOpacity;
      smokeRef.current.material.color.copy(smokeColor);
      smokeRef.current.material.size = 0.1 + burnProgress * 0.12 + scrollVelocity * 0.04;
    }
  });

  return (
    <group position={[0, 0.38, 0]} scale={[0.82, 0.82, 0.82]}>
      <mesh ref={tracheaRef} position={[0, 2.16, 0.08]}>
        <cylinderGeometry args={[0.16, 0.18, 1.18, 36]} />
        <meshStandardMaterial color="#b16069" emissive="#6f2f39" emissiveIntensity={0.04} roughness={0.58} metalness={0.03} />
      </mesh>

      <mesh position={[-0.32, 1.48, 0.08]} rotation={[0, 0, -0.82]}>
        <cylinderGeometry args={[0.08, 0.11, 0.9, 24]} />
        <meshStandardMaterial color={branchColor} emissive={branchColor} emissiveIntensity={0.02} roughness={0.64} metalness={0.03} />
      </mesh>
      <mesh position={[0.32, 1.48, 0.08]} rotation={[0, 0, 0.82]}>
        <cylinderGeometry args={[0.08, 0.11, 0.9, 24]} />
        <meshStandardMaterial color={branchColor} emissive={branchColor} emissiveIntensity={0.02} roughness={0.64} metalness={0.03} />
      </mesh>

      {[
        {
          id: "left-shell",
          x: -1.2,
          geometry: leftLungGeometry,
          shellRef: leftShellRef,
          tarRef: leftTarRef,
          rotation: [0, 0.08, -0.035],
          fissures: leftSurfaceGeometries,
          branches: leftBranchGeometries
        },
        {
          id: "right-shell",
          x: 1.24,
          geometry: rightLungGeometry,
          shellRef: rightShellRef,
          tarRef: rightTarRef,
          rotation: [0, -0.08, 0.035],
          fissures: rightSurfaceGeometries,
          branches: rightBranchGeometries
        }
      ].map((lung) => (
        <group key={lung.id} position={[lung.x, -0.08, 0]} rotation={lung.rotation}>
          <mesh ref={lung.shellRef} geometry={lung.geometry}>
            <meshStandardMaterial color="#c84f5b" emissive="#ff9ca3" emissiveIntensity={0.04} roughness={0.84} metalness={0.02} />
          </mesh>

          <mesh ref={lung.tarRef} geometry={lung.geometry} position={[0, 0, 0.06]} renderOrder={2}>
            <meshStandardMaterial
              color="#423128"
              transparent
              opacity={0.12}
              roughness={0.82}
              metalness={0.04}
              side={THREE.DoubleSide}
            />
          </mesh>

          {lung.fissures.map((geometry, index) => (
            <mesh key={`${lung.id}-fissure-${index}`} geometry={geometry} position={[0, 0, 0.14]} renderOrder={3}>
              <meshStandardMaterial
                color={fissureColor}
                emissive={fissureColor}
                emissiveIntensity={0.06}
                roughness={0.92}
                metalness={0.02}
              />
            </mesh>
          ))}

          {lung.branches.map((geometry, index) => (
            <mesh key={`${lung.id}-branch-${index}`} geometry={geometry} position={[0, 0, 0.1]} renderOrder={3}>
              <meshStandardMaterial
                color={branchColor}
                emissive={branchColor}
                emissiveIntensity={0.02 + (1 - burnProgress) * 0.02}
                roughness={0.64}
                metalness={0.03}
              />
            </mesh>
          ))}

          {tarSeeds.map((seed, index) => {
            const stainIndex = lung.id === "left-shell" ? index : tarSeeds.length + index;
            return (
              <mesh
                key={`${lung.id}-${index}`}
                ref={(element) => {
                  stainRefs.current[stainIndex] = element;
                }}
                position={[seed.x, seed.y, seed.z]}
                scale={[seed.scaleX, seed.scaleY, 0.12]}
              >
                <sphereGeometry args={[0.52, 24, 24]} />
                <meshStandardMaterial color="#241614" transparent opacity={0.06} roughness={0.96} metalness={0.01} />
              </mesh>
            );
          })}
        </group>
      ))}

      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={SMOKE_COUNT}
            array={new Float32Array(SMOKE_COUNT * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
              color="#d7dfdb"
              size={0.16}
              transparent
              opacity={0.24}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
        />
      </points>

      <points ref={sootRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={SOOT_COUNT}
            array={new Float32Array(SOOT_COUNT * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#6a655f" size={0.06} transparent opacity={0.12} depthWrite={false} />
      </points>
    </group>
  );
};

const HologramScene = ({ progress, scrollVelocity }) => (
  <div className="cinematic-canvas-shell" aria-hidden="true">
    <Canvas camera={{ position: [0, 0.3, 8.2], fov: 32 }}>
      <color
        attach="background"
        args={[
          new THREE.Color().lerpColors(
            new THREE.Color("#f4f7fb"),
            new THREE.Color("#e2e8f0"),
            THREE.MathUtils.clamp(progress * 0.9, 0, 1)
          ).getStyle()
        ]}
      />
      <fog
        attach="fog"
        args={[
          new THREE.Color().lerpColors(
            new THREE.Color("#f4f7fb"),
            new THREE.Color("#e2e8f0"),
            THREE.MathUtils.clamp(progress * 0.92, 0, 1)
          ).getStyle(),
          8,
          17
        ]}
      />
      <ambientLight intensity={0.26} color="#cfe0ff" />
      <directionalLight position={[4, 4, 6]} intensity={0.48} color="#ffe0d8" />
      <pointLight position={[0, 2.6, 2.2]} intensity={0.3} color="#9cc4ff" />
      <pointLight position={[0, -1.4, 1.8]} intensity={0.22} color="#e7f0ff" />
      <BioLungSystem progress={progress} scrollVelocity={scrollVelocity} />
    </Canvas>
  </div>
);

const CinematicLandingScene = ({ progress, scrollVelocity, copyVisibility = 1 }) => {
  const burnProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const cigaretteBodyScale = Math.max(0.12, 1 - burnProgress * 0.84);
  const smokeDensity = THREE.MathUtils.clamp(0.25 + burnProgress * 0.45 + scrollVelocity * 0.15, 0.25, 0.85);
  const emberGlow = 8 + burnProgress * 12 + scrollVelocity * 8;
  const statusTone = burnProgress < 0.34 ? "Repere initial" : burnProgress < 0.68 ? "Repere en cours" : "Repere de vigilance";

  return (
    <div className="cinematic-stage">
      <HologramScene progress={burnProgress} scrollVelocity={scrollVelocity} />

      <div className="cinematic-stage-copy" style={{ opacity: copyVisibility }}>
        <div className="hero-kicker">Restorative Clinical</div>
        <h1 className="landing-title cinematic-title">
          Reprendre le souffle.
          <br />
          Reouvrir la possibilite d'arreter.
        </h1>
      </div>

      <div className="sticky-cigarette-shell">
        <div className="sticky-cigarette-caption">
          <span>Repere de consommation</span>
          <strong>{Math.round(burnProgress * 100)}% du parcours visuel</strong>
          <em>{statusTone}</em>
        </div>
        <div className="sticky-cigarette-rail">
          <div className="sticky-cigarette-filter" />
          <div className="sticky-cigarette-body" style={{ transform: `scaleX(${cigaretteBodyScale})` }}>
            <div className="sticky-cigarette-stripe" />
            <div className="sticky-cigarette-stripe sticky-cigarette-stripe-secondary" />
          </div>
          <div
            className="sticky-cigarette-ember"
            style={{
              boxShadow: `0 0 ${emberGlow}px rgba(201, 169, 135, 0.42), 0 0 ${emberGlow * 0.46}px rgba(244, 232, 209, 0.24)`
            }}
          />

          <div className="sticky-cigarette-smoke-stack" aria-hidden="true">
            {SMOKE_PLUMES.map((plume) => (
              <span
                key={plume.id}
                className="sticky-cigarette-smoke"
                style={{
                  "--smoke-delay": `${plume.delay}s`,
                  "--smoke-duration": `${plume.duration}s`,
                  "--smoke-drift": `${plume.drift}px`,
                  "--smoke-scale": plume.scale,
                  opacity: Math.max(0.18, smokeDensity - plume.id * 0.045)
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinematicLandingScene;
