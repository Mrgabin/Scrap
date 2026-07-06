import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { Eye, Zap, RefreshCw, LayoutTemplate } from "lucide-react";

// Noise Vertex shader
const noiseVertex = `
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos;
    uniform float uTime; uniform float uSpike;
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
        vec4 p = permute( permute( permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
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
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }
    void main() {
        vUv = uv; vNormal = normalize(normalMatrix * normal);
        float n = snoise(position * 2.5 + uTime * 0.5);
        float pulse = sin(uTime * 4.0) * 0.05;
        vec3 newPos = position + normal * (n * uSpike + pulse);
        vPos = newPos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
`;

// Plasma Fragment shader
const plasmaFragment = `
    uniform vec3 uColorA; uniform vec3 uColorB; uniform float uTime;
    varying vec3 vNormal; varying vec3 vPos;
    void main() {
        vec3 viewDir = normalize(cameraPosition - vPos);
        float fresnel = dot(viewDir, vNormal);
        fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
        fresnel = pow(fresnel, 2.0);
        float scan = sin(vPos.y * 50.0 + uTime * 5.0) * 0.05;
        vec3 color = mix(uColorA, uColorB, fresnel + scan);
        color += uColorB * fresnel * 2.5; 
        gl_FragColor = vec4(color, 1.0);
    }
`;

