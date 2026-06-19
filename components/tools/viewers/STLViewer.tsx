'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls, STLLoader } from 'three-stdlib'

interface STLViewerProps {
    stlData: string
}

export default function STLViewer({ stlData }: STLViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current || !stlData) return

        const container = containerRef.current
        const width = container.clientWidth || 300
        const height = container.clientHeight || 300

        // Scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color('#111827') // slate-900

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        camera.position.set(100, 100, 100)

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.shadowMap.enabled = true
        container.appendChild(renderer.domElement)

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.maxDistance = 1000
        controls.minDistance = 5

        // Lighting
        const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
        scene.add(ambientLight)

        const dirLight1 = new THREE.DirectionalLight('#ffffff', 0.8)
        dirLight1.position.set(1, 1, 1).normalize()
        scene.add(dirLight1)

        const dirLight2 = new THREE.DirectionalLight('#ffffff', 0.3)
        dirLight2.position.set(-1, -1, -1).normalize()
        scene.add(dirLight2)

        // Grid Helper
        const gridHelper = new THREE.GridHelper(200, 50, '#374151', '#1f2937')
        scene.add(gridHelper)

        // Axes Helper
        const axesHelper = new THREE.AxesHelper(50)
        scene.add(axesHelper)

        // Mesh
        let mesh: THREE.Mesh | null = null
        try {
            const loader = new STLLoader()
            const geometry = loader.parse(stlData)
            
            // Center the geometry
            geometry.center()
            
            // material
            const material = new THREE.MeshStandardMaterial({
                color: '#3b82f6', // blue-500
                metalness: 0.5,
                roughness: 0.4,
                flatShading: true
            })
            
            mesh = new THREE.Mesh(geometry, material)
            
            // OpenSCAD Z-up orientation -> Three.js Y-up orientation
            mesh.rotation.x = -Math.PI / 2
            scene.add(mesh)

            // Auto fit camera
            geometry.computeBoundingSphere()
            const sphere = geometry.boundingSphere
            if (sphere) {
                const radius = sphere.radius
                controls.maxDistance = radius * 15
                camera.position.set(radius * 2.2, radius * 2.2, radius * 2.2)
                camera.lookAt(sphere.center)
                controls.target.copy(sphere.center)
                controls.update()
            }
        } catch (err) {
            console.error('Error parsing STL in STLViewer:', err)
        }

        // Animation Loop
        let animationFrameId: number
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        // Resize Listener
        const handleResize = () => {
            if (!container) return
            const w = container.clientWidth
            const h = container.clientHeight
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        window.addEventListener('resize', handleResize)

        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(animationFrameId)
            controls.dispose()
            
            if (mesh) {
                scene.remove(mesh)
                mesh.geometry.dispose()
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((m: THREE.Material) => m.dispose())
                } else {
                    mesh.material.dispose()
                }
            }

            scene.remove(gridHelper)
            gridHelper.geometry.dispose()
            if (Array.isArray(gridHelper.material)) {
                gridHelper.material.forEach((m: THREE.Material) => m.dispose())
            } else {
                gridHelper.material.dispose()
            }

            scene.remove(axesHelper)
            axesHelper.geometry.dispose()
            if (Array.isArray(axesHelper.material)) {
                axesHelper.material.forEach((m: THREE.Material) => m.dispose())
            } else {
                axesHelper.material.dispose()
            }

            renderer.dispose()
            try {
                container.removeChild(renderer.domElement)
            } catch (e) {
                // Ignore if container is already unmounted
            }
        }
    }, [stlData])

    return (
        <div ref={containerRef} className="w-full h-full min-h-[300px] relative rounded-lg overflow-hidden" />
    )
}
