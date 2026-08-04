import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import {
  Instagram, MessageCircle, MapPin, Mail, ArrowUpRight, Star, Quote, ChevronDown, Send, Sparkles,
} from "lucide-react";
import { getContent, mediaUrl, sendChat } from "./lib/api";

gsap.registerPlugin(ScrollTrigger);

/* ---------- Custom cursor ---------- */
const Cursor = () => {
  const dot = useRef(null);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    const move = (e) => {
      gsap.to(dot.current, { x: e.clientX, y: e.clientY, duration: 0.35, ease: "power3.out" });
    };
    const over = (e) => setHover(!!e.target.closest("a,button,[data-cursor]"));
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); };
  }, []);
  return (
    <div ref={dot} className="fixed top-0 left-0 z-[9999] pointer-events-none hidden md:block -translate-x-1/2 -translate-y-1/2"
      style={{ mixBlendMode: "difference" }}>
      <div className="rounded-full bg-cream transition-[width,height] duration-300"
        style={{ width: hover ? 44 : 10, height: hover ? 44 : 10 }} />
    </div>
  );
};

/* ---------- Reveal wrapper ---------- */
const Reveal = ({ children, delay = 0, className = "" }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 26 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
  >{children}</motion.div>
);

/* ---------- Intro loader ---------- */
const Intro = ({ word, subtitle, onDone }) => {
  const root = useRef(null);
  useEffect(() => {
    const letters = root.current.querySelectorAll(".intro-letter");
    const tl = gsap.timeline({ onComplete: onDone });
    tl.set(root.current, { display: "flex" })
      .from(letters, { yPercent: 120, opacity: 0, duration: 0.8, stagger: 0.06, ease: "power4.out" })
      .from(".intro-sub", { opacity: 0, y: 16, duration: 0.5 }, "-=0.3")
      .to(".intro-line", { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, "-=0.4")
      .to(root.current, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "+=0.7")
      .set(root.current, { display: "none" });
    return () => tl.kill();
  }, [onDone]);
  return (
    <div ref={root} data-testid="intro-loader"
      className="fixed inset-0 z-[9997] bg-espresso flex-col items-center justify-center" style={{ display: "flex" }}>
      <div className="overflow-hidden">
        <h1 className="font-display text-cream text-[18vw] md:text-[13vw] leading-none tracking-tight flex">
          {(word || "ÂMICI").split("").map((c, i) => (
            <span key={i} className="intro-letter inline-block">{c}</span>
          ))}
        </h1>
      </div>
      <div className="intro-line h-px w-40 md:w-72 bg-caramel origin-left scale-x-0 my-6" />
      <p className="intro-sub font-body uppercase tracking-[0.4em] text-[10px] md:text-xs text-muted2">{subtitle}</p>
    </div>
  );
};

/* ---------- Header ---------- */
const Header = ({ brand }) => {
  const links = [
    ["Sobre", "sobre"], ["Galeria", "galeria"], ["Resultados", "resultados"],
    ["Depoimentos", "depoimentos"], ["Dra. IA", "dra-ia"], ["Contato", "contato"],
  ];
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <header className="fixed top-0 inset-x-0 z-[9990] bg-espresso/80 backdrop-blur-xl border-b border-line">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <button data-testid="brand-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-display text-2xl md:text-3xl tracking-wide text-cream">{brand?.name || "ÂMICI"}</button>
        <nav className="hidden md:flex items-center gap-9">
          {links.map(([label, id]) => (
            <button key={id} data-testid={`nav-${id}`} onClick={() => scrollTo(id)}
              className="font-body text-xs uppercase tracking-[0.18em] text-muted2 hover:text-cream transition-colors duration-300">{label}</button>
          ))}
        </nav>
        <button data-testid="header-cta" onClick={() => scrollTo("contato")}
          className="font-body text-xs uppercase tracking-[0.14em] px-5 py-2.5 rounded-full bg-mocha text-cream2 hover:bg-caramel transition-colors duration-300">
          Agendar
        </button>
      </div>
    </header>
  );
};

