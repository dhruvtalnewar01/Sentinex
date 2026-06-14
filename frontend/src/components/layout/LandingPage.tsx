import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../stores/useIncidentStore';

export default function LandingPage() {
  const { setAppView } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef1 = useRef<HTMLDivElement>(null);
  const textRef2 = useRef<HTMLDivElement>(null);
  const textRef3 = useRef<HTMLDivElement>(null);
  const textRef4 = useRef<HTMLDivElement>(null);
  const totalFrames = 160;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is the computational latency overhead for the 7-agent consensus resolution?",
      a: "Our pipeline executes the full consensus matrix within 45 milliseconds on average, leveraging highly optimized Go-based orchestration routines and edge caching."
    },
    {
      q: "How does the Orthogonal Defense layer mitigate adversarial hallucinations?",
      a: "By employing deterministic verification against real-time sandbox executions and static analysis heuristics, the layer rejects non-factual reasoning paths before execution."
    },
    {
      q: "Can the orchestration matrix pipeline adapt to black swan volatility clusters?",
      a: "Yes. The underlying system automatically scales horizontally, dynamically reallocating agent compute pools based on severity density and threat velocity patterns."
    },
    {
      q: "What cryptographic safeguards isolate execution node permissions?",
      a: "Execution nodes operate within ephemeral, heavily sandboxed containers utilizing temporal JWTs and mutual TLS, ensuring zero lateral movement capability even if compromised."
    },
    {
      q: "How does the multi-stage Orchestrator handle severe market divergence?",
      a: "The orchestrator implements aggressive circuit breakers and failsafes. When divergence exceeds threshold tolerances, control is automatically escalated to Human-In-The-Loop protocols."
    }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Load images
    const images: HTMLImageElement[] = [];
    let loadedImages = 0;

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      // Pad to 3 digits (e.g. 001, 002... 160)
      const paddedIndex = i.toString().padStart(3, '0');
      img.src = `/landing-frames/ezgif-frame-${paddedIndex}.jpg`;
      img.onload = () => {
        loadedImages++;
        if (loadedImages === 1 && i === 1) {
          // Draw first frame once it loads
          drawImage(img);
        }
      };
      images.push(img);
    }

    function drawImage(img: HTMLImageElement) {
      if (!canvas || !context) return;
      // Calculate scaling to cover the whole canvas (object-fit: cover equivalent)
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    const handleScroll = () => {
      // Calculate scroll progress (0 to 1)
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollFraction = scrollTop / maxScroll;

      // Calculate corresponding frame (1 to 160)
      const frameIndex = Math.min(
        totalFrames - 1,
        Math.floor(scrollFraction * totalFrames)
      );

      // Request animation frame to draw
      requestAnimationFrame(() => {
        if (images[frameIndex] && images[frameIndex].complete) {
          drawImage(images[frameIndex]);
        }

        // Handle text opacity/transform
        const updateText = (ref: React.RefObject<HTMLDivElement | null>, startFrame: number, endFrame: number) => {
          if (!ref.current) return;
          if (frameIndex >= startFrame && frameIndex <= endFrame) {
            // Fade in and translate
            const localFraction = (frameIndex - startFrame) / (endFrame - startFrame);
            // Math.sin creates a smooth curve peaking in the middle
            const opacity = Math.sin(localFraction * Math.PI);
            const translateY = 20 - (localFraction * 40); // Move up from +20px to -20px
            ref.current.style.opacity = opacity.toString();
            ref.current.style.transform = `translateY(${translateY}px)`;
            ref.current.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
          } else {
            ref.current.style.opacity = '0';
            ref.current.style.pointerEvents = 'none';
          }
        };

        updateText(textRef1, 0, 40);
        updateText(textRef2, 40, 80);
        updateText(textRef3, 80, 120);
        updateText(textRef4, 120, 160);
      });
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-draw current frame
      const scrollTop = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollFraction = scrollTop / maxScroll;
      const frameIndex = Math.min(totalFrames - 1, Math.floor(scrollFraction * totalFrames));
      
      if (images[frameIndex] && images[frameIndex].complete) {
        drawImage(images[frameIndex]);
      } else if (images[0] && images[0].complete) {
        drawImage(images[0]);
      }
    };

    // Initialize
    handleResize();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-3d-reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [totalFrames]);

  return (
    <div className="bg-[#0B0F19] text-white relative">
      <div className="h-[500vh] relative">
      {/* Floating Top Bar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl px-8 py-4 flex items-center justify-between z-50 bg-[#0A0E1A]/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 relative flex items-center justify-center">
            {/* 3D Animated Shield Logo */}
            <div className="absolute inset-0 animate-spin-3d rounded-lg opacity-80" style={{ background: 'linear-gradient(135deg, #00E5FF, #FF3366)', filter: 'blur(4px)' }}></div>
            <div className="absolute inset-0 animate-spin-3d rounded-lg border-[2px] border-white/50 backdrop-blur-md bg-black/20"></div>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white z-10 filter drop-shadow-md">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
          <span className="font-black text-2xl tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">SENTINEX</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors click-glow cursor-pointer">Features</button>
          <button onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors click-glow cursor-pointer">Architecture</button>
          <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors click-glow cursor-pointer">FAQ</button>
          <button onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors click-glow cursor-pointer">Contact</button>
        </div>

        <div>
          <button
            onClick={() => setAppView('dashboard')}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-white hover:text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            Go to Dashboard &rarr;
          </button>
        </div>
      </div>

      {/* Sticky Canvas Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        
        {/* Animated Overlay Content */}
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center max-w-7xl mx-auto px-8">
          
          {/* Block 1: Left */}
          <div ref={textRef1} className="absolute left-8 md:left-24 max-w-lg opacity-0 transition-opacity duration-75">
            <div className="text-[#00E5FF] font-mono text-sm font-bold tracking-[0.3em] mb-4 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">01 — INGESTION</div>
            <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] leading-[1.1]">Continuous<br/>Telemetry</h2>
            <p className="text-xl text-white/90 font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] max-w-md">
              SENTINEX connects to Kafka streams, endpoint sensors, and firewall APIs to instantly visualize massive traffic in real-time.
            </p>
          </div>

          {/* Block 2: Right */}
          <div ref={textRef2} className="absolute right-8 md:right-24 max-w-lg text-right opacity-0 transition-opacity duration-75">
            <div className="text-[#00FF9D] font-mono text-sm font-bold tracking-[0.3em] mb-4 drop-shadow-[0_0_10px_rgba(0,255,157,0.8)]">02 — DETECTION</div>
            <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] leading-[1.1]">AI Threat<br/>Hunting</h2>
            <p className="text-xl text-white/90 font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] max-w-md ml-auto">
              Isolation Forest ML algorithms instantly detect anomalies in noise, feeding suspects directly to the SOC Analyst agent.
            </p>
          </div>

          {/* Block 3: Left */}
          <div ref={textRef3} className="absolute left-8 md:left-24 max-w-lg opacity-0 transition-opacity duration-75">
            <div className="text-[#FF6A00] font-mono text-sm font-bold tracking-[0.3em] mb-4 drop-shadow-[0_0_10px_rgba(255,106,0,0.8)]">03 — ANALYSIS</div>
            <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] leading-[1.1]">Autonomous<br/>SOC Analyst</h2>
            <p className="text-xl text-white/90 font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] max-w-md">
              Powered by Claude Sonnet, our core agent reasons over packet traces and builds undeniable evidence chains in seconds.
            </p>
          </div>

          {/* Block 4: Right */}
          <div ref={textRef4} className="absolute right-8 md:right-24 max-w-lg text-right opacity-0 transition-opacity duration-75">
            <div className="text-[#FF3366] font-mono text-sm font-bold tracking-[0.3em] mb-4 drop-shadow-[0_0_10px_rgba(255,51,102,0.8)]">04 — RESPONSE</div>
            <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] leading-[1.1]">Millisecond<br/>Containment</h2>
            <p className="text-xl text-white/90 font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] max-w-md ml-auto">
              Zero hesitation. When a critical threat is confirmed, the Incident Responder isolates endpoints and bans IPs autonomously.
            </p>
          </div>

        </div>
      </div>
      </div>

      {/* 2. CTA / Features Section */}
      <section id="features" className="py-24 px-4 md:px-8 relative z-20 flex justify-center items-center min-h-[70vh] my-24 scroll-3d-reveal">
        {/* Cyber Grid Background */}
        <div className="absolute inset-0 bg-[#06090F] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          {/* Deep Space Atmosphere */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#00E5FF]/5 via-transparent to-[#A78BFA]/5 rounded-full blur-[120px]"></div>
        </div>

        {/* Hyper-Realistic Glass Card */}
        <div className="max-w-7xl w-full relative z-10 flex flex-col lg:flex-row items-center justify-between text-center lg:text-left py-20 px-8 md:px-16 lg:px-24 rounded-[3rem] bg-[#0A0E1A]/40 backdrop-blur-[24px] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden gap-12 lg:gap-8">
          {/* Volumetric Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#00E5FF]/20 to-[#A78BFA]/20 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
          
          {/* Left Text */}
          <div className="relative z-40 flex-1 w-full order-2 lg:order-1 flex justify-center lg:justify-start">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-black text-white tracking-tighter leading-[1.1] drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] max-w-lg">
              Unleash the Power of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E0F7FA] via-[#00E5FF] to-[#00B4D8] drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]">Cognitive Defense Architecture.</span>
            </h2>
          </div>

          {/* Hyper-Fidelity 3D Energy Core (Center) */}
          <div id="architecture" className="relative w-64 h-64 shrink-0 z-20 flex items-center justify-center hover-3d-tilt transition-transform duration-700 ease-out group cursor-pointer order-1 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00E5FF] to-[#A78BFA] rounded-full blur-[40px] opacity-60 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-dot"></div>
            
            {/* Spinning Rings */}
            <div className="absolute w-full h-full border-[2px] border-[#00E5FF]/40 rounded-full animate-spin-3d" style={{ animationDuration: '4s' }}></div>
            <div className="absolute w-4/5 h-4/5 border-[2px] border-[#A78BFA]/50 rounded-full animate-spin-3d" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
            <div className="absolute w-3/5 h-3/5 border-[3px] border-white/60 rounded-full animate-spin-3d" style={{ animationDuration: '2s' }}></div>
            
            {/* Inner Glowing Core */}
            <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_50px_rgba(255,255,255,1),0_0_100px_rgba(0,229,255,0.8)] z-30"></div>
          </div>

          {/* Bridged Button (Right) */}
          <div className="relative z-50 flex-1 w-full order-3 flex justify-center lg:justify-end">
            <button
              onClick={() => setAppView('dashboard')}
              className="bg-gradient-to-r from-[#E0F7FA] to-[#00E5FF] text-[#040B16] px-8 lg:px-10 py-5 rounded-full font-black text-lg hover:shadow-[0_0_50px_rgba(0,229,255,0.6)] hover:scale-105 transition-all duration-300 ease-out flex items-center justify-center gap-3 border border-white/40 group relative overflow-hidden whitespace-nowrap click-glow"
            >
              <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full skew-x-12 transition-transform duration-700 ease-in-out"></div>
              INITIALIZE PLATFORM <span className="text-2xl group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. FAQ Section */}
      <section id="faq" className="py-32 px-4 md:px-8 relative z-20 flex flex-col items-center min-h-[80vh] scroll-3d-reveal mb-48 bg-[#F8FAFC]">
        <div className="max-w-4xl w-full flex flex-col items-center">
          <div className="px-5 py-1.5 rounded-full border border-[#A78BFA] bg-white text-[#A78BFA] text-xs font-black tracking-[0.2em] mb-8 shadow-sm">FAQ</div>
          <h2 className="text-4xl md:text-6xl font-black text-[#0B0F19] tracking-tighter mb-16 text-center leading-tight drop-shadow-sm">
            Check Out the Answers <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#00B4D8]">to Common Questions</span>
          </h2>

          <div className="w-full flex flex-col gap-6">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#8B5CF6] shadow-sm hover:shadow-lg group click-glow"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-bold text-[#0B0F19] text-sm md:text-base pr-8">{faq.q}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 shadow-inner ${openFaq === idx ? 'rotate-45 bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF]' : 'bg-gray-50 border border-gray-200 text-gray-400 group-hover:text-[#8B5CF6]'}`}>
                    <span className="text-lg font-light leading-none mb-0.5">+</span>
                  </div>
                </button>
                <div className={`px-8 overflow-hidden transition-all duration-500 ease-in-out ${openFaq === idx ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed border-t border-gray-100 pt-6">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="footer" className="py-24 px-4 md:px-8 bg-[#04060A] relative z-20 border-t border-[#1A202C] flex flex-col items-center shadow-[0_-20px_40px_rgba(0,0,0,0.5)] scroll-3d-reveal">
        <div className="max-w-6xl w-full mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 mb-16">
            <div className="col-span-2 md:col-span-1 flex flex-col gap-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 relative flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#00E5FF]">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                </div>
                <span className="font-black text-xl tracking-[0.2em] text-white">SENTINEX</span>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex items-center justify-center text-white/50 hover:text-white hover:border-[#00E5FF]/50 transition-all cursor-pointer font-bold text-sm">in</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex items-center justify-center text-white/50 hover:text-white hover:border-[#00E5FF]/50 transition-all cursor-pointer font-bold text-sm">f</div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex items-center justify-center text-white/50 hover:text-white hover:border-[#00E5FF]/50 transition-all cursor-pointer font-bold text-sm">X</div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8 opacity-90">Legal</h4>
              <ul className="space-y-4 text-white/60 font-medium text-sm leading-relaxed">
                <li className="hover:text-white transition-colors cursor-pointer w-max">Privacy Policy</li>
                <li className="hover:text-white transition-colors cursor-pointer w-max">Terms of Service</li>
                <li className="hover:text-white transition-colors cursor-pointer w-max">Partner Terms</li>
                <li className="hover:text-white transition-colors cursor-pointer w-max">Service Level (SLA)</li>
                <li className="hover:text-white transition-colors cursor-pointer w-max">Data Processing (DPA)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8 opacity-90">Navigation</h4>
              <ul className="space-y-4 text-white/60 font-medium text-sm leading-relaxed">
                <li className="hover:text-[#00E5FF] transition-colors cursor-pointer w-max">Features</li>
                <li className="hover:text-[#00E5FF] transition-colors cursor-pointer w-max">Pricing</li>
                <li className="hover:text-[#00E5FF] transition-colors cursor-pointer w-max">About Us</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-black text-sm uppercase tracking-widest mb-8 opacity-90">Contact Information</h4>
              <ul className="space-y-5 text-white/70 font-medium text-sm leading-relaxed">
                <li className="flex items-center gap-4 cursor-pointer group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#FF3366]/50 transition-colors">
                    <span className="text-[#FF3366] text-sm">☎</span>
                  </div>
                  <span className="group-hover:text-white transition-colors">9860486657</span>
                </li>
                <li className="flex items-center gap-4 cursor-pointer group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#00FF9D]/50 transition-colors">
                    <span className="text-[#00FF9D] text-sm">✉</span>
                  </div>
                  <span className="group-hover:text-white transition-colors">dtalnewar@gmail.com</span>
                </li>
                <li className="flex items-center gap-4 cursor-pointer group pt-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#00E5FF]/50 transition-colors">
                    <span className="text-[#00E5FF] text-sm">📍</span>
                  </div>
                  <span className="group-hover:text-white transition-colors">Mumbai, MH, India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1A202C] flex justify-between items-center text-sm text-white/40 font-medium">
            <p className="hover:text-white transition-colors cursor-pointer">© 2026 Sentinex AI Corp. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
