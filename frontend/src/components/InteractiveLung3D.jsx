import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SMOKE_COUNT = 240; // Reduced for optimized rendering inside a smaller card
const SOOT_COUNT = 80;

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
    ]
  ],
  right: [
    [
      [-0.56, 1.88, 0.2],
      [-0.3, 1.38, 0.22],
      [0.02, 0.92, 0.24],
      [0.36, 0.44, 0.26],
      [0.72, -0.08, 0.28]
    ]
  ]
};

const createTubeGeometry = (points, radius) =>
  new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
    48,
    radius,
    8,
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
    depth: 0.5,
    bevelEnabled: true,
    bevelSegments: 8,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    curveSegments: 48,
    steps: 1
  });
  geometry.center();
  return geometry;
};

const BioLungSystem = ({ progress }) => {
  const groupRef = useRef(null);
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
      Array.from({ length: 12 }, () => ({
        x: THREE.MathUtils.randFloat(-0.6, 0.6),
        y: THREE.MathUtils.randFloat(-1.8, 1.5),
        z: THREE.MathUtils.randFloat(0.18, 0.38),
        scaleX: THREE.MathUtils.randFloat(0.15, 0.45),
        scaleY: THREE.MathUtils.randFloat(0.15, 0.45),
        drift: THREE.MathUtils.randFloat(0.5, 1.2)
      })),
    []
  );

  // Math: progress 1 = Smoker (grey/dark), progress 0 = Restored (pink/healthy)
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
    const lungPulse = 1 + Math.sin(elapsed * 1.5) * 0.015; // Soft clinical breathing pulse
    const breathCompression = 1 - burnProgress * 0.12;
    const smokeOpacity = THREE.MathUtils.clamp(burnProgress * 0.35, 0, 0.35); // Decreases to 0 as patient heals
    const sootOpacity = THREE.MathUtils.clamp(burnProgress * 0.25, 0, 0.25); // Decreases to 0 as patient heals

    // Auto rotate the system slowly
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.15;
    }

    [leftShellRef.current, rightShellRef.current].forEach((lung) => {
      if (!lung) return;
      lung.scale.set(0.92 * lungPulse, 0.98 * breathCompression, 0.72 + Math.cos(elapsed * 1.1) * 0.014);
      lung.position.y = Math.sin(elapsed * 1.15) * 0.03;
      lung.material.color.copy(shellColor);
      lung.material.emissive.copy(clinicalGlow);
      lung.material.emissiveIntensity = 0.03 + (1 - burnProgress) * 0.12;
    });

    [leftTarRef.current, rightTarRef.current].forEach((overlay) => {
      if (!overlay) return;
      overlay.position.y = Math.sin(elapsed * 1.15) * 0.03;
      overlay.material.color.copy(tarColor);
      overlay.material.opacity = THREE.MathUtils.clamp(burnProgress * 0.85, 0.01, 0.85);
    });

    stainRefs.current.forEach((stain, index) => {
      if (!stain) return;
      const seed = tarSeeds[index % tarSeeds.length];
      const offset = Math.sin(elapsed * seed.drift + index * 0.4) * 0.02;
      stain.position.z = 0.24 + offset;
      stain.material.opacity = THREE.MathUtils.clamp(burnProgress * 0.8, 0, 0.8);
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
      sootRef.current.material.color.copy(tarColor);
    }

    if (smokeRef.current) {
      const positions = smokeRef.current.geometry.attributes.position.array;
      for (let index = 0; index < SMOKE_COUNT; index += 1) {
        const i3 = index * 3;
        const i4 = index * 4;
        const swirl = smokeData[i4 + 3];
        const angle = elapsed * (0.34 + swirl * 0.16) + index * 0.11;
        const spread = 0.3 + burnProgress * 1.0;
        const lift = (smokeData[i4 + 1] * 5.6 + elapsed * (0.58 + swirl)) % 7.2;
        positions[i3] = Math.cos(angle) * spread * smokeData[i4] * 0.82;
        positions[i3 + 1] = -1.7 + lift;
        positions[i3 + 2] = Math.sin(angle) * spread * smokeData[i4 + 2] * 0.76;
      }
      smokeRef.current.geometry.attributes.position.needsUpdate = true;
      smokeRef.current.material.opacity = smokeOpacity;
      smokeRef.current.material.color.copy(smokeColor);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]} scale={[0.75, 0.75, 0.75]}>
      <mesh ref={tracheaRef} position={[0, 2.16, 0.08]}>
        <cylinderGeometry args={[0.16, 0.18, 1.18, 24]} />
        <meshStandardMaterial color="#b16069" emissive="#6f2f39" emissiveIntensity={0.04} roughness={0.58} metalness={0.03} />
      </mesh>

      <mesh position={[-0.32, 1.48, 0.08]} rotation={[0, 0, -0.82]}>
        <cylinderGeometry args={[0.08, 0.11, 0.9, 16]} />
        <meshStandardMaterial color={branchColor} emissive={branchColor} emissiveIntensity={0.02} roughness={0.64} metalness={0.03} />
      </mesh>
      <mesh position={[0.32, 1.48, 0.08]} rotation={[0, 0, 0.82]}>
        <cylinderGeometry args={[0.08, 0.11, 0.9, 16]} />
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
              color="#2a221d"
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
                <sphereGeometry args={[0.52, 16, 16]} />
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
          size={0.15}
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
        <pointsMaterial color="#5a554f" size={0.06} transparent opacity={0.12} depthWrite={false} />
      </points>
    </group>
  );
};