/* ---------- Hero ---------- */
const Hero = ({ hero }) => {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-line-inner", { yPercent: 120, duration: 1.2, stagger: 0.12, ease: "power4.out", delay: 3.2 });
      gsap.from(".hero-fade", { opacity: 0, y: 20, duration: 1, stagger: 0.15, delay: 3.8 });
      gsap.to(".hero-bg", {
        yPercent: 18, ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  const lines = (hero?.title || "").split("\n");
  return (
    <section ref={ref} className="relative h-[100svh] w-full overflow-hidden" data-testid="hero-section">
      <div className="hero-bg absolute inset-0 scale-110">
        {hero?.video ? (
          <video className="w-full h-full object-cover" src={mediaUrl(hero.video)} autoPlay muted loop playsInline />
        ) : (
          <img className="w-full h-full object-cover" src={mediaUrl(hero?.image)} alt="Âmici" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-espresso/70 via-espresso/40 to-espresso" />
      </div>
      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col justify-end pb-24 md:pb-28">
        <p className="hero-fade font-body uppercase tracking-[0.3em] text-[10px] md:text-xs text-caramel mb-6">{hero?.eyebrow}</p>
        <h1 className="font-display text-cream text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight max-w-4xl">
          {lines.map((l, i) => (
            <span key={i} className="reveal-mask"><span className="hero-line-inner inline-block italic">{l}</span></span>
          ))}
        </h1>
        <p className="hero-fade font-body text-base md:text-lg text-cream/80 max-w-xl mt-8 leading-relaxed">{hero?.subtitle}</p>
        <div className="hero-fade mt-10">
          <button data-testid="hero-cta" onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}
            className="group inline-flex items-center gap-3 font-body text-sm uppercase tracking-[0.14em] px-7 py-4 rounded-full bg-cream text-espresso hover:bg-caramel hover:text-cream2 transition-colors duration-300">
            {hero?.cta || "Agende sua avaliação"}
            <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-muted2 animate-bounce"><ChevronDown /></div>
    </section>
  );
};

/* ---------- Marquee ---------- */
const Marquee = ({ text }) => {
  const items = Array(8).fill(text);
  return (
    <div className="py-8 border-y border-line bg-espresso2 overflow-hidden">
      <div className="marquee-track">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="font-display italic text-3xl md:text-5xl text-mocha px-8">{t} <span className="text-caramel/40">·</span></span>
        ))}
      </div>
    </div>
  );
};

/* ---------- Scalpel cut ---------- */
const ScalpelCut = ({ data, image }) => {
  const wrap = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: wrap.current, start: "top top", end: "+=140%", scrub: 1, pin: true },
      });
      tl.fromTo(".cut-overlay", { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", ease: "none" }, 0)
        .fromTo(".scalpel", { top: "-6%" }, { top: "104%", ease: "none" }, 0)
        .fromTo(".cut-glow", { top: "0%" }, { top: "100%", ease: "none" }, 0)
        .fromTo(".reveal-copy", { opacity: 0 }, { opacity: 1, ease: "none" }, 0.5);
    }, wrap);
    return () => ctx.revert();
  }, []);
  return (
    <section ref={wrap} className="relative h-screen w-full overflow-hidden bg-espresso" data-testid="scalpel-section">
      {/* revealed layer */}
      <div className="absolute inset-0">
        <img src={mediaUrl(image)} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-espresso/60" />
        <div className="reveal-copy absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-body uppercase tracking-[0.3em] text-xs text-caramel mb-5">{data?.eyebrow}</p>
          <h2 className="font-display text-cream text-5xl md:text-7xl leading-none tracking-tight whitespace-pre-line">{data?.title}</h2>
          <p className="font-body text-cream/70 max-w-md mt-6">{data?.text}</p>
        </div>
      </div>
      {/* overlay that gets sliced away */}
      <div className="cut-overlay absolute inset-0 bg-espresso flex items-center justify-center">
        <span className="font-display italic text-mocha/40 text-[22vw] leading-none select-none">âmici</span>
      </div>
      {/* glowing cut line */}
      <div className="cut-glow absolute left-0 right-0 h-px bg-caramel z-20" style={{ boxShadow: "0 0 24px 4px rgba(168,124,99,0.8)" }} />
      {/* scalpel */}
      <div className="scalpel absolute left-1/2 -translate-x-1/2 z-30" data-testid="scalpel-icon">
        <svg width="46" height="150" viewBox="0 0 46 150" fill="none">
          <path d="M23 0 L30 20 L26 120 L23 150 L20 120 L16 20 Z" fill="#EAD9C7" />
          <path d="M23 0 L30 20 L26 120 L23 150 Z" fill="#A87C63" />
          <rect x="20" y="120" width="6" height="30" fill="#6E4B3A" />
        </svg>
      </div>
    </section>
  );
};

