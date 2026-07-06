import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RefreshCw, LayoutTemplate } from "lucide-react";

const shaderChunk = `
    vec3 hash33(vec3 p3) {
        p3 = fract(p3 * vec3(.1031, .1030, .0973));
        p3 += dot(p3, p3.yxz+33.33);
        return fract((p3.xxy + p3.yzz)*p3.zyx);
    }

    // Returns vec2(distance to edge, cell ID)
    vec2 voronoi(vec3 p, float time) {
        vec3 g = floor(p);
        vec3 f = fract(p);
        float res = 8.0;
        float id = 0.0;
        for(int y=-1; y<=1; y++) {
            for(int x=-1; x<=1; x++) {
                for(int z=-1; z<=1; z++) {
                    vec3 b = vec3(float(x), float(y), float(z));
                    vec3 p_cell = hash33(g + b);
                    // Animate plate movement
                    vec3 r = b + 0.5 + 0.5*sin(time + 6.2831*p_cell) - f;
                    float d = dot(r, r);
                    if(d < res) {
                        res = d;
                        id = p_cell.x;
                    }
                }
            }
        }
        return vec2(sqrt(res), id);
    }
`;

const vertexShader = `
    varying vec3 vPos;
    varying vec3 vNormal;
    varying float vHeat;
    uniform float uTime;
    ${shaderChunk}
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vPos = position;
        
        // Calculate Tectonic Plate Displacement
        vec2 v = voronoi(position * 1.8, uTime * 0.4);
        float distToCenter = v.x;
        
        // The fissures occur at the edges (high distToCenter)
        // We push the "plates" (centers) outward more than the fissures
        float plateMask = smoothstep(0.2, 0.7, 1.0 - distToCenter);
        vHeat = pow(distToCenter, 4.0); // Fissures are hot
        
        vec3 newPos = position + normal * (plateMask * 0.15);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
`;

const fragmentShader = `
    varying vec3 vPos;
    varying vec3 vNormal;
    varying float vHeat;
    uniform float uTime;
    uniform vec3 uCameraPos;
    void main() {
        // Fresnel for rim lighting on rock edges
        vec3 viewDir = normalize(uCameraPos - vPos);
        float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
        // Lava Color Gradient
        vec3 crust = vec3(0.02, 0.01, 0.01); // Cold Carbon
        vec3 lavaDeep = vec3(0.8, 0.1, 0.0); // Molten Red
        vec3 lavaMid = vec3(1.0, 0.4, 0.0);  // Burning Orange
        vec3 lavaHot = vec3(1.0, 1.0, 0.6);  // Incandescent Yellow
        // Map vHeat to the gradient
        vec3 color = mix(crust, lavaDeep, smoothstep(0.1, 0.4, vHeat));
        color = mix(color, lavaMid, smoothstep(0.4, 0.7, vHeat));
        color = mix(color, lavaHot, smoothstep(0.7, 1.0, vHeat));
        // Add intensity to the fissures
        float pulse = 1.0 + 0.2 * sin(uTime * 2.0 + vHeat * 10.0);
        vec3 emission = color * pow(vHeat, 3.0) * 5.0 * pulse;
        gl_FragColor = vec4(color + emission + (fresnel * 0.1), 1.0);
    }
`;

export default function TectonicLavaBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showHUD, setShowHUD] = useState(true);

  // Core metrics states for atmospheric HUD
  const [seismicActivity, setSeismicActivity] = useState("Nominal");
  const [plateDrift, setPlateDrift] = useState("0.12 mm/s");
  const [coreHeat, setCoreHeat] = useState("1,450 °C");
  const [warningLevel, setWarningLevel] = useState("Safe");

  // Dynamically update metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const isHigh = Math.random() > 0.8;
      if (isHigh) {
        setSeismicActivity("High Activity Detected");
        setPlateDrift((0.25 + Math.random() * 0.3).toFixed(2) + " mm/s");
        setCoreHeat((1520 + Math.floor(Math.random() * 120)) + " °C");
        setWarningLevel("Warning: Seismic Tension");
      } else {
        setSeismicActivity("Steady Drift");
        setPlateDrift((0.08 + Math.random() * 0.06).toFixed(2) + " mm/s");
        setCoreHeat((1380 + Math.floor(Math.random() * 80)) + " °C");
        setWarningLevel("Safe");
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 2.5;
    controls.maxDistance = 8.0;
    controls.enablePan = false;

    // 5. Shader Material and Icosahedron Mesh
    const geo = new THREE.IcosahedronGeometry(1.8, 128);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraPos: { value: camera.position }
      },
      vertexShader,
      fragmentShader
    });

    const core = new THREE.Mesh(geo, mat);
    scene.add(core);

    // 6. Post-Processing Bloom Setup
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.6, // bloom intensity
      0.45, // radius
      0.15  // threshold
    );
    composer.addPass(bloomPass);

    // 7. Render Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      mat.uniforms.uTime.value = elapsedTime;
      mat.uniforms.uCameraPos.value.copy(camera.position);

      if (autoRotate) {
        core.rotation.y += 0.0012;
        core.rotation.x += 0.0003;
      }

      controls.update();
      composer.render();
    };

    animate();

    // 8. Handle Resize
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
      resizeObserver.disconnect();
      if (controls) controls.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      geo.dispose();
      mat.dispose();
    };
  }, [autoRotate]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none z-0 bg-[#000]">
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 bg-[#000]" />

      {/* Atmospheric Vignette */}
      <div className="fixed inset-0 bg-[radial-gradient(circle,transparent_45%,rgba(0,0,0,0.95)_140%)] pointer-events-none z-5" />

      {/* Real-time HUD overlay */}
      {showHUD && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-10 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)] z-1 animate-fadeIn">
          {/* Top Header */}
          <div className="text-center mt-12">
            <h1 className="text-sm font-extralight tracking-[0.6em] uppercase text-red-500/90 mb-2 font-sans">
              Tectonic Lava Fissure
            </h1>
            <span 
              className={`inline-block px-4 py-1.5 bg-black/40 border rounded-full text-[9px] tracking-[0.2em] uppercase transition-all duration-1000 backdrop-blur-[2px] ${
                warningLevel !== "Safe" 
                  ? "text-amber-500 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]" 
                  : "text-red-500/70 border-red-500/20"
              }`}
            >
              Plate Status: {seismicActivity}
            </span>
          </div>

          {/* Bottom HUD metrics */}
          <div className="flex justify-between items-end font-mono text-[10px] text-red-500/60 tracking-wider">
            <div className="flex flex-col gap-1">
              <div>HEAT_INDEX: <span className="font-bold text-red-400">{coreHeat}</span></div>
              <div>DRIFT_RATE: <span className="font-bold text-orange-400">{plateDrift}</span></div>
            </div>
            <div className="text-right flex flex-col gap-1">
              <div>VOLCANIC_THREAT: <span className={`font-bold uppercase ${warningLevel !== "Safe" ? "text-amber-500" : "text-emerald-500"}`}>{warningLevel}</span></div>
              <div>BLOOM_INTENSITY: <span className="font-bold text-red-400">1.6 LUX</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
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
