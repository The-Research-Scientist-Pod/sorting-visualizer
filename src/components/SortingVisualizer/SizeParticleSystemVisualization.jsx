/* eslint-disable-next-line no-unused-vars */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

const SizeParticleSystem = ({ array, currentIndices }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const particlesRef = useRef(null);
    const rotationRef = useRef(0);
    const animationFrameRef = useRef(null);

    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        const mount = mountRef.current;
        const width = mount.clientWidth;
        const height = mount.clientHeight;

        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);

        // Calculate optimal camera position based on grid size
        const gridSize = Math.ceil(Math.pow(array.length, 1/3));
        const maxDimension = Math.max(gridSize * 0.6, 4);
        camera.position.set(maxDimension, maxDimension, maxDimension);
        camera.lookAt(0, 0, 0);

        // Create particle system
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                activeIndices: { value: new Float32Array(2) },
                rotationAngle: { value: 0 },
                baseColor: { value: new THREE.Color(0x00AA00) } // Darker green base color
            },
            vertexShader: `
                attribute float size;
                attribute float index;
                uniform float time;
                uniform float rotationAngle;
                uniform vec2 activeIndices;
                uniform vec3 baseColor;
                varying vec3 vColor;
                
                void main() {
                    vColor = baseColor;
                    
                    float cosR = cos(rotationAngle);
                    float sinR = sin(rotationAngle);
                    vec3 rotatedPosition = vec3(
                        position.x * cosR - position.z * sinR,
                        position.y,
                        position.x * sinR + position.z * cosR
                    );
                    
                    vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);
                    
                    float isActive = 0.0;
                    if (index == activeIndices.x || index == activeIndices.y) {
                        isActive = 1.0;
                    }
                    
                    float pulseFactor = 1.0 + isActive * (0.2 * sin(time * 5.0) + 0.2);
                    gl_PointSize = size * pulseFactor * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    vec2 xy = gl_PointCoord.xy - vec2(0.5);
                    float radius = length(xy);
                    
                    // More defined particles with controlled transparency
                    float alpha = smoothstep(0.5, 0.4, radius) * 0.95;
                    vec3 shadedColor = vColor * (1.0 - radius * 0.3); // Subtle shading
                    gl_FragColor = vec4(shadedColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const spacing = 0.5;
        const positions = [];
        const sizes = [];
        const indices = [];

        array.forEach((value, idx) => {
            const x = ((idx % gridSize) - (gridSize - 1) / 2) * spacing;
            const y = ((Math.floor(idx / gridSize) % gridSize) - (gridSize - 1) / 2) * spacing;
            const z = ((Math.floor(idx / (gridSize * gridSize))) - (gridSize - 1) / 2) * spacing;

            positions.push(x, y, z);

            // Size is now directly proportional to value but with smaller range
            const size = 0.1 + (value / array.length) * 0.3;
            sizes.push(size);
            indices.push(idx);
        });

        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particleGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        particleGeometry.setAttribute('index', new THREE.Float32BufferAttribute(indices, 1));

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);
        particlesRef.current = particles;

        // Ambient light for better visibility
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // Animation
        let time = 0;
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            time += 0.01;
            rotationRef.current += 0.002;

            particles.material.uniforms.time.value = time;
            particles.material.uniforms.rotationAngle.value = rotationRef.current;

            renderer.render(scene, camera);
        };

        animate();
        sceneRef.current = { scene, camera, renderer };

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            mount.removeChild(renderer.domElement);
            particleGeometry.dispose();
            particleMaterial.dispose();
        };
    }, [array.length]);

    // Update particles when array changes
    useEffect(() => {
        const particles = particlesRef.current;
        if (!particles) return;

        const positions = particles.geometry.attributes.position.array;
        const sizes = particles.geometry.attributes.size.array;
        const gridSize = Math.ceil(Math.pow(array.length, 1/3));
        const spacing = 0.5;

        array.forEach((value, idx) => {
            const x = ((idx % gridSize) - (gridSize - 1) / 2) * spacing;
            const y = ((Math.floor(idx / gridSize) % gridSize) - (gridSize - 1) / 2) * spacing;
            const z = ((Math.floor(idx / (gridSize * gridSize))) - (gridSize - 1) / 2) * spacing;

            positions[idx * 3] = x;
            positions[idx * 3 + 1] = y;
            positions[idx * 3 + 2] = z;

            // Update sizes
            sizes[idx] = 0.1 + (value / array.length) * 0.3;
        });

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.size.needsUpdate = true;

        particles.material.uniforms.activeIndices.value = new Float32Array([
            currentIndices[0] || -1,
            currentIndices[1] || -1
        ]);
    }, [array, currentIndices]);

    useEffect(() => {
        const handleResize = () => {
            if (!sceneRef.current) return;

            const { camera, renderer } = sceneRef.current;
            const mount = mountRef.current;
            const width = mount.clientWidth;
            const height = mount.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <div ref={mountRef} className="w-full h-full" />;
};

SizeParticleSystem.propTypes = {
    array: PropTypes.arrayOf(PropTypes.number).isRequired,
    currentIndices: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default SizeParticleSystem;