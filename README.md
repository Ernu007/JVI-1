# JVI Carga & Serviços, Lda — Landing Page

Landing page institucional e formulário de orçamento (Airwaybill) para a
JVI Carga & Serviços, Lda., empresa moçambicana de transporte de carga,
correio e encomendas.

Inclui também a **Carta de Apresentação de 10 páginas** (HTML → PDF).

---

## 1. Como ver o site localmente

Qualquer servidor estático serve. Por exemplo:

```powershell
cd "D:\JVI\Trabalho Jvi"
python -m http.server 8765
# abrir http://127.0.0.1:8765
```

A carta gera-se em `http://127.0.0.1:8765/carta/`.

---

## 2. Estrutura

```
Trabalho Jvi/
├── index.html              Landing page completa
├── css/styles.css          Tokens da marca + todo o estilo
├── js/main.js              Menu, scroll, hero 3D, mapa, formulário
├── assets/
│   ├── logo.png            Logo JVI (verde/laranja) — usado no header e rodapé
│   ├── logo-branco.png     Versão branca (fundos escuros)
│   ├── logo-full.png       Logo completo com "Carga & Serviços, Lda"
│   ├── favicon.png
│   └── img/                Fotografias (camiao, terminal, aviao)
├── functions/submit.js     Netlify Function: envia o pedido
├── carta/                  Carta de apresentação (10 páginas A4)
│   ├── index.html
│   ├── style.css
│   ├── mapa.js
│   └── jvi-carta-apresentacao.pdf   (gerado)
├── netlify.toml
└── .env.example            Chaves a preencher (ver abaixo)
```

---

## 3. Chaves de ambiente (Fase do formulário)

O formulário **funciona já sem nenhuma chave** — nesse caso o lead é
encaminhado para o WhatsApp/e-mail e o aviso "registo automático
indisponível" é mostrado. Para gravar os pedidos, preencher:

| Variável | Para que serve | Onde obter |
|---|---|---|
| `RESEND_API_KEY` | envia o e-mail com o pedido | https://resend.com/api-keys |
| `EMAIL_DE` | remetente | `onboarding@resend.dev` até ter domínio verificado |
| `EMAIL_PARA` | destinatário | `jvicargaservicos@gmail.com` |
| `SHEET_ID` | folha de cálculo | o ID no URL da folha, entre `/d/` e `/edit` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | autenticação na Google | Google Cloud > Service Accounts, em JSON, numa linha |

Instruções passo-a-passo em `.env.example`.

**Onde configurar:** Netlify → *Site settings* → *Environment variables*.
Ou, em desenvolvimento, criar um ficheiro `.env` (já está no `.gitignore`).

### Folha "Pedidos"
Criar a folha, renomear a aba para `Pedidos` e ter uma linha de cabeçalho
com as 23 colunas na mesma ordem que `CAMPOS` em `functions/submit.js`.
Ao partilhar a folha, dar **Editor** ao e-mail da conta de serviço.

---

## 4. Publicar na Netlify

```powershell
npx netlify-cli deploy --dir . --functions functions --prod
```

Ou pelo painel: **Add new site → Deploy manually**, com a pasta `Trabalho Jvi`
e a directoria de funções `functions`.

O `netlify.toml` já define o publish, as funções, o cache dos assets e os
headers de segurança.

---

## 5. Gerar a carta em PDF

A carta é HTML com `@page A4` e queima-se para PDF pelo Chrome:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --headless=new --disable-gpu --no-sandbox `
  --no-pdf-header-footer --print-to-pdf-no-header `
  --print-to-pdf="carta\jvi-carta-apresentacao.pdf" `
  "http://127.0.0.1:8765/carta/index.html"
```

Ou `Ctrl+P` → *Guardar como PDF* → A4, sem cabeçalhos, *Gráficos de
segundo plano* ligado.

**Ao alterar o conteúdo da carta, voltar a gerar o PDF** — o ficheiro
descarregado pela página é o PDF, não o HTML.

---

## 6. Dados da empresa usados

| | |
|---|---|
| NUEL | 100449137 |
| NUIT | 400501424 |
| Licença | 8732/11/04/PS/2014 |
| WhatsApp / Telefone | +258 87 555 8005 |
| Telefone | +258 84 470 0012 |
| Fixo | 21 089 459 |
| Email | jvicargaservicos@gmail.com |
| Sede | Av. 19 de Outubro, Terminal de Cargas Nº 113, Aeroporto de Maputo |

Para alterar contactos: `js/main.js` (constante `JVI`, usada pelo formulário)
e `index.html` (secção Contactos, botões fixos e rodapé).

---

## 7. Identidade visual

Extraída do logo original:

| Token | Hex |
|---|---|
| Verde JVI | `#A9CF44` |
| Verde escuro | `#82C91E` |
| Laranja JVI | `#EA8240` |
| Base escura | `#0F172A` |
| Cinza claro | `#CBD5E1` |

Estão em `:root`, no topo de `css/styles.css`. Mudar a marca = mudar aí.

---

## 8. Substituir as imagens

As fotografias em `assets/img/` vieram da carta de apresentação original e
são **placeholders**. Para usar as fotos reais, basta substituir os ficheiros
com o **mesmo nome**:

| Ficheiro | Onde é usado | Tamanho recomendado |
|---|---|---|
| `camiao.png` | Serviço 01 + Contactos | 1200×750 |
| `terminal.jpg` | Serviço 02 | 1200×750 |
| `aviao.jpg` | Serviço 03 | 1200×750 |

Recomendado exportar como JPEG de qualidade 80 e sem ultrapassar 200 KB cada.

O `logo.png` também pode ser substituído pelo PNG oficial com o mesmo nome
(mantenha o rácio e a transparência).

---

## 9. Detalhes técnicos

- **Sem dependências**, sem passo de build. Abre directamente no browser.
- **Peso total** ~700 KB, maioritariamente imagens.
- **Responsivo** de 360 px a 1920 px, testado sem overflow horizontal.
- **`prefers-reduced-motion`** respeitado: sem rota animada nem caixas 3D.
- **Acessibilidade**: foco visível, `aria-*` nos diálogos e nos passos do
  formulário, mensagens de erro ligadas ao campo.
- **SEO**: meta description, `theme-color`, `lang="pt-MZ"`, cabeçalhos `h1`–`h3`
  em ordem.
