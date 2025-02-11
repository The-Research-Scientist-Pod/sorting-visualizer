/* eslint-disable-next-line no-unused-vars */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

const DisparityParticleSystem = ({ array, currentIndices }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const particlesRef = useRef(null);
    const rotationRef = useRef(0);
    const animationFrameRef = useRef(null);

    // Calculate the disparity (distance from correct position)
    const calculateDisparity = (value, currentIndex) => {
        const correctIndex = value - 1; // Since our values are 1-based
        return Math.abs(currentIndex - correctIndex) / array.length;
    };

    // Convert disparity to 3D position
    const getParticlePosition = (disparity, index, totalParticles) => {
        const angle = (index / totalParticles) * Math.PI * 2;
        const radius = 2 + disparity * 2; // Base radius + disparity effect

        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: disparity * 2 // Add some depth based on disparity
        };
    };

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

        camera.position.set(0, 0, 15);
        camera.lookAt(0, 0, 0);

        // Create particle system
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                activeIndices: { value: new Float32Array(2) },
                rotationAngle: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 customColor;
                attribute float index;
                uniform float time;
                uniform float rotationAngle;
                uniform vec2 activeIndices;
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vColor = customColor;
                    
                    // Apply gentle rotation to the entire system
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
                    vAlpha = 0.95 + isActive * (0.05 * sin(time * 5.0));
                    
                    gl_PointSize = size * pulseFactor * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vec2 xy = gl_PointCoord.xy - vec2(0.5);
                    float radius = length(xy);
                    float alpha = smoothstep(0.5, 0.4, radius) * vAlpha;
                    
                    // Internal shading for more tactile look
                    vec3 shadedColor = vColor * (1.0 - radius * 0.3);
                    gl_FragColor = vec4(shadedColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const positions = [];
        const colors = [];
        const sizes = [];
        const indices = [];

        array.forEach((value, idx) => {
            const disparity = calculateDisparity(value, idx);
            const pos = getParticlePosition(disparity, idx, array.length);

            positions.push(pos.x, pos.y, pos.z);

            // Color based on sorting completion (green = correct position, red = incorrect)
            const color = new THREE.Color(disparity, 1 - disparity, 0);
            color.multiplyScalar(0.8); // Slightly darker for better visibility
            colors.push(color.r, color.g, color.b);

            // Size slightly varies with disparity
            const size = 0.1 + (1 - disparity) * 0.1;
            sizes.push(size);

            indices.push(idx);
        });

        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particleGeometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        particleGeometry.setAttribute('index', new THREE.Float32BufferAttribute(indices, 1));

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);
        particlesRef.current = particles;

        // Add ambient light
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
        const colors = particles.geometry.attributes.customColor.array;
        const sizes = particles.geometry.attributes.size.array;

        array.forEach((value, idx) => {
            const disparity = calculateDisparity(value, idx);
            const pos = getParticlePosition(disparity, idx, array.length);

            positions[idx * 3] = pos.x;
            positions[idx * 3 + 1] = pos.y;
            positions[idx * 3 + 2] = pos.z;

            // Update color based on disparity
            const color = new THREE.Color(disparity, 1 - disparity, 0);
            color.multiplyScalar(0.8);
            colors[idx * 3] = color.r;
            colors[idx * 3 + 1] = color.g;
            colors[idx * 3 + 2] = color.b;

            // Update size
            sizes[idx] = 0.1 + (1 - disparity) * 0.1;
        });

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.customColor.needsUpdate = true;
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

DisparityParticleSystem.propTypes = {
    array: PropTypes.arrayOf(PropTypes.number).isRequired,
    currentIndices: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default DisparityParticleSystem;