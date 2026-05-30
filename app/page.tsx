"use client";

import { useEffect, useRef } from "react";

const projects = [
  {
    title: "Realtime Ops Dashboard",
    description:
      "Event-stream visualization platform with resilient polling fallbacks and advanced alert routing.",
    stack: "Next.js, TypeScript, PostgreSQL",
  },
  {
    title: "Commerce API Toolkit",
    description:
      "Composable SDK and CLI for integrating payments, inventory sync, and fulfillment workflows.",
    stack: "Node.js, GraphQL, Redis",
  },
  {
    title: "Performance Lab",
    description:
      "Automated lighthouse and profiling pipeline that cut load times by 42% across core pages.",
    stack: "React, Vite, Playwright",
  },
];

export default function Home() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cursor = cursorRef.current;

    if (!cursor) {
      return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let followerX = mouseX;
    let followerY = mouseY;
    let animationFrame = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const animate = () => {
      const dx = mouseX - followerX;
      const dy = mouseY - followerY;

      followerX += dx * 0.13;
      followerY += dy * 0.13;

      const sideOffsetX = 29;
      const sideOffsetY = -20;
      cursor.style.transform = `translate3d(${followerX + sideOffsetX}px, ${followerY + sideOffsetY}px, 0)`;
      animationFrame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="triangle-cursor" aria-hidden="true" />
      <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_#fee2e2,_transparent_40%),radial-gradient(circle_at_bottom_left,_#e0f2fe,_transparent_35%),#0b1017] text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-12">
          <header className="flex items-center justify-between border-b border-white/15 pb-5">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Developer Portfolio</p>
            <a
              href="#contact"
              className="rounded-full border border-cyan-300/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition hover:bg-cyan-300/10"
            >
              Let&apos;s Build
            </a>
          </header>

          <section className="grid flex-1 items-center gap-12 py-14 md:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="mb-4 text-sm uppercase tracking-[0.2em] text-sky-200/90">Hi, I&apos;m Alex</p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
                Shipping products with clean architecture and memorable UX.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                I design and build full-stack experiences, from resilient APIs to high-performance frontends. I care
                about practical engineering, sharp product thinking, and developer happiness.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-white/10 px-4 py-2">TypeScript</span>
                <span className="rounded-full bg-white/10 px-4 py-2">Next.js</span>
                <span className="rounded-full bg-white/10 px-4 py-2">System Design</span>
                <span className="rounded-full bg-white/10 px-4 py-2">Cloud Infrastructure</span>
              </div>
            </div>

            <aside className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Current Focus</p>
              <ul className="mt-4 space-y-4 text-sm text-slate-200">
                <li>Building maintainable product foundations for startups.</li>
                <li>Performance tuning for modern React applications.</li>
                <li>Mentoring teams on scalable frontend architecture.</li>
              </ul>
            </aside>
          </section>

          <section className="pb-14">
            <h2 className="text-2xl font-semibold">Selected Work</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project.title}
                  className="rounded-2xl border border-white/10 bg-black/25 p-5 transition hover:-translate-y-1 hover:border-cyan-200/60"
                >
                  <h3 className="text-lg font-medium">{project.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{project.description}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.15em] text-cyan-200/80">{project.stack}</p>
                </article>
              ))}
            </div>
          </section>

          <footer id="contact" className="border-t border-white/15 pt-6 text-sm text-slate-300">
            <p>Open to freelance and full-time roles.</p>
            <a href="mailto:hello@alex.dev" className="mt-2 inline-block text-cyan-200 hover:text-cyan-100">
              hello@alex.dev
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