// Custom Lens Shader
const AdvancedLensShader = {
  uniforms: {
    'tDiffuse': { value: null as THREE.Texture | null },
    'uAberration': { value: 0.005 },
    'uDistortion': { value: 0.2 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uAberration;
    uniform float uDistortion;
    varying vec2 vUv;

    vec2 distort(vec2 uv, float k) {
        vec2 centered = uv - 0.5;
        float r2 = dot(centered, centered);
        float f = 1.0 + r2 * (k + k * sqrt(r2));
        return f * centered + 0.5;
    }

    void main() {
        vec2 uv = vUv;
        vec2 rUv = distort(uv, uDistortion - uAberration);
        vec2 gUv = distort(uv, uDistortion);
        vec2 bUv = distort(uv, uDistortion + uAberration);

        float r = texture2D(tDiffuse, rUv).r;
        float g = texture2D(tDiffuse, gUv).g;
        float b = texture2D(tDiffuse, bUv).b;

        float mask = 1.0;
        if(rUv.x < 0.0 || rUv.x > 1.0 || rUv.y < 0.0 || rUv.y > 1.0) mask = 0.0;
        if(bUv.x < 0.0 || bUv.x > 1.0 || bUv.y < 0.0 || bUv.y > 1.0) mask = 0.0;

        gl_FragColor = vec4(r, g, b, 1.0) * mask;
    }
  `
};

export default function QuantumCoreBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<"focus" | "warp" | "reset">("reset");
  const [showHUD, setShowHUD] = useState(true);

  // Smooth target configuration parameters updated by interaction buttons
  const targetsRef = useRef({
    spike: 0.3,
    color: new THREE.Color("#bc13fe"),
    bloomStrength: 1.6,
    particleSpeed: 1.0,
    aberration: 0.005,
    distortion: 0.15,
    shake: 0.0,
    mouseX: 0,
    mouseY: 0
  });

  // Handle interaction updates
  const setMode = (mode: "focus" | "warp" | "reset") => {
    setActiveMode(mode);
    if (mode === "focus") {
      targetsRef.current.spike = 0.1;
      targetsRef.current.color.set("#00f3ff");
      targetsRef.current.bloomStrength = 1.3;
      targetsRef.current.particleSpeed = 0.5;
      targetsRef.current.aberration = 0.002;
      targetsRef.current.distortion = 0.05;
      targetsRef.current.shake = 0.1;
    } else if (mode === "warp") {
      targetsRef.current.spike = 1.2;
      targetsRef.current.color.set("#ff0055");
      targetsRef.current.bloomStrength = 2.8;
      targetsRef.current.particleSpeed = 8.0;
      targetsRef.current.aberration = 0.04;
      targetsRef.current.distortion = 0.6;
      targetsRef.current.shake = 0.5;
    } else {
      targetsRef.current.spike = 0.3;
      targetsRef.current.color.set("#bc13fe");
      targetsRef.current.bloomStrength = 1.6;
      targetsRef.current.particleSpeed = 1.0;
      targetsRef.current.aberration = 0.005;
      targetsRef.current.distortion = 0.15;
      targetsRef.current.shake = 0.2;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.025);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 7;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 4. Core Mesh
    const sphereGeo = new THREE.IcosahedronGeometry(1.6, 64);
    const sphereMat = new THREE.ShaderMaterial({
      vertexShader: noiseVertex,
      fragmentShader: plasmaFragment,
      uniforms: {
        uTime: { value: 0 },
        uSpike: { value: 0.3 },
        uColorA: { value: new THREE.Color("#000000") },
        uColorB: { value: new THREE.Color("#bc13fe") }
      }
    });
    const coreMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(coreMesh);

    // 5. Ambient Particles
    const particleCount = 4000;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const r = 2.5 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * 0.5;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.sin(theta);
      speeds[i] = Math.random();
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xbc13fe,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // 6. Post-Processing Pipeline
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // Bloom
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 1.6;
    bloomPass.radius = 0.6;
    composer.addPass(bloomPass);

    // Film Grain
    const filmPass = new FilmPass(0.5, false);
    composer.addPass(filmPass);

    // Advanced Custom Lens Pass
    const lensPass = new ShaderPass(AdvancedLensShader);
    lensPass.uniforms.uAberration.value = 0.005;
    lensPass.uniforms.uDistortion.value = 0.15;
    composer.addPass(lensPass);

    // Interactive mouse capture
    const handleMouseMove = (e: MouseEvent) => {
      targetsRef.current.mouseX = (e.clientX - window.innerWidth / 2) * 0.0005;
      targetsRef.current.mouseY = (e.clientY - window.innerHeight / 2) * 0.0005;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Render loop parameters
    class CustomClock {
      private startTime = performance.now();
      private oldTime = performance.now();
      getElapsedTime() {
        return (performance.now() - this.startTime) / 1000;
      }
      getDelta() {
        const newTime = performance.now();
        const delta = (newTime - this.oldTime) / 1000;
        this.oldTime = newTime;
        return delta;
      }
    }
    const clock = new CustomClock();
    let animationFrameId: number;

    // Linear interpolation loop helper
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Core uniform updates
      sphereMat.uniforms.uTime.value = t;

      // Smooth interpolation steps
      const currentSpike = sphereMat.uniforms.uSpike.value;
      sphereMat.uniforms.uSpike.value += (targetsRef.current.spike - currentSpike) * 0.05;
      sphereMat.uniforms.uColorB.value.lerp(targetsRef.current.color, 0.05);

      // Bloom strength interpolation
      bloomPass.strength += (targetsRef.current.bloomStrength - bloomPass.strength) * 0.05;

      // Particle update
      particles.rotation.y = -t * 0.1 * targetsRef.current.particleSpeed;
      particlesMat.color.lerp(targetsRef.current.color, 0.05);

      // Lens parameters interpolation
      const currentDist = lensPass.uniforms.uDistortion.value;
      const currentAberr = lensPass.uniforms.uAberration.value;
      lensPass.uniforms.uDistortion.value += (targetsRef.current.distortion - currentDist) * 0.05;
      lensPass.uniforms.uAberration.value += (targetsRef.current.aberration - currentAberr) * 0.05;

      // Shake attenuation
      targetsRef.current.shake *= 0.92;
      const shakeX = (Math.random() - 0.5) * targetsRef.current.shake;
      const shakeY = (Math.random() - 0.5) * targetsRef.current.shake;

      // Camera lerp
      camera.position.x += (targetsRef.current.mouseX * 5 - camera.position.x) * 0.05 + shakeX;
      camera.position.y += (-targetsRef.current.mouseY * 5 - camera.position.y) * 0.05 + shakeY;
      camera.lookAt(scene.position);

      composer.render();
    };

    animate();

    // Resize observer
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      sphereGeo.dispose();
      sphereMat.dispose();
      particlesGeo.dispose();
      particlesMat.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none z-0 bg-[#050505]">
      {/* 3D Canvas container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 bg-[#050505]" />

      {/* Heavy vignette for premium atmosphere */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_110%)] pointer-events-none z-5" />

      {/* Optical HUD Overlay */}
      {showHUD && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-10 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.45)_100%)] z-1 animate-fadeIn">
          {/* Top Header */}
          <div className="text-center mt-12 flex justify-between items-start pointer-events-none w-full max-w-7xl mx-auto">
            <div className="text-left border-l-2 border-[#00f3ff] pl-5">
              <h1 className="text-md font-extrabold tracking-[0.4em] uppercase text-white font-sans">
                A E T H E R
              </h1>
              <span className="block text-[9px] text-[#00f3ff]/70 tracking-[0.2em] uppercase mt-1">
                OPTICAL SIMULATION v9.2
              </span>
            </div>

            <div className="text-right font-mono text-[9px] text-white/60 tracking-wider leading-relaxed">
              LENS: ASPHERICAL<br />
              ABERRATION: RADIAL<br />
              DISTORTION: {activeMode === "focus" ? "0.05 MIN" : activeMode === "warp" ? "0.60 MAX" : "0.15 NOMINAL"}
            </div>
          </div>

          {/* Interactive controls located inside the HUD (active interactive buttons) */}
          <div className="w-full max-w-xs mx-auto mb-16 flex flex-col items-center gap-3 pointer-events-auto">
            <div className="flex gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
              <button
                onClick={() => setMode("focus")}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMode === "focus"
                    ? "bg-[#00f3ff] text-black border-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.4)]"
                    : "bg-transparent text-white/70 border-transparent hover:bg-white/5 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Focus
              </button>

              <button
                onClick={() => setMode("warp")}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMode === "warp"
                    ? "bg-[#ff0055] text-white border-[#ff0055] shadow-[0_0_12px_rgba(255,0,85,0.4)]"
                    : "bg-transparent text-white/70 border-transparent hover:bg-white/5 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Warp
              </button>

              <button
                onClick={() => setMode("reset")}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMode === "reset"
                    ? "bg-[#bc13fe] text-white border-[#bc13fe] shadow-[0_0_12px_rgba(188,19,254,0.4)]"
                    : "bg-transparent text-white/70 border-transparent hover:bg-white/5 hover:text-white"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
            <span className="text-[9px] font-mono tracking-wider text-white/40 uppercase">
              Mode de Simulation Optique Actif
            </span>
          </div>
        </div>
      )}

      {/* Absolute Bottom Right controls to hide the complete simulation HUD */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={() => setShowHUD(!showHUD)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 rounded-full border border-white/10 hover:border-white/20 transition-all text-neutral-300 hover:text-white cursor-pointer select-none flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3"
          title="Afficher/Masquer le HUD d'Optiques"
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>HUD</span>
        </button>
      </div>
    </div>
  );
}
