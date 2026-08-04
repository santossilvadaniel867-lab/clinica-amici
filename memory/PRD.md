# PRD — Clínica ÂMICI (site + admin CMS)

## Problema
Site animado (nível Awwwards) para Clínica Âmici (Dra. Alice Vasconcelos, Cirurgia Plástica e Estética, Aracaju/SE). Abertura "ÂMICI", bisturi cortando de cima pra baixo no scroll, efeitos GSAP. Painel admin com TUDO editável (textos, fotos, vídeos, seções) e upload de mídia.

## Identidade
Mocha/caramelo (#8A6552,#A87C63) + creme (#EAD9C7) sobre espresso (#0E0B0A). Fontes: Cormorant Garamond (display) + Manrope (body). Slogan: "Liberdade é estar feliz consigo mesma".

## Stack
React + FastAPI + MongoDB. GSAP ScrollTrigger (bisturi/intro), framer-motion (reveals), Lenis (scroll suave). Storage Emergent (upload fotos/vídeos). Auth JWT (senha admin). IA: emergentintegrations LlmChat (gpt-5.4).

## Implementado (04/08)
- Abertura "ÂMICI" animada (~4s)
- Hero editável (imagem/vídeo) + headline mascarada
- Bisturi cortando no scroll (pin + scrub) — verificado
- Manifesto, Galeria, Resultados (antes/depois), Vídeos, Depoimentos, História, Dra. Alice
- IA "Tire suas dúvidas com a Dra. Alice" (foto + chat pt-BR) — verificado
- Painel /admin (senha Amiciadmin2026): edita todas as seções, upload de fotos e vídeos, salvar
- Backend: /api/content, /api/upload, /api/files, /api/auth/*, /api/chat

## Credenciais
admin@clinicamici.com / Amiciadmin2026 (login usa só a senha)

## Backlog / próximos
- P1: seção de serviços/procedimentos com preços
- P1: agendamento por WhatsApp com pré-preenchimento
- P2: SEO/meta + Open Graph, animação 3D no hero
- P2: histórico de conversas da IA no admin
