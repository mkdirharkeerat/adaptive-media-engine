import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * Procedural 3D Physical Media Case (Book / UHD Case / Box Set)
 * Built with procedural geometry, multi-material mapping, and interactive inertial physics
 * following img2threejs procedural reconstruction principles.
 */
export const PhysicalMediaCase3D = ({
  title = 'Dune: Part One',
  mediaType = 'movie', // 'movie' | 'tv' | 'book'
  year = '2021',
  posterUrl = null,
  affinity = '0.94',
  className = 'w-full h-80',
}) => {
  const mountRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lighting (Reading Room Studio Key + Rim Light)
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    keyLight.position.set(3, 4, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xc4975a, 1.1); // Gilded amber rim
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // 4. Procedural Textures via Offscreen Canvas
    const createSpineTexture = (text, type, yr) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Leather/Obsidian background
      ctx.fillStyle = type === 'book' ? '#2A1F18' : '#141312';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gold foil accents
      ctx.fillStyle = '#C4975A';
      ctx.fillRect(10, 20, canvas.width - 20, 6);
      ctx.fillRect(10, canvas.height - 30, canvas.width - 20, 6);

      // Vertical text
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 36px serif';
      ctx.fillStyle = '#FAF8F5';
      ctx.fillText(text.slice(0, 32), 0, -4);

      ctx.font = '22px monospace';
      ctx.fillStyle = '#C4975A';
      ctx.fillText(`[ ${yr} • ${type.toUpperCase()} ]`, 0, 34);
      ctx.restore();

      return new THREE.CanvasTexture(canvas);
    };

    const createCoverTexture = (txt, type, yr, score) => {
      const canvas = document.createElement('canvas');
      canvas.width = 768;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Dark obsidian background with noise-like gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#1E1B18');
      grad.addColorStop(1, '#0F0E0D');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Frame border
      ctx.strokeStyle = '#C4975A';
      ctx.lineWidth = 8;
      ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

      // Header
      ctx.fillStyle = '#C4975A';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ADAPTIVE ARCHIVE • AFFINITY ${score}`, canvas.width / 2, 80);

      // Title
      ctx.fillStyle = '#FAF8F5';
      ctx.font = 'bold 54px serif';
      const words = txt.split(' ');
      let line = '';
      let y = canvas.height / 2 - 40;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > canvas.width - 140 && n > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = words[n] + ' ';
          y += 68;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);

      // Year badge
      ctx.fillStyle = '#9C948A';
      ctx.font = '28px monospace';
      ctx.fillText(`RELEASE YEAR: ${yr} • ARCHIVE SPEC`, canvas.width / 2, canvas.height - 90);

      return new THREE.CanvasTexture(canvas);
    };

    // 5. Procedural Mesh Geometry (Physical Book or Media Box Dimensions)
    const isBook = mediaType === 'book';
    const caseWidth = 1.9;
    const caseHeight = 2.7;
    const caseDepth = isBook ? 0.42 : 0.28;

    const geometry = new THREE.BoxGeometry(caseWidth, caseHeight, caseDepth);

    // Cover material loader
    const textureLoader = new THREE.TextureLoader();
    let frontTexture = posterUrl
      ? textureLoader.load(posterUrl)
      : createCoverTexture(title, mediaType, year, affinity);

    const spineTexture = createSpineTexture(title, mediaType, year);

    // BoxGeometry material ordering: [right, left, top, bottom, front, back]
    // Right = Page edges/tray, Left = Spine, Front = Cover, Back = Rear cover
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: isBook ? 0xf5eedc : 0x222222, // Gilded / parchment paper edges
      roughness: 0.9,
    });

    const spineMaterial = new THREE.MeshStandardMaterial({
      map: spineTexture,
      roughness: 0.35,
      metalness: 0.15,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      roughness: 0.4,
      metalness: 0.1,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: 0x181615,
      roughness: 0.5,
    });

    const materials = [
      edgeMaterial,  // +X right (page edges)
      spineMaterial, // -X left (spine)
      edgeMaterial,  // +Y top
      edgeMaterial,  // -Y bottom
      frontMaterial, // +Z front cover
      backMaterial,  // -Z back cover
    ];

    const caseMesh = new THREE.Mesh(geometry, materials);
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    scene.add(caseMesh);

    // Initial slight angle
    caseMesh.rotation.y = 0.45;
    caseMesh.rotation.x = 0.05;

    // 6. Interactive Drag Physics & Smooth Idle Float
    let targetRotationY = 0.45;
    let targetRotationX = 0.05;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      setIsInteracting(true);
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotationY += deltaX * 0.012;
      targetRotationX += deltaY * 0.012;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 2000);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle floating levitation when not dragged
      if (!isDragging) {
        caseMesh.position.y = Math.sin(elapsed * 1.5) * 0.06;
        targetRotationY += 0.003; // continuous lazy rotation
      }

      // Smooth damping interpolation
      caseMesh.rotation.y += (targetRotationY - caseMesh.rotation.y) * 0.08;
      caseMesh.rotation.x += (targetRotationX - caseMesh.rotation.x) * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, [title, mediaType, year, posterUrl, affinity]);

  return (
    <div className={`relative ${className} select-none cursor-grab active:cursor-grabbing`}>
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[10px] font-mono text-gilded-amber uppercase tracking-wider pointer-events-none">
        {isInteracting ? 'Inspecting 3D Physical Model' : 'Drag to Rotate 3D Case'}
      </div>
    </div>
  );
};

export default PhysicalMediaCase3D;
