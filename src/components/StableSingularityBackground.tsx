import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RefreshCw, LayoutTemplate } from "lucide-react";

const noiseChunk = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }
`;

const config = [
  {
    title: "Stable Singularity",
    status: "Topology: Nominal",
    morph: 0.1,
    compress: 1.0,
    intensity: 1.0,
    rotate: 0.4,
    camY: 25,
    camDist: 85,
    orbit: 1.0,
    color: "#00f3ff",
    vel: "0.45c"
  },
  {
    title: "Accretion Turbulence",
    status: "Topology: Fluctuating",
    morph: 4.5,
    compress: 1.15,
    intensity: 1.4,
    rotate: 1.5,
    camY: 45,
    camDist: 95,
    orbit: 1.8,
    color: "#ffaa00",
    vel: "0.78c"
  },
  {
    title: "Relativistic Collapse",
    status: "Topology: Critical",
    morph: 0.8,
    compress: 0.38,
    intensity: 3.5,
    rotate: 5.0,
    camY: 12,
    camDist: 55,
    orbit: 4.5,
    color: "#ff0044",
    vel: "0.99c"
  }
];

export default function StableSingularityBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [stateIdx, setStateIdx] = useState(0);

  // States to map layout text display
  const [hudTitle, setHudTitle] = useState(config[0].title);
  const [hudStatus, setHudStatus] = useState(config[0].status);
  const [hudColor, setHudColor] = useState(config[0].color);
  const [hudVel, setHudVel] = useState(config[0].vel);

  // Refs for smooth interpolation in the render loop without triggering full React re-renders
  const stateRef = useRef({
    currentIdx: 0,
    morph: config[0].morph,
    compress: config[0].compress,
    intensity: config[0].intensity,
    orbit: config[0].orbit,
    camY: config[0].camY,
    distance: config[0].camDist,
    rotate: config[0].rotate,
  });

  // Cycle states every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStateIdx((prev) => {
        const next = (prev + 1) % config.length;
        const s = config[next];
        setHudTitle(s.title);
        setHudStatus(s.status);
        setHudColor(s.color);
        setHudVel(s.vel);
        stateRef.current.currentIdx = next;
        return next;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Setup
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(60, 30, 60);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.03;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = stateRef.current.rotate;
    controls.enablePan = false;

    // 5. Core Singularity Group
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 6. Black Hole
    const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bhGeo = new THREE.SphereGeometry(4, 64, 64);
    coreGroup.add(new THREE.Mesh(bhGeo, bhMat));

    // 7. Aura Shader
    const auraMat = new THREE.ShaderMaterial({
      uniforms: { 
        uTime: { value: 0 }, 
        uIntensity: { value: 1.0 } 
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 4.0);
          gl_FragColor = vec4(vec3(1.0, 0.45, 0.1) * rim * uIntensity * 5.0, 1.0);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    coreGroup.add(new THREE.Mesh(new THREE.SphereGeometry(4.25, 64, 64), auraMat));

    // 8. Instanced accretion disk
    const instanceCount = 5000;
    const streakGeo = new THREE.CylinderGeometry(0.01, 0.12, 2.2, 3);
    streakGeo.rotateX(Math.PI / 2);

    const diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMorph: { value: 0.1 },
        uCompression: { value: 1.0 },
        uIntensity: { value: 1.0 },
        uOrbitScale: { value: 1.0 }
      },
      vertexShader: `
        ${noiseChunk}
        uniform float uTime;
        uniform float uMorph;
        uniform float uCompression;
        uniform float uIntensity;
        uniform float uOrbitScale;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float rOriginal = length(instPos.xz);
          float r = rOriginal * uCompression;
          float initialAngle = atan(instPos.z, instPos.x);
          float orbitalVelocity = (1.5 / sqrt(rOriginal)) * uOrbitScale;
          float currentAngle = initialAngle + (uTime * orbitalVelocity);
          vec3 morphedWorldPos = vec3(cos(currentAngle) * r, instPos.y, sin(currentAngle) * r);
          float noise = snoise(vec3(morphedWorldPos.x * 0.08, morphedWorldPos.z * 0.08, uTime * 0.3));
          morphedWorldPos.y += noise * uMorph * 4.0;
          vec3 viewDir = normalize(cameraPosition - morphedWorldPos);
          vec3 orbitDir = normalize(vec3(-sin(currentAngle), 0.0, cos(currentAngle)));
          float doppler = dot(orbitDir, viewDir);
          vec3 hot = vec3(1.0, 0.95, 0.9);
          vec3 warm = vec3(1.0, 0.45, 0.1);
          vec3 cool = vec3(0.1, 0.35, 1.0);
          vec3 color = mix(cool, warm, smoothstep(45.0, 12.0, r));
          color = mix(color, hot, smoothstep(10.0, 4.0, r));
          vColor = color * (1.3 + doppler * 0.7) * uIntensity;
          vOpacity = (smoothstep(3.8, 5.5, r) * (1.0 - smoothstep(38.0, 48.0, r))) * 0.8;
          float deltaAngle = currentAngle - initialAngle;
          float c = cos(deltaAngle);
          float s = sin(deltaAngle);
          mat3 rotY = mat3(
            c, 0, s,
            0, 1, 0,
            -s, 0, c
          );
          vec3 localPos = (instanceMatrix * vec4(position, 0.0)).xyz;
          vec3 rotatedLocalPos = rotY * localPos;
          gl_Position = projectionMatrix * viewMatrix * vec4(morphedWorldPos + rotatedLocalPos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(vColor, vOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const instancedDisk = new THREE.InstancedMesh(streakGeo, diskMaterial, instanceCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < instanceCount; i++) {
      const r = 5 + Math.pow(Math.random(), 1.3) * 40;
      const angle = Math.random() * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * (8 / r), Math.sin(angle) * r);
      dummy.lookAt(dummy.position.x + Math.sin(angle), dummy.position.y, dummy.position.z - Math.cos(angle));
      dummy.updateMatrix();
      instancedDisk.setMatrixAt(i, dummy.matrix);
    }
    scene.add(instancedDisk);

    // 9. Animation and smooth lerping
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = clock.getElapsedTime();
      diskMaterial.uniforms.uTime.value = time;
      auraMat.uniforms.uTime.value = time;
      instancedDisk.rotation.y += 0.0005;

      // Smooth interpolation towards selected configuration values
      const currentConfig = config[stateRef.current.currentIdx];
      const lerpFactor = 0.025; // Smooth 2.5% step per frame

      stateRef.current.morph += (currentConfig.morph - stateRef.current.morph) * lerpFactor;
      stateRef.current.compress += (currentConfig.compress - stateRef.current.compress) * lerpFactor;
      stateRef.current.intensity += (currentConfig.intensity - stateRef.current.intensity) * lerpFactor;
      stateRef.current.orbit += (currentConfig.orbit - stateRef.current.orbit) * lerpFactor;
      stateRef.current.rotate += (currentConfig.rotate - stateRef.current.rotate) * lerpFactor;
      stateRef.current.camY += (currentConfig.camY - stateRef.current.camY) * lerpFactor;
      stateRef.current.distance += (currentConfig.camDist - stateRef.current.distance) * lerpFactor;

      // Update uniforms
      diskMaterial.uniforms.uMorph.value = stateRef.current.morph;
      diskMaterial.uniforms.uCompression.value = stateRef.current.compress;
      diskMaterial.uniforms.uIntensity.value = stateRef.current.intensity;
      diskMaterial.uniforms.uOrbitScale.value = stateRef.current.orbit;
      auraMat.uniforms.uIntensity.value = stateRef.current.intensity;

      // Update controls auto rotate speed
      controls.autoRotateSpeed = stateRef.current.rotate;

      // Adjust camera distance and height smoothly
      const currentDir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
      camera.position.x = controls.target.x + currentDir.x * stateRef.current.distance;
      camera.position.y += (stateRef.current.camY - camera.position.y) * lerpFactor;
      camera.position.z = controls.target.z + currentDir.z * stateRef.current.distance;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Controls rotation binding
    controls.autoRotate = autoRotate;

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (controls) controls.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      bhGeo.dispose();
      bhMat.dispose();
      auraMat.dispose();
      streakGeo.dispose();
      diskMaterial.dispose();
      instancedDisk.dispose();
    };
  }, [autoRotate]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none z-0">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 bg-[#010103]" />

      {/* Vignette Overlay for maximum visual polish */}
      <div className="fixed inset-0 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.85)_150%)] pointer-events-none z-5" />

      {/* Futuristic HUD overlay (Rendered behind the main app interface) */}
      {showHUD && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-10 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)] z-1">
          {/* Top Header info */}
          <div className="text-center mt-12">
            <h1 className="text-sm font-extralight tracking-[0.6em] uppercase text-white/90 mb-2 transition-all duration-1000">
              {hudTitle}
            </h1>
            <span 
              className="inline-block px-4 py-1.5 bg-white/3 border rounded-full text-[9px] tracking-[0.2em] uppercase transition-all duration-1000 backdrop-blur-[2px]"
              style={{ color: hudColor, borderColor: `${hudColor}33` }}
            >
              {hudStatus}
            </span>
          </div>

          {/* Bottom HUD metrics */}
          <div className="flex justify-between items-end font-mono text-[10px] text-white/50 tracking-wider">
            <div className="flex flex-col gap-1">
              <div>MASS_INDEX: <span className="font-bold text-[#00f3ff]">4.2M SOL</span></div>
              <div>LENSING: <span className="font-bold transition-all duration-1000" style={{ color: hudColor }}>SCHWARZSCHILD</span></div>
            </div>
            <div className="text-right flex flex-col gap-1">
              <div>RELATIVITY: <span className="font-bold transition-all duration-1000" style={{ color: hudColor }}>{hudVel}</span></div>
              <div>RADIATION: <span className="font-bold text-[#00f3ff]">DETECTION ON</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive controls button */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowHUD(!showHUD)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 rounded-full border border-white/10 hover:border-white/20 transition-all text-neutral-300 hover:text-white cursor-pointer select-none"
          title="Afficher/Masquer le HUD"
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
        </button>

        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-neutral-300 hover:text-white select-none">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="flex items-center gap-1.5 cursor-pointer outline-none"
            title={autoRotate ? "Désactiver la rotation" : "Activer la rotation"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} style={{ animationDuration: "12s" }} />
            <span>Rotation: {autoRotate ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