const InteractiveLung3D = ({ diffDays = 0 }) => {
  // Lungs fully recover over 30 days of smoke-free life.
  // diffDays = 0 -> progress = 1 (Full Smoker)
  // diffDays >= 30 -> progress = 0 (Full Recovery)
  const recoveryProgress = Math.min(100, Math.round((diffDays * 100) / 30));
  const progressValue = Math.max(0, 1 - (diffDays / 30));

  // Pointer dragging interaction to rotate model manually!
  const [rotation, setRotation] = useState([0.1, 0, 0]);
  const pointerDownRef = useRef(false);
  const previousPointerRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    pointerDownRef.current = true;
    previousPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!pointerDownRef.current) return;
    const deltaX = e.clientX - previousPointerRef.current.x;
    const deltaY = e.clientY - previousPointerRef.current.y;
    previousPointerRef.current = { x: e.clientX, y: e.clientY };
    setRotation((prev) => [
      THREE.MathUtils.clamp(prev[0] + deltaY * 0.01, -0.4, 0.4),
      prev[1] + deltaX * 0.01,
      prev[2]
    ]);
  };

  const handlePointerUp = () => {
    pointerDownRef.current = false;
  };

  return (
    <section className="rewards-dashboard-section mb-4" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
      <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: "24px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", minHeight: "420px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        
        {/* 3D Render Area */}
        <div 
          style={{ height: "380px", cursor: "grab", position: "relative" }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
        >
          <Canvas camera={{ position: [0, 0.3, 7.8], fov: 32 }}>
            <ambientLight intensity={0.34} color="#cfe0ff" />
            <directionalLight position={[4, 4, 6]} intensity={0.58} color="#ffe0d8" />
            <pointLight position={[0, 2.6, 2.2]} intensity={0.36} color="#9cc4ff" />
            <pointLight position={[0, -1.4, 1.8]} intensity={0.22} color="#e7f0ff" />
            <group rotation={rotation}>
              <BioLungSystem progress={progressValue} />
            </group>
          </Canvas>

          {/* Interactive Help Watermark */}
          <div style={{ position: "absolute", bottom: "16px", left: "24px", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", pointerEvents: "none" }}>
            <i className="bi bi-arrows-move me-2"></i>Glissez pour pivoter le poumon 3D
          </div>
        </div>

        {/* Clinical Info Panel */}
        <div className="p-4 d-flex flex-column justify-content-between text-white" style={{ background: "rgba(15, 23, 42, 0.3)", backdropFilter: "blur(5px)", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <span className="hero-kicker text-warning mb-2 d-inline-block">🫁 Modèle Clinique Virtuel 3D</span>
            <h3 className="fw-bold mb-3">Régénération Pulmonaire Actuelle</h3>
            <p className="text-secondary small mb-4" style={{ color: "#94a3b8 !important", lineHeight: 1.6 }}>
              Le sevrage tabagique déclenche une restauration physiologique spectaculaire. Ce poumon virtuel 3D interactif représente en temps réel l'élimination des dépôts de goudron, la repousse de vos cils bronchiques et le retour à un état oxygéné et sain.
            </p>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-secondary fw-semibold">Restauration des tissus :</span>
                <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill">{recoveryProgress}%</span>
              </div>
              <div className="progress" style={{ height: "8px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                  style={{ width: `${recoveryProgress}%`, borderRadius: "4px", transition: "width 1s ease" }}
                />
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-circle text-warning" style={{ backgroundColor: "rgba(245, 158, 11, 0.12)" }}>
                <i className="bi bi-heart-pulse-fill fs-4"></i>
              </div>
              <div>
                <strong className="d-block text-white small" style={{ fontWeight: 700 }}>Note Médicale de Restauration</strong>
                <span className="text-muted d-block mt-0.5" style={{ fontSize: "0.75rem", color: "#94a3b8 !important" }}>
                  {diffDays === 0 
                    ? "Cils bronchiques paralysés par le monoxyde de carbone. Première phase d'évacuation de la toux."
                    : diffDays < 3 
                    ? "Élimination progressive du CO de vos poumons. Les bronches commencent à se relâcher."
                    : diffDays < 7 
                    ? "Début de repousse active des cils vibratiles pour expulser naturellement le goudron restructuré."
                    : diffDays < 30 
                    ? "Capacité pulmonaire augmentée de 30%. Sensation de souffle court grandement résorbée."
                    : "Régénération alvéolaire avancée. Tissus sains de couleur rosée entièrement réinstallés !"}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default InteractiveLung3D;
