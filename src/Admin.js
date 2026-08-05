import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Plus, Trash2, LogOut, Save, ExternalLink } from "lucide-react";
import { api, getContent, saveContent, login, setToken, uploadFile, mediaUrl } from "./lib/api";

/* ---------- primitives ---------- */
const Field = ({ label, value, onChange, textarea, testid }) => (
  <label className="block mb-4">
    <span className="font-body text-xs uppercase tracking-[0.15em] text-muted2">{label}</span>
    {textarea ? (
      <textarea data-testid={testid} value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3}
        className="mt-2 w-full bg-espresso border border-line rounded-md px-4 py-3 text-cream font-body focus:border-caramel outline-none resize-y" />
    ) : (
      <input data-testid={testid} value={value || ""} onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-espresso border border-line rounded-md px-4 py-3 text-cream font-body focus:border-caramel outline-none" />
    )}
  </label>
);

const MediaInput = ({ label, value, onChange, accept = "image/*", testid }) => {
  const [busy, setBusy] = useState(false);
  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const res = await uploadFile(file);
      onChange(res.url);
      toast.success("Arquivo enviado");
    } catch (err) { toast.error("Falha no upload"); }
    setBusy(false);
  };
  const isVideo = accept.includes("video");
  return (
    <div className="mb-4">
      <span className="font-body text-xs uppercase tracking-[0.15em] text-muted2">{label}</span>
      <div className="mt-2 flex gap-3 items-start">
        {value ? (isVideo ? <video src={mediaUrl(value)} className="w-24 h-24 object-cover rounded-md border border-line" />
          : <img src={mediaUrl(value)} alt="" className="w-24 h-24 object-cover rounded-md border border-line" />)
          : <div className="w-24 h-24 rounded-md border border-line border-dashed grid place-items-center text-muted2 text-xs">vazio</div>}
        <div className="flex-1">
          <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL ou envie um arquivo"
            className="w-full bg-espresso border border-line rounded-md px-3 py-2 text-cream text-sm font-body focus:border-caramel outline-none" />
          <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-xs font-body uppercase tracking-widest px-3 py-2 rounded-full bg-mocha text-cream2 hover:bg-caramel transition-colors">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Enviar
            <input data-testid={testid} type="file" accept={accept} className="hidden" onChange={handle} />
          </label>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="border border-line rounded-md bg-espresso2 p-6 mb-6">
    <h3 className="font-display text-2xl text-cream mb-5">{title}</h3>
    {children}
  </div>
);

const ListEditor = ({ title, items, setItems, template, render }) => (
  <Section title={title}>
    <div className="space-y-5">
      {(items || []).map((item, i) => (
        <div key={item.id || i} className="border border-line rounded-md p-4 relative">
          <button data-testid={`del-${title}-${i}`} onClick={() => setItems(items.filter((_, k) => k !== i))}
            className="absolute top-3 right-3 text-muted2 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
          {render(item, (patch) => setItems(items.map((it, k) => (k === i ? { ...it, ...patch } : it))))}
        </div>
      ))}
    </div>
    <button data-testid={`add-${title}`} onClick={() => setItems([...(items || []), { id: crypto.randomUUID(), ...template }])}
      className="mt-5 inline-flex items-center gap-2 text-xs font-body uppercase tracking-widest px-4 py-2.5 rounded-full border border-line text-cream hover:border-caramel transition-colors">
      <Plus size={14} /> Adicionar
    </button>
  </Section>
);

/* ---------- login ---------- */
const Login = ({ onLogin }) => {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await login("admin@clinicamici.com", pw);
      setToken(res.token);
      toast.success("Bem-vinda, Âmici");
      onLogin();
    } catch (err) { toast.error(err.response?.data?.detail || "Senha incorreta"); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen grid place-items-center bg-espresso px-6">
      <form onSubmit={submit} className="w-full max-w-sm border border-line rounded-lg bg-espresso2 p-8">
        <h1 className="font-display text-4xl text-cream text-center">ÂMICI</h1>
        <p className="font-body text-xs uppercase tracking-[0.3em] text-muted2 text-center mt-2 mb-8">Painel Administrativo</p>
        <input data-testid="admin-password" type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Senha"
          className="w-full bg-espresso border border-line rounded-md px-4 py-3 text-cream font-body focus:border-caramel outline-none" />
        <button data-testid="admin-login-btn" disabled={busy}
          className="mt-5 w-full flex items-center justify-center gap-2 font-body text-sm uppercase tracking-[0.14em] px-6 py-3.5 rounded-full bg-mocha text-cream2 hover:bg-caramel transition-colors disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : "Entrar"}
        </button>
      </form>
    </div>
  );
};

/* ---------- editor ---------- */
const TABS = ["Marca & Abertura", "Hero", "Bisturi & Manifesto", "Galeria", "Resultados", "Vídeos", "Depoimentos", "História & Dra.", "Contato"];

