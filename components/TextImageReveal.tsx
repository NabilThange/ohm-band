'use client'

import { useEffect } from 'react'
import Image from 'next/image'

export default function TextImageReveal() {
    useEffect(() => {
        // Dynamically import GSAP and its plugins
        const loadAnimations = async () => {
            const { gsap } = await import('gsap')
            const { ScrollTrigger } = await import('gsap/ScrollTrigger')
            const Lenis = (await import('@studio-freight/lenis')).default

            gsap.registerPlugin(ScrollTrigger)

            const lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            })

            lenis.on('scroll', ScrollTrigger.update)

            gsap.ticker.add((time) => {
                lenis.raf(time * 1000)
            })

            gsap.ticker.lagSmoothing(0)

            // Animate each line's image span
            document.querySelectorAll('.reveal-line').forEach((line) => {
                const imgSpan = line.querySelector('.reveal-img-span')

                if (imgSpan) {
                    gsap.to(imgSpan, {
                        width: 300,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: line,
                            start: 'top 90%',
                            end: 'top 40%',
                            scrub: 1,
                        },
                    })
                }
            })

            return () => {
                lenis.destroy()
            }
        }

        loadAnimations()
    }, [])

    return (
        <div className="w-full min-h-screen flex flex-col justify-center items-center py-20 bg-background">
            <div className="flex flex-col justify-center items-center gap-4">
                <div className="reveal-line flex justify-center items-center gap-5">
                    <span className="text-7xl md:text-[7.5rem] font-bold tracking-[-4px]">We craft</span>
                    <span className="reveal-img-span h-[110px] w-0 rounded-[5px] overflow-hidden relative">
                        <img
                            src="https://i.pinimg.com/1200x/93/27/65/932765c7cd00055218ba7398119d7d4d.jpg"
                            alt="Craft"
                            className="h-full w-[300px] absolute left-1/2 -translate-x-1/2 rounded-[5px] object-cover object-center"
                        />
                    </span>
                    <span className="text-7xl md:text-[7.5rem] font-bold tracking-[-4px]">digital</span>
                </div>

                <div className="reveal-line flex justify-center items-center gap-5">
                    <span className="text-7xl md:text-[7.5rem] font-bold tracking-[-4px]">experiences</span>
                    <span className="reveal-img-span h-[110px] w-0 rounded-[5px] overflow-hidden relative">
                        <img
                            src="https://i.pinimg.com/736x/a9/f1/19/a9f11909a9644d7bfd5102fabcd8310c.jpg"
                            alt="Experiences"
                            className="h-full w-[300px] absolute left-1/2 -translate-x-1/2 rounded-[5px] object-cover object-center"
                        />
                    </span>
                    <span className="text-7xl md:text-[7.5rem] font-bold tracking-[-4px]">that</span>
                </div>

                <div className="reveal-line flex justify-center items-center gap-5">
                    <span className="text-7xl md:text-[7.5rem] font-bold tracking-[-4px]">inspire</span>
                    <span className="reveal-img-span h-[110px] w-0 rounded-[5px] overflow-hidden relative">
                        <img
                            src="https://i.pinimg.com/1200x/48/09/77/480977567d6b4503c8f642728f266b72.jpg"
                            alt="Inspire"
                            className="h-full w-[300px] absolute left-1/2 -translate-x-1/2 rounded-[5px] object-cover object-center"
                        />
                    </span>
                </div>

                <div className="reveal-line flex justify-center items-center gap-5">
                    <span className="text-7xl md:text-[7.5rem] font-bold tracking-[-4px]">and move</span>
                </div>

                <div className="reveal-line flex justify-center items-center gap-5">
                    <span className="text-7xl md:text-[7.5rem] font-bold tracking-[-4px]">people</span>
                    <span className="reveal-img-span h-[110px] w-0 rounded-[5px] overflow-hidden relative">
                        <img
                            src="https://i.pinimg.com/1200x/9e/f2/b7/9ef2b73b1e2ff489f99bc0a90196fbea.jpg"
                            alt="People"
                            className="h-full w-[300px] absolute left-1/2 -translate-x-1/2 rounded-[5px] object-cover object-center"
                        />
                    </span>
                    <span className="text-7xl md:text-[7.5rem] font-bold tracking-[-4px]">forward.</span>
                </div>
            </div>
        </div>
    )
}
