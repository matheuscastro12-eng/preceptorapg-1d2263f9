# Changelog — PreceptorMED

Histórico das principais mudanças do produto, em ordem cronológica reversa.

## [Em andamento] — mai/2026

### Adicionado
- **PreceptorBook — Mecanismo de ação das drogas:** todas as drogas existentes agora têm campo `mecanismo_acao` com descrição molecular/celular detalhada.
- **PreceptorBook — Bloco UTI/emergência (20 drogas):** vasopressores (noradrenalina, epinefrina, dopamina, dobutamina, vasopressina, milrinona), sedação UTI (fentanil, morfina, midazolam, propofol, dexmedetomidina, ketamina) e ATB hospitalar (pip-tazo, cefepime, meropenem, ertapenem, linezolida, daptomicina, polimixina B, tigeciclina).
- **PreceptorBook — Bloco Cardio/anticoag (8 drogas):** apixabana, dabigatrana, nitroglicerina, nitroprussiato, metoprolol, propranolol, digoxina, amiodarona.
- **PreceptorBook — Bloco Endo/Psiq (16 drogas):** empagliflozina, dapagliflozina, semaglutida, liraglutida, sitagliptina, glimepirida, hidrocortisona, dexametasona, sertralina, fluoxetina, escitalopram, venlafaxina, risperidona, olanzapina, quetiapina, lítio.
- **PreceptorBook — Bloco Pneumo/GI/Reumato/Neuro (15 drogas):** tiotrópio, formoterol, fluticasona, montelucaste, pantoprazol, ondansetrona, metoclopramida, lactulose, polietilenoglicol, alopurinol, colchicina, metotrexato, hidroxicloroquina, gabapentina, pregabalina.
- **PreceptorBook — Bloco Hema/Infecto/Gineco (12 drogas):** sulfato ferroso, ácido fólico, cianocobalamina (B12), oseltamivir, aciclovir, fluconazol, isoniazida, rifampicina, sulfato de magnésio, misoprostol, levonorgestrel (anticoncepção emergência), tenofovir. **Total: 121 drogas.**
- **PreceptorBook — Prescrições por doença (35):** agudas (12) — sepse, IAM com supra, anafilaxia, CAD, EHE, asma exacerbação, PAC, ITU, IC aguda/EAP, AVCi, status epilepticus, TEP/TVP; crônicas (17) — HAS, DM2, dislipidemia, FA, profilaxia TVP hospitalar, depressão, TAG, hipotireoidismo, Graves, DPOC, TB, asma manutenção, DRGE/úlcera, gota, AR, CINV, dor neuropática; **(6 novas)** — anemia ferropriva, influenza (tratamento + vacina), TB pulmonar (RHZE), HIV PEP/PrEP, pré-eclâmpsia/eclâmpsia, planejamento familiar.

## mai/2026 — Casos clínicos + estabilização Gemini

- **fix(casos-clínicos):** correção do `paciente_sexo` violando check constraint (usar valor do form, não inferência da IA).
- **fix(casos-clínicos):** erro real do edge function exibido na UI (fetch direto em vez de `supabase.functions.invoke()`).
- **fix(casos-clínicos):** fallback automático `gemini-2.5-flash` → `gemini-2.5-pro` em caso de erro 5xx.
- **revert(gemini):** volta para `gemini-2.5-flash` + fallback ao `2.5-pro` (versão `flash-latest` entregava resumos mais curtos e superficiais).
- **fix(fechamento):** continuação automática server-side quando `finishReason !== STOP` (até 3 continuações).
- **refactor(casos-clínicos):** pivot para formulário único — IA monta caso completo de uma vez, em vez de chat pergunta-a-pergunta.
- **feat(casos-clínicos):** chat com animações modernas (Framer Motion).
- **fix:** caso reseta ao trocar de aba — `bootstrappedRef` + URL replace para `?continuar=ID`.

## abr/2026 — PreceptorBook v1 + Cronograma + Casos Clínicos

- **feat(preceptorbook):** rename de Whitebook para PreceptorBook + 30 calculadoras clínicas + 50 drogas + 12 protocolos + CID-10.
- **feat(casos-clínicos):** geração de caso clínico interativo com chat + questões.
- **feat(cronograma v2):** re-planning ao pular dia + flashcards por tema livre + deep link integrado.
- **feat(cronograma):** plano de estudo personalizado por prova com IA + streak + email diário.
- **chore(ui):** substituição de "IA" por "PreceptorMED" em todo o produto.

## abr/2026 — Phase 2 do Whitebook + Scribe

- **feat(whitebook/phase2.2):** IA conversacional contextual no Whitebook (drawer com chat sobre droga/protocolo).
- **feat(whitebook/phase2.1):** drogas + protocolos + CID-10 + tela admin de curadoria.
- **feat(whitebook/phase1):** calculadoras clínicas com 20 escores seedados.
- **feat(scribe/phase4):** SOAP completo + export PDF + audit page + Termos de Uso.
- **feat(scribe/phase3b):** página `/scribe/:id/review` com edição SOAP + assinatura HMAC.
- **feat(scribe/phase3a):** MVP de gravação + transcrição + SOAP.
- **feat(phase0):** foundations Clínica — `useFeatureAccess` + sidebar + paywall beta.

## abr/2026 — Hardening Gemini + UX

- **fix(fechamento):** aumenta retry para 4 tentativas com backoff (1s/3s/9s).
- **fix(fechamento):** retry específico para 503 UNAVAILABLE do gemini-2.5-flash.
- **fix(fechamento):** captura erros mid-stream do Gemini (429/quota/key inválida).
- **fix(fechamento):** keepalive SSE + auto-retry + reverte thinking off.
- **feat(fechamento):** respeita escopo do tema + diagnóstico de parada anormal.
- **feat(ui):** redesign editorial das abas Simulado, ENAMED e Flashcards.

## abr/2026 — Landing + Provas + CRM

- **feat(landing):** redesign comercial — outcome headline, pain points, garantia, FAQ.
- **landing:** garantia de 7d para 3d, remoção de em-dashes do copy.
- **feat(provas):** modo estudo no simulado + botão "Explicar com IA".
- **feat(provas):** extração em chunks + modo expresso (live).
- **fix(provas):** extração de texto no client em vez de Vision no server.
- **feat(pdf):** redesign visual estilo journal acadêmico premium.
- **feat(crm):** widget "online ao vivo" com count + lista de usuários.
- **fix(crm):** converte enum `automation_trigger` em TEXT para aceitar triggers custom.
- **fix(health-score):** paginação por idade do cálculo evita pegar sempre os mesmos.

## Convenções

- **feat:** nova funcionalidade visível ao usuário.
- **fix:** correção de bug.
- **refactor:** refatoração interna sem mudança visível.
- **chore:** infra, deps, cleanup.
- **docs:** documentação.

Histórico completo via `git log --oneline`.