export default function Admin() {
  const [authed, setAuthed] = useState(null);
  const [c, setC] = useState(null);
  const [tab, setTab] = useState(TABS[0]);
  const [saving, setSaving] = useState(false);

  const check = () => {
    const t = localStorage.getItem("amici_token");
    if (!t) { setAuthed(false); return; }
    api.get("/auth/me").then(() => setAuthed(true)).catch(() => { setToken(null); setAuthed(false); });
  };
  useEffect(() => { check(); }, []);
  useEffect(() => { if (authed) getContent().then(setC); }, [authed]);

  const set = (path, value) => setC((prev) => {
    const next = { ...prev }; let o = next; const ks = path.split(".");
    for (let i = 0; i < ks.length - 1; i++) { o[ks[i]] = { ...o[ks[i]] }; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = value; return next;
  });
  const setList = (key, items) => setC((prev) => ({ ...prev, [key]: items }));

  const save = async () => {
    setSaving(true);
    try { await saveContent(c); toast.success("Alterações salvas!"); }
    catch (e) { toast.error("Erro ao salvar"); }
    setSaving(false);
  };
  const logout = () => { setToken(null); setAuthed(false); };

  if (authed === null) return <div className="min-h-screen bg-espresso grid place-items-center"><Loader2 className="animate-spin text-mocha" /></div>;
  if (!authed) return <Login onLogin={() => setAuthed(true)} />;
  if (!c) return <div className="min-h-screen bg-espresso grid place-items-center"><Loader2 className="animate-spin text-mocha" /></div>;

  return (
    <div className="min-h-screen bg-espresso text-cream">
      <div className="sticky top-0 z-20 bg-espresso/90 backdrop-blur-xl border-b border-line">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-display text-2xl">ÂMICI · Admin</span>
          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer" className="text-xs font-body uppercase tracking-widest text-muted2 hover:text-cream flex items-center gap-1"><ExternalLink size={14} /> Ver site</a>
            <button data-testid="save-btn" onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 text-xs font-body uppercase tracking-widest px-5 py-2.5 rounded-full bg-caramel text-cream2 hover:bg-mocha transition-colors disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
            </button>
            <button data-testid="logout-btn" onClick={logout} className="text-muted2 hover:text-red-400 transition-colors"><LogOut size={16} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8 grid md:grid-cols-[220px_1fr] gap-8">
        <nav className="flex md:flex-col gap-1 flex-wrap md:sticky md:top-24 md:self-start">
          {TABS.map((t) => (
            <button key={t} data-testid={`tab-${t}`} onClick={() => setTab(t)}
              className={`text-left px-4 py-2.5 rounded-md font-body text-sm transition-colors ${tab === t ? "bg-mocha text-cream2" : "text-muted2 hover:bg-espresso2"}`}>{t}</button>
          ))}
        </nav>

        <div data-testid="editor-panel">
          {tab === "Marca & Abertura" && (
            <Section title="Marca & Abertura">
              <Field label="Nome da marca" value={c.brand?.name} onChange={(v) => set("brand.name", v)} testid="f-brand-name" />
              <Field label="Slogan / tagline" value={c.brand?.tagline} onChange={(v) => set("brand.tagline", v)} />
              <Field label="Palavra da abertura (loader)" value={c.intro?.word} onChange={(v) => set("intro.word", v)} testid="f-intro-word" />
              <Field label="Subtítulo da abertura" value={c.intro?.subtitle} onChange={(v) => set("intro.subtitle", v)} />
            </Section>
          )}
          {tab === "Hero" && (
            <Section title="Seção principal (Hero)">
              <Field label="Eyebrow" value={c.hero?.eyebrow} onChange={(v) => set("hero.eyebrow", v)} />
              <Field label="Título (use Enter para quebrar linha)" value={c.hero?.title} onChange={(v) => set("hero.title", v)} textarea testid="f-hero-title" />
              <Field label="Subtítulo" value={c.hero?.subtitle} onChange={(v) => set("hero.subtitle", v)} textarea />
              <Field label="Texto do botão" value={c.hero?.cta} onChange={(v) => set("hero.cta", v)} />
              <MediaInput label="Imagem principal" value={c.hero?.image} onChange={(v) => set("hero.image", v)} testid="f-hero-image" />
              <MediaInput label="Vídeo de fundo (opcional — substitui a imagem)" value={c.hero?.video} onChange={(v) => set("hero.video", v)} accept="video/*" />
            </Section>
          )}
          {tab === "Bisturi & Manifesto" && (<>
            <Section title="Seção do Bisturi (corte no scroll)">
              <Field label="Eyebrow" value={c.scalpel?.eyebrow} onChange={(v) => set("scalpel.eyebrow", v)} />
              <Field label="Título" value={c.scalpel?.title} onChange={(v) => set("scalpel.title", v)} textarea />
              <Field label="Texto" value={c.scalpel?.text} onChange={(v) => set("scalpel.text", v)} />
            </Section>
            <ListEditor title="Manifesto" items={c.chapters} setItems={(x) => setList("chapters", x)}
              template={{ n: "00", title: "", text: "" }}
              render={(it, upd) => (<>
                <Field label="Número" value={it.n} onChange={(v) => upd({ n: v })} />
                <Field label="Título" value={it.title} onChange={(v) => upd({ title: v })} />
                <Field label="Texto" value={it.text} onChange={(v) => upd({ text: v })} textarea />
              </>)} />
          </>)}
          {tab === "Galeria" && (
            <ListEditor title="Galeria de fotos" items={c.gallery} setItems={(x) => setList("gallery", x)}
              template={{ title: "", image: "" }}
              render={(it, upd) => (<>
                <Field label="Título" value={it.title} onChange={(v) => upd({ title: v })} />
                <MediaInput label="Imagem" value={it.image} onChange={(v) => upd({ image: v })} />
              </>)} />
          )}
          {tab === "Resultados" && (
            <ListEditor title="Resultados (antes / depois)" items={c.results} setItems={(x) => setList("results", x)}
              template={{ title: "", before: "", after: "" }}
              render={(it, upd) => (<>
                <Field label="Procedimento" value={it.title} onChange={(v) => upd({ title: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <MediaInput label="Antes" value={it.before} onChange={(v) => upd({ before: v })} />
                  <MediaInput label="Depois" value={it.after} onChange={(v) => upd({ after: v })} />
                </div>
              </>)} />
          )}
          {tab === "Vídeos" && (
            <ListEditor title="Vídeos" items={c.videos} setItems={(x) => setList("videos", x)}
              template={{ src: "", poster: "" }}
              render={(it, upd) => (<>
                <MediaInput label="Vídeo" value={it.src} onChange={(v) => upd({ src: v })} accept="video/*" />
                <MediaInput label="Capa (poster)" value={it.poster} onChange={(v) => upd({ poster: v })} />
              </>)} />
          )}
          {tab === "Depoimentos" && (
            <ListEditor title="Depoimentos" items={c.testimonials} setItems={(x) => setList("testimonials", x)}
              template={{ name: "", text: "", rating: 5 }}
              render={(it, upd) => (<>
                <Field label="Nome" value={it.name} onChange={(v) => upd({ name: v })} />
                <Field label="Depoimento" value={it.text} onChange={(v) => upd({ text: v })} textarea />
                <Field label="Estrelas (1-5)" value={String(it.rating ?? 5)} onChange={(v) => upd({ rating: Math.max(1, Math.min(5, parseInt(v) || 5)) })} />
              </>)} />
          )}
          {tab === "História & Dra." && (<>
            <ListEditor title="Linha do tempo (História)" items={c.history} setItems={(x) => setList("history", x)}
              template={{ year: "", title: "", text: "" }}
              render={(it, upd) => (<>
                <Field label="Período" value={it.year} onChange={(v) => upd({ year: v })} />
                <Field label="Título" value={it.title} onChange={(v) => upd({ title: v })} />
                <Field label="Texto" value={it.text} onChange={(v) => upd({ text: v })} textarea />
              </>)} />
            <Section title="Dra. Alice">
              <Field label="Nome" value={c.doctor?.name} onChange={(v) => set("doctor.name", v)} />
              <Field label="Cargo / credenciais" value={c.doctor?.role} onChange={(v) => set("doctor.role", v)} />
              <Field label="Bio" value={c.doctor?.bio} onChange={(v) => set("doctor.bio", v)} textarea />
              <MediaInput label="Foto" value={c.doctor?.image} onChange={(v) => set("doctor.image", v)} />
            </Section>
            <Section title="Assistente IA (Dra. Alice)">
              <MediaInput label="Foto da assistente (aparece acima do chat)" value={c.assistant?.image} onChange={(v) => set("assistant.image", v)} testid="f-assistant-image" />
              <Field label="Título" value={c.assistant?.title} onChange={(v) => set("assistant.title", v)} />
              <Field label="Subtítulo" value={c.assistant?.subtitle} onChange={(v) => set("assistant.subtitle", v)} textarea />
              <Field label="Mensagem de boas-vindas" value={c.assistant?.greeting} onChange={(v) => set("assistant.greeting", v)} textarea />
            </Section>
          </>)}
          {tab === "Contato" && (
            <Section title="Contato">
              <Field label="WhatsApp (só números, com DDI/DDD)" value={c.contact?.whatsapp} onChange={(v) => set("contact.whatsapp", v)} />
              <Field label="Instagram (URL)" value={c.contact?.instagram} onChange={(v) => set("contact.instagram", v)} />
              <Field label="Endereço" value={c.contact?.address} onChange={(v) => set("contact.address", v)} />
              <Field label="E-mail" value={c.contact?.email} onChange={(v) => set("contact.email", v)} />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