/* ---------- Chapters ---------- */
const Chapters = ({ chapters }) => (
  <section id="sobre" className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-40">
    <Reveal><p className="font-body uppercase tracking-[0.3em] text-xs text-caramel mb-16">Manifesto</p></Reveal>
    <div className="space-y-20 md:space-y-28">
      {(chapters || []).map((c, i) => (
        <Reveal key={i} delay={i * 0.05}>
          <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-start border-t border-line pt-10">
            <div className="md:col-span-2 font-display text-5xl md:text-6xl text-mocha">{c.n}</div>
            <h3 className="md:col-span-5 font-display text-3xl md:text-5xl leading-tight text-cream italic">{c.title}</h3>
            <p className="md:col-span-5 font-body text-muted2 text-lg leading-relaxed">{c.text}</p>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);

/* ---------- Gallery ---------- */
const Gallery = ({ gallery }) => (
  <section id="galeria" className="max-w-[1400px] mx-auto px-6 md:px-10 py-24 md:py-32">
    <Reveal><h2 className="font-display text-4xl md:text-6xl text-cream mb-14 tracking-tight">Galeria</h2></Reveal>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
      {(gallery || []).map((g, i) => (
        <Reveal key={g.id || i} delay={(i % 3) * 0.06}>
          <div data-cursor className="group relative overflow-hidden rounded-md border border-line aspect-[3/4]">
            <img src={mediaUrl(g.image)} alt={g.title}
              className="w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
              <span className="font-display italic text-2xl text-cream">{g.title}</span>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);

/* ---------- Results (before/after) ---------- */
const Results = ({ results }) => (
  <section id="resultados" className="bg-espresso2 border-y border-line py-24 md:py-32">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10">
      <Reveal><h2 className="font-display text-4xl md:text-6xl text-cream mb-14 tracking-tight">Resultados</h2></Reveal>
      <div className="grid md:grid-cols-2 gap-8">
        {(results || []).map((r, i) => (
          <Reveal key={r.id || i} delay={i * 0.05}>
            <div className="border border-line rounded-md overflow-hidden">
              <div className="grid grid-cols-2">
                <div className="relative aspect-[3/4]"><img src={mediaUrl(r.before)} className="w-full h-full object-cover" alt="antes" />
                  <span className="absolute top-3 left-3 font-body text-[10px] uppercase tracking-widest bg-espresso/80 text-cream px-3 py-1 rounded-full">Antes</span></div>
                <div className="relative aspect-[3/4]"><img src={mediaUrl(r.after)} className="w-full h-full object-cover" alt="depois" />
                  <span className="absolute top-3 left-3 font-body text-[10px] uppercase tracking-widest bg-caramel text-cream2 px-3 py-1 rounded-full">Depois</span></div>
              </div>
              <div className="p-5 font-display italic text-2xl text-cream">{r.title}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ---------- Videos ---------- */
const Videos = ({ videos }) => {
  if (!videos || videos.length === 0) return null;
  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-24">
      <Reveal><h2 className="font-display text-4xl md:text-6xl text-cream mb-14 tracking-tight">Vídeos</h2></Reveal>
      <div className="grid md:grid-cols-2 gap-6">
        {videos.map((v, i) => (
          <Reveal key={v.id || i}><video controls className="w-full rounded-md border border-line" src={mediaUrl(v.src)} poster={mediaUrl(v.poster)} /></Reveal>
        ))}
      </div>
    </section>
  );
};

/* ---------- Testimonials ---------- */
const Testimonials = ({ testimonials }) => (
  <section id="depoimentos" className="max-w-[1400px] mx-auto px-6 md:px-10 py-24 md:py-32">
    <Reveal><h2 className="font-display text-4xl md:text-6xl text-cream mb-14 tracking-tight">Depoimentos</h2></Reveal>
    <div className="grid md:grid-cols-3 gap-6">
      {(testimonials || []).map((t, i) => (
        <Reveal key={t.id || i} delay={i * 0.06}>
          <div className="border border-line rounded-md bg-espresso2 p-8 h-full flex flex-col">
            <Quote className="text-mocha mb-5" />
            <p className="font-display italic text-2xl text-cream leading-snug flex-1">"{t.text}"</p>
            <div className="mt-6 flex items-center justify-between">
              <span className="font-body text-sm text-muted2">{t.name}</span>
              <span className="flex gap-0.5">{Array(t.rating || 5).fill(0).map((_, k) => <Star key={k} size={14} className="fill-caramel text-caramel" />)}</span>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);

/* ---------- History + Doctor ---------- */
const History = ({ history, doctor }) => (
  <section className="bg-espresso2 border-y border-line py-24 md:py-32">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-16">
      <div>
        <Reveal><h2 className="font-display text-4xl md:text-6xl text-cream mb-12 tracking-tight">História</h2></Reveal>
        <div className="space-y-8">
          {(history || []).map((h, i) => (
            <Reveal key={h.id || i} delay={i * 0.05}>
              <div className="flex gap-6 border-l border-line pl-6">
                <div className="font-body uppercase tracking-[0.2em] text-xs text-caramel w-28 shrink-0 pt-1">{h.year}</div>
                <div>
                  <h4 className="font-display italic text-2xl text-cream">{h.title}</h4>
                  <p className="font-body text-muted2 mt-1">{h.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Reveal delay={0.1}>
        <div className="relative rounded-md overflow-hidden border border-line">
          <img src={mediaUrl(doctor?.image)} alt={doctor?.name} className="w-full h-full object-cover aspect-[4/5]" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-espresso to-transparent p-8">
            <h3 className="font-display text-4xl text-cream italic">{doctor?.name}</h3>
            <p className="font-body text-caramel text-sm tracking-wide mt-2">{doctor?.role}</p>
            <p className="font-body text-cream/70 mt-3 max-w-md">{doctor?.bio}</p>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

/* ---------- Alice AI chat ---------- */
const AliceChat = ({ assistant, doctor }) => {
  const info = assistant || {};
  const [sid] = useState(() => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())));
  const [messages, setMessages] = useState([
    { role: "assistant", text: info.greeting || "Olá! Como posso te ajudar? 💛" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChat(text, sid);
      setMessages((m) => [...m, { role: "assistant", text: res.reply || "Desculpe, não consegui responder agora." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Tive um problema para responder. Tente novamente. 💛" }]);
    }
    setLoading(false);
  };

  const suggestions = ["Quais procedimentos vocês fazem?", "Como é a recuperação?", "Como agendar uma avaliação?"];

  return (
    <section id="dra-ia" className="bg-espresso2 border-y border-line py-24 md:py-32" data-testid="alice-chat-section">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 flex flex-col items-center text-center">
        <Reveal>
          <div className="relative inline-block">
            <img src={mediaUrl(info.image || doctor?.image)} alt="Dra. Alice"
              className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border border-caramel/40"
              style={{ boxShadow: "0 0 60px 0 rgba(168,124,99,0.45)" }} />
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-espresso2" />
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="font-body uppercase tracking-[0.3em] text-[10px] md:text-xs text-caramel mt-8 mb-4 flex items-center justify-center gap-2">
            <Sparkles size={14} /> Assistente virtual
          </p>
          <h2 className="font-display text-4xl md:text-6xl text-cream tracking-tight leading-none">{info.title || "Tire suas dúvidas com a Dra. Alice"}</h2>
          <p className="font-body text-muted2 max-w-xl mx-auto mt-5">{info.subtitle}</p>
        </Reveal>

        <Reveal delay={0.1} className="w-full max-w-2xl mt-12">
          <div className="border border-line rounded-xl bg-espresso overflow-hidden text-left">
            <div ref={boxRef} data-testid="chat-messages" className="h-[360px] overflow-y-auto p-5 md:p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl font-body text-sm leading-relaxed whitespace-pre-line ${
                    m.role === "user" ? "bg-mocha text-cream2 rounded-br-sm" : "bg-espresso2 border border-line text-cream rounded-bl-sm"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-espresso2 border border-line rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map((k) => (
                      <span key={k} className="w-2 h-2 rounded-full bg-caramel animate-bounce" style={{ animationDelay: `${k * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} data-testid="chat-suggestion" onClick={() => { setInput(s); }}
                  className="font-body text-xs text-muted2 border border-line rounded-full px-3 py-1.5 hover:border-caramel hover:text-cream transition-colors">{s}</button>
              ))}
            </div>
            <form onSubmit={send} className="flex items-center gap-3 border-t border-line p-4">
              <input data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Escreva sua dúvida..." className="flex-1 bg-transparent text-cream font-body outline-none placeholder:text-muted2/60" />
              <button data-testid="chat-send" type="submit" disabled={loading || !input.trim()}
                className="w-11 h-11 grid place-items-center rounded-full bg-caramel text-cream2 hover:bg-mocha transition-colors disabled:opacity-40">
                <Send size={18} />
              </button>
            </form>
          </div>
          <p className="font-body text-[11px] text-muted2/70 mt-4">A assistente virtual não substitui uma consulta médica. Agende sua avaliação com a Dra. Alice.</p>
        </Reveal>
      </div>
    </section>
  );
};

/* ---------- Footer / contact ---------- */
const Footer = ({ brand, contact }) => (
  <footer id="contato" className="max-w-[1400px] mx-auto px-6 md:px-10 py-24 md:py-32">
    <Reveal>
      <h2 className="font-display text-5xl md:text-8xl text-cream tracking-tight leading-none">Vamos<br /><span className="italic text-mocha">conversar?</span></h2>
    </Reveal>
    <div className="mt-16 grid md:grid-cols-2 gap-10 items-end">
      <div className="flex flex-wrap gap-4">
        <a data-testid="wa-link" href={`https://wa.me/${contact?.whatsapp}`} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-3 font-body text-sm uppercase tracking-[0.14em] px-7 py-4 rounded-full bg-mocha text-cream2 hover:bg-caramel transition-colors duration-300">
          <MessageCircle size={18} /> WhatsApp
        </a>
        <a href={contact?.instagram} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-3 font-body text-sm uppercase tracking-[0.14em] px-7 py-4 rounded-full border border-line text-cream hover:border-caramel transition-colors duration-300">
          <Instagram size={18} /> Instagram
        </a>
      </div>
      <div className="font-body text-muted2 space-y-2 md:text-right">
        <p className="flex md:justify-end items-center gap-2"><MapPin size={16} /> {contact?.address}</p>
        <p className="flex md:justify-end items-center gap-2"><Mail size={16} /> {contact?.email}</p>
      </div>
    </div>
    <div className="mt-20 pt-8 border-t border-line flex flex-col md:flex-row justify-between gap-4 text-xs text-muted2 font-body uppercase tracking-[0.2em]">
      <span className="font-display text-2xl tracking-normal normal-case text-cream">{brand?.name}</span>
      <span>© {new Date().getFullYear()} · {brand?.tagline}</span>
      <a href="/admin" data-testid="admin-link" className="hover:text-cream transition-colors">Admin</a>
    </div>
  </footer>
);

/* ---------- Page ---------- */
export default function Site() {
  const [c, setC] = useState(null);
  const [err, setErr] = useState("");
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (attempt = 0) => {
      try {
        const d = await getContent();
        if (!d || !d.brand) throw new Error("resposta inválida");
        if (!cancelled) setC(d);
      } catch (e) {
        if (cancelled) return;
        if (attempt < 6) {
          setTimeout(() => load(attempt + 1), 1200);
        } else {
          setErr(String(e));
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!c) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => { lenis.destroy(); clearTimeout(refresh); };
  }, [c, introDone]);

  if (!c)
    return (
      <div className="h-screen bg-espresso grid place-items-center text-center px-8" data-testid="site-loading">
        {err ? (
          <div className="space-y-6">
            <h1 className="font-display text-5xl text-cream">ÂMICI</h1>
            <p className="font-body text-muted2 text-sm">Não conseguimos carregar o site agora.</p>
            <button onClick={() => window.location.reload()} data-testid="retry-btn"
              className="font-body text-xs uppercase tracking-[0.14em] px-6 py-3 rounded-full bg-mocha text-cream2 hover:bg-caramel transition-colors">
              Tentar novamente
            </button>
          </div>
        ) : (
          <h1 className="font-display text-5xl text-cream animate-pulse">ÂMICI</h1>
        )}
      </div>
    );

  return (
    <div className="hide-native-cursor bg-espresso">
      <Cursor />
      <Intro word={c.intro?.word} subtitle={c.intro?.subtitle} onDone={() => setIntroDone(true)} />
      <Header brand={c.brand} />
      <Hero hero={c.hero} />
      <Marquee text={c.brand?.name || "ÂMICI"} />
      <ScalpelCut data={c.scalpel} image={c.hero?.image} />
      <Chapters chapters={c.chapters} />
      <Gallery gallery={c.gallery} />
      <Results results={c.results} />
      <Videos videos={c.videos} />
      <Testimonials testimonials={c.testimonials} />
      <History history={c.history} doctor={c.doctor} />
      <AliceChat assistant={c.assistant} doctor={c.doctor} />
      <Footer brand={c.brand} contact={c.contact} />
    </div>
  );
}
