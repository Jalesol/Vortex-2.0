/* =================================
   VORTEX 2.0 - SISTEMA DE CHAT
   IA via Groq + memória no Supabase
   Leitura de PDF com PDF.js
   Formatação Markdown + geração de PDF
================================= */

const SUPABASE_URL = "https://ytoykihtjcsttnmizbou.supabase.co";
const SUPABASE_KEY = "sb_publishable_7TFboQCIOTNwKLWsTlmTXg_jFCRM-IH";

const clienteSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const API_URL = "/api/chat";
const API_MEMORIA_URL = "/api/memory";

const LIMITE_PDF_MB = 10;
const LIMITE_PAGINAS_PDF = 40;
const LIMITE_CARACTERES_PDF = 35000;

let usuarioAtual = null;
let conversaAtual = [];
let conversas = [];
let enviando = false;
let saindo = false;

let pdfContexto = null;
let processandoPDF = false;

const app = document.querySelector("#app");
const carregando = document.querySelector("#carregando");
const saudacao = document.querySelector("#saudacao");
const formularioChat = document.querySelector("#form-chat");
const campoMensagem = document.querySelector("#mensagem");
const areaMensagens = document.querySelector("#mensagens");

const botaoNovoChat = document.querySelector("#novo-chat");
const botaoSair = document.querySelector("#sair");
const botaoTema = document.querySelector("#alternar-tema");
const listaConversas = document.querySelector("#lista-conversas");

const botaoMicrofone = document.querySelector("#btn-microfone");

const botaoAnexar = document.querySelector("#btn-anexar");
const campoArquivoPDF = document.querySelector("#arquivo-pdf");
const statusPDF = document.querySelector("#arquivo-pdf-status");
const nomePDF = document.querySelector("#arquivo-pdf-nome");
const botaoRemoverPDF = document.querySelector("#remover-pdf");

/* ============ FORMATAÇÃO MARKDOWN ============ */

function configurarMarkdown() {
    if (!window.marked) return;

    if (typeof window.marked.setOptions === "function") {
        window.marked.setOptions({
            gfm: true,
            breaks: true
        });
    }
}

function formatarResposta(texto) {
    if (!window.marked || !window.DOMPurify) {
        return null;
    }

    try {
        const html = window.marked.parse(texto);

        return window.DOMPurify.sanitize(html, {
            USE_PROFILES: {
                html: true
            }
        });

    } catch (erro) {
        console.error("Erro ao formatar resposta:", erro);
        return null;
    }
}

/* ============ PROTEÇÃO DE ROTA ============ */

function voltarParaLogin() {
    if (saindo) return;

    saindo = true;
    window.location.replace("index.html");
}

async function iniciar() {
    try {
        const { data, error } = await clienteSupabase.auth.getSession();

        const sessao = !error && data && data.session;

        if (!sessao) {
            voltarParaLogin();
            return;
        }

        usuarioAtual = data.session.user;

        const nome =
            (usuarioAtual.user_metadata && usuarioAtual.user_metadata.nome) ||
            (usuarioAtual.email || "").split("@")[0] ||
            "Visitante";

        usuarioAtual.nomeExibicao = nome;

        if (saudacao) {
            saudacao.textContent = "Olá, " + nome + "!";
        }

        configurarMarkdown();
        carregarConversasSalvas();
        carregarTema();
        atualizarHistorico();

        if (carregando) carregando.remove();

        if (app) app.hidden = false;

        if (campoMensagem) {
            campoMensagem.focus();
            ajustarAlturaCampo();
        }

    } catch (erro) {
        console.error("Erro ao iniciar o chat:", erro);
        voltarParaLogin();
    }
}

clienteSupabase.auth.onAuthStateChange(function (evento) {
    if (evento === "SIGNED_OUT") {
        voltarParaLogin();
    }
});

/* ============ TOKEN ============ */

async function obterToken() {
    const { data } = await clienteSupabase.auth.getSession();

    if (!data || !data.session) {
        throw new Error("Sessão expirada. Entre novamente.");
    }

    const expiraEm = data.session.expires_at * 1000;

    if (Date.now() > expiraEm - 60000) {
        const { data: renovado, error } =
            await clienteSupabase.auth.refreshSession();

        if (error || !renovado.session) {
            throw new Error("Sessão expirada. Entre novamente.");
        }

        return renovado.session.access_token;
    }

    return data.session.access_token;
}

async function chamarApi(url, opcoes) {
    const config = opcoes || {};
    const token = await obterToken();

    let resposta;

    try {
        resposta = await fetch(url, {
            method: config.method || "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: config.body
        });

    } catch (erro) {
        throw new Error(
            "Servidor fora do ar. Confira se o npm start está rodando."
        );
    }

    let dados = {};

    try {
        dados = await resposta.json();
    } catch (erro) {
        dados = {};
    }

    if (resposta.status === 401) {
        throw new Error("Sessão expirada. Entre novamente.");
    }

    if (!resposta.ok) {
        throw new Error(
            dados.error || "Falha na comunicação com o servidor."
        );
    }

    return dados;
}

/* ============ CONVERSAS ============ */

function chaveConversas() {
    return "vortexConversas_" + (usuarioAtual ? usuarioAtual.id : "anon");
}

function carregarConversasSalvas() {
    try {
        const bruto = localStorage.getItem(chaveConversas());
        const dados = JSON.parse(bruto || "[]");

        conversas = Array.isArray(dados) ? dados : [];

    } catch (erro) {
        conversas = [];
    }
}

function salvarConversas() {
    try {
        localStorage.setItem(
            chaveConversas(),
            JSON.stringify(conversas)
        );

    } catch (erro) {
        console.error("Não foi possível salvar as conversas:", erro);
    }
}

/* ============ MENSAGENS ============ */

function criarMensagem(texto, tipo) {
    const mensagem = document.createElement("div");

    mensagem.classList.add("mensagem", tipo);

    if (tipo === "vortex") {
        const conteudo = document.createElement("div");

        conteudo.className = "conteudo-mensagem";

        const htmlFormatado = formatarResposta(texto);

        if (htmlFormatado !== null) {
            conteudo.innerHTML = htmlFormatado;
        } else {
            conteudo.textContent = texto;
        }

        mensagem.appendChild(conteudo);

        const acoes = document.createElement("div");
        acoes.className = "mensagem-acoes";


    } else {
        mensagem.textContent = texto;
    }

    areaMensagens.appendChild(mensagem);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;

    return mensagem;
}

function mostrarPensamento() {
    const pensamento = document.createElement("div");

    pensamento.classList.add("mensagem", "vortex", "pensando");

    for (let i = 0; i < 3; i++) {
        pensamento.appendChild(document.createElement("span"));
    }

    areaMensagens.appendChild(pensamento);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;

    return pensamento;
}

function removerBoasVindas() {
    const boasVindas = document.querySelector("#boas-vindas");

    if (boasVindas) boasVindas.remove();
}

/* ============ GERAÇÃO DE PDF ============ */

async function gerarPDF(conteudo, botao) {
    if (typeof window.html2pdf !== "function") {
        alert(
            "Não foi possível carregar o gerador de PDF. Verifique sua conexão com a internet."
        );
        return;
    }

    const textoBotao = botao.innerHTML;

    try {
        botao.disabled = true;
        botao.innerHTML = "Gerando PDF...";

        const areaPDF = document.createElement("div");

        areaPDF.className = "documento-pdf";

        const titulo = document.createElement("h1");
        titulo.textContent = "VORTEX AI";

        const subtitulo = document.createElement("p");
        subtitulo.textContent = "Resposta gerada pela Vortex";

        const data = document.createElement("p");
        data.textContent = new Date().toLocaleString("pt-BR");

        const separador = document.createElement("hr");

        const conteudoClonado = conteudo.cloneNode(true);

        areaPDF.appendChild(titulo);
        areaPDF.appendChild(subtitulo);
        areaPDF.appendChild(data);
        areaPDF.appendChild(separador);
        areaPDF.appendChild(conteudoClonado);

        Object.assign(areaPDF.style, {
            position: "fixed",
            left: "-10000px",
            top: "0",
            width: "760px",
            padding: "35px",
            background: "#ffffff",
            color: "#172033",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            lineHeight: "1.6",
            zIndex: "-1"
        });

        titulo.style.color = "#007BFF";
        titulo.style.fontSize = "24px";
        titulo.style.marginBottom = "8px";

        subtitulo.style.fontSize = "15px";
        subtitulo.style.marginBottom = "4px";

        data.style.fontSize = "11px";
        data.style.color = "#64748b";

        separador.style.margin = "20px 0";
        separador.style.border = "none";
        separador.style.borderTop = "1px solid #dbe3ee";

        document.body.appendChild(areaPDF);

        const nomeArquivo =
            "vortex-resposta-" +
            new Date().toISOString().slice(0, 10) +
            ".pdf";

        await window.html2pdf()
            .set({
                margin: [12, 12, 12, 12],
                filename: nomeArquivo,
                image: {
                    type: "jpeg",
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff"
                },
                jsPDF: {
                    unit: "mm",
                    format: "a4",
                    orientation: "portrait"
                },
                pagebreak: {
                    mode: ["avoid-all", "css", "legacy"]
                }
            })
            .from(areaPDF)
            .save();

        areaPDF.remove();

    } catch (erro) {
        console.error("Erro ao gerar PDF:", erro);
        alert("Não foi possível gerar o PDF. Tente novamente.");

    } finally {
        const documento = document.querySelector(".documento-pdf");

        if (documento) documento.remove();

        botao.disabled = false;
        botao.innerHTML = textoBotao;
    }
}

/* ============ CAMPO AUTOMÁTICO ============ */

function ajustarAlturaCampo() {
    if (!campoMensagem) return;

    campoMensagem.style.height = "auto";

    const alturaMaxima = 180;

    campoMensagem.style.height =
        Math.min(campoMensagem.scrollHeight, alturaMaxima) + "px";

    campoMensagem.style.overflowY =
        campoMensagem.scrollHeight > alturaMaxima ? "auto" : "hidden";
}

if (campoMensagem) {
    campoMensagem.addEventListener("input", ajustarAlturaCampo);

    campoMensagem.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (formularioChat) {
                formularioChat.requestSubmit();
            }
        }
    });
}

/* ============ LEITURA DE PDF ============ */

function atualizarStatusPDF(texto) {
    if (!statusPDF || !nomePDF) return;

    nomePDF.textContent = texto;
    statusPDF.hidden = false;
}

function removerPDF() {
    pdfContexto = null;
    processandoPDF = false;

    if (campoArquivoPDF) {
        campoArquivoPDF.value = "";
    }

    if (statusPDF) {
        statusPDF.hidden = true;
    }

    if (nomePDF) {
        nomePDF.textContent = "";
    }

    if (botaoAnexar) {
        botaoAnexar.disabled = false;
        botaoAnexar.title = "Anexar PDF";
    }
}

async function extrairTextoPDF(arquivo) {
    if (!window.pdfjsLib) {
        throw new Error(
            "Não foi possível carregar o leitor de PDF. Verifique sua conexão com a internet."
        );
    }

    if (arquivo.size > LIMITE_PDF_MB * 1024 * 1024) {
        throw new Error(
            "O PDF ultrapassa o limite de " + LIMITE_PDF_MB + " MB."
        );
    }

    const bytes = new Uint8Array(await arquivo.arrayBuffer());

    const documento = await window.pdfjsLib.getDocument({
        data: bytes
    }).promise;

    const totalPaginas = documento.numPages;
    const paginasParaLer = Math.min(
        totalPaginas,
        LIMITE_PAGINAS_PDF
    );

    let textoCompleto = "";

    for (let numero = 1; numero <= paginasParaLer; numero++) {
        const pagina = await documento.getPage(numero);
        const conteudo = await pagina.getTextContent();

        const textoPagina = conteudo.items
            .map(function (item) {
                return item.str || "";
            })
            .join(" ");

        textoCompleto +=
            "\n\n[Página " + numero + "]\n" + textoPagina;

        if (textoCompleto.length >= LIMITE_CARACTERES_PDF) {
            textoCompleto = textoCompleto.slice(
                0,
                LIMITE_CARACTERES_PDF
            );

            textoCompleto +=
                "\n\n[Texto limitado para respeitar o tamanho máximo de leitura.]";

            break;
        }
    }

    if (!textoCompleto.trim()) {
        throw new Error(
            "Não encontrei texto neste PDF. Se ele for um documento digitalizado como imagem, será necessário usar OCR."
        );
    }

    if (totalPaginas > LIMITE_PAGINAS_PDF) {
        textoCompleto +=
            "\n\n[O documento possui " + totalPaginas +
            " páginas. Foram extraídas apenas as primeiras " +
            LIMITE_PAGINAS_PDF + " páginas.]";
    }

    return {
        texto: textoCompleto,
        paginas: totalPaginas
    };
}

async function selecionarPDF(event) {
    const arquivo = event.target.files[0];

    if (!arquivo) return;

    if (enviando || processandoPDF) {
        campoArquivoPDF.value = "";
        return;
    }

    if (
        arquivo.type !== "application/pdf" &&
        !arquivo.name.toLowerCase().endsWith(".pdf")
    ) {
        alert("Selecione um arquivo PDF válido.");
        campoArquivoPDF.value = "";
        return;
    }

    processandoPDF = true;
    pdfContexto = null;

    if (botaoAnexar) {
        botaoAnexar.disabled = true;
        botaoAnexar.title = "Lendo PDF...";
    }

    atualizarStatusPDF("Lendo " + arquivo.name + "...");

    try {
        const resultado = await extrairTextoPDF(arquivo);

        pdfContexto = {
            nome: arquivo.name,
            texto: resultado.texto,
            paginas: resultado.paginas
        };

        atualizarStatusPDF(
            "PDF pronto: " + arquivo.name +
            " (" + resultado.paginas + " páginas)"
        );

    } catch (erro) {
        console.error("Erro ao ler PDF:", erro);

        removerPDF();
        alert(erro.message || "Não foi possível ler esse PDF.");

    } finally {
        processandoPDF = false;

        if (botaoAnexar) {
            botaoAnexar.disabled = false;
            botaoAnexar.title = "Anexar PDF";
        }
    }
}

if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

if (botaoAnexar && campoArquivoPDF) {
    botaoAnexar.addEventListener("click", function () {
        if (!enviando && !processandoPDF) {
            campoArquivoPDF.click();
        }
    });

    campoArquivoPDF.addEventListener("change", selecionarPDF);
}

if (botaoRemoverPDF) {
    botaoRemoverPDF.addEventListener("click", removerPDF);
}

/* ============ HISTÓRICO ============ */

function salvarConversa() {
    if (conversaAtual.length === 0) return;

    const id = conversaAtual.id || Date.now();
    conversaAtual.id = id;

    const conversa = {
        id: id,
        mensagens: conversaAtual.map(function (m) {
            return {
                texto: m.texto,
                tipo: m.tipo
            };
        })
    };

    const indice = conversas.findIndex(function (item) {
        return item.id === id;
    });

    if (indice >= 0) {
        conversas[indice] = conversa;
    } else {
        conversas.unshift(conversa);
    }

    salvarConversas();
    atualizarHistorico();
}

function atualizarHistorico() {
    if (!listaConversas) return;

    listaConversas.innerHTML = "";

    conversas.forEach(function (conversa) {
        const item = document.createElement("li");
        const primeira = conversa.mensagens[0];

        item.textContent = primeira
            ? primeira.texto
            : "Nova conversa";

        if (conversaAtual.id === conversa.id) {
            item.classList.add("ativa");
        }

        item.addEventListener("click", function () {
            if (enviando) return;

            abrirConversa(conversa.id);
        });

        listaConversas.appendChild(item);
    });
}

function abrirConversa(id) {
    const conversa = conversas.find(function (item) {
        return item.id === id;
    });

    if (!conversa) return;

    removerPDF();

    conversaAtual = conversa.mensagens.map(function (m) {
        return {
            texto: m.texto,
            tipo: m.tipo
        };
    });

    conversaAtual.id = conversa.id;

    areaMensagens.innerHTML = "";

    conversaAtual.forEach(function (m) {
        criarMensagem(m.texto, m.tipo);
    });

    areaMensagens.scrollTop = areaMensagens.scrollHeight;
    atualizarHistorico();

    if (campoMensagem) {
        campoMensagem.value = "";
        ajustarAlturaCampo();
        campoMensagem.focus();
    }
}

function prepararHistorico() {
    return conversaAtual
        .slice(0, -1)
        .slice(-20)
        .map(function (m) {
            return {
                role: m.tipo === "usuario" ? "user" : "model",
                text: m.texto
            };
        });
}

/* ============ MEMÓRIA ============ */

async function consultarMemoria() {
    const dados = await chamarApi(API_MEMORIA_URL);

    return Array.isArray(dados.memories)
        ? dados.memories
        : [];
}

async function salvarMemoriaPermanente(fact) {
    return await chamarApi(API_MEMORIA_URL, {
        method: "POST",
        body: JSON.stringify({
            fact: fact
        })
    });
}

async function excluirMemoria(fact) {
    return await chamarApi(API_MEMORIA_URL + "/delete", {
        method: "POST",
        body: JSON.stringify({
            fact: fact
        })
    });
}

async function limparTodaMemoria() {
    return await chamarApi(API_MEMORIA_URL + "/clear", {
        method: "POST",
        body: JSON.stringify({})
    });
}

const PADRAO_GUARDAR =
    /^(?:vortex[,:]\s*)?(?:lembre-se(?:\s+de)?|guarde|memorize|não\s+esqueça)(?:\s+que)?\s*[:,\-]?\s*(.+)$/i;

const PADRAO_ESQUECER =
    /^(?:vortex[,:]\s*)?(?:esqueça|apague|remova|exclua)(?:\s+que)?\s*[:,\-]?\s*(.+)$/i;

const PADRAO_CONSULTAR =
    /^(?:vortex[,:]\s*)?(?:o\s+que\s+você\s+lembra|o\s+que\sabe\s+sobre\s+mim|mostre\s+sua\s+memória|consultar\s+memória|ver\s+memória)/i;

const PADRAO_LIMPAR =
    /^(?:vortex[,:]\s*)?(?:apague|apagar|limpe|limpar|exclua|excluir)\s+(?:toda\s+)?(?:a\s+)?(?:sua\s+)?memória(?:\s+permanente)?[.!]?$/i;

async function executarComandoMemoria(texto) {
    const mensagem = texto.trim();

    if (PADRAO_CONSULTAR.test(mensagem)) {
        const memorias = await consultarMemoria();

        if (memorias.length === 0) {
            return "Minha memória permanente está vazia no momento.";
        }

        return "Estas são as informações que guardo na minha memória:\n\n" +
            memorias.map(function (item, indice) {
                return (indice + 1) + ". " + item;
            }).join("\n");
    }

    if (PADRAO_LIMPAR.test(mensagem)) {
        const confirmar = window.confirm(
            "Tem certeza de que deseja apagar TODAS as informações da memória da Vortex?"
        );

        if (!confirmar) {
            return "Tudo bem! Mantive todas as informações da minha memória.";
        }

        const resultado = await limparTodaMemoria();

        return resultado.message;
    }

    const paraEsquecer = mensagem.match(PADRAO_ESQUECER);

    if (paraEsquecer && paraEsquecer[1]) {
        const resultado = await excluirMemoria(
            paraEsquecer[1].trim()
        );

        return resultado.message;
    }

    const paraGuardar = mensagem.match(PADRAO_GUARDAR);

    if (paraGuardar && paraGuardar[1]) {
        const resultado = await salvarMemoriaPermanente(
            paraGuardar[1].trim()
        );

        return resultado.message;
    }

    return null;
}

/* ============ IA ============ */

async function responderComIA(texto, documentoPDF) {
    let mensagemParaIA = texto;

    if (documentoPDF) {
        mensagemParaIA +=
            "\n\n--- INÍCIO DO DOCUMENTO PDF ---\n" +
            "Nome do arquivo: " + documentoPDF.nome + "\n\n" +
            documentoPDF.texto +
            "\n\n--- FIM DO DOCUMENTO PDF ---\n" +
            "Use o conteúdo do documento acima como referência para responder à solicitação do usuário. " +
            "Se a informação não estiver no documento, deixe isso claro.";
    }

    const dados = await chamarApi(API_URL, {
        method: "POST",
        body: JSON.stringify({
            message: mensagemParaIA,
            history: prepararHistorico()
        })
    });

    if (!dados.reply) {
        throw new Error(
            "A Vortex não recebeu uma resposta válida."
        );
    }

    return dados.reply;
}

/* ============ ENVIAR ============ */

async function enviarMensagem(event) {
    event.preventDefault();

    if (enviando || processandoPDF) return;

    const texto = campoMensagem.value.trim();

    if (!texto && !pdfContexto) return;

    const documentoPDF = pdfContexto
        ? {
            nome: pdfContexto.nome,
            texto: pdfContexto.texto
        }
        : null;

    let textoExibido = texto;

    if (documentoPDF) {
        if (!textoExibido) {
            textoExibido = "Analise este documento PDF e faça um resumo.";
        }

        textoExibido += "\n\n📎 Documento anexado: " + documentoPDF.nome;
    }

    removerBoasVindas();

    criarMensagem(textoExibido, "usuario");

    conversaAtual.push({
        texto: textoExibido,
        tipo: "usuario"
    });

    if (!conversaAtual.id) {
        conversaAtual.id = Date.now();
    }

    campoMensagem.value = "";
    ajustarAlturaCampo();

    enviando = true;
    campoMensagem.disabled = true;

    if (botaoAnexar) botaoAnexar.disabled = true;
    if (botaoMicrofone) botaoMicrofone.disabled = true;

    const botaoEnviar = formularioChat.querySelector(
        'button[type="submit"]'
    );

    if (botaoEnviar) {
        botaoEnviar.disabled = true;
    }

    const pensamento = mostrarPensamento();

    try {
        let resposta = null;

        if (!documentoPDF) {
            resposta = await executarComandoMemoria(texto);
        }

        if (resposta === null) {
            resposta = await responderComIA(
                textoExibido,
                documentoPDF
            );
        }

        pensamento.remove();

        criarMensagem(resposta, "vortex");

        conversaAtual.push({
            texto: resposta,
            tipo: "vortex"
        });

        salvarConversa();

        removerPDF();

    } catch (erro) {
        pensamento.remove();

        console.error("Erro na Vortex:", erro);

        if (erro.message.indexOf("Sessão expirada") !== -1) {
            voltarParaLogin();
            return;
        }

        const mensagemErro =
            "Não consegui responder. " + erro.message;

        criarMensagem(mensagemErro, "erro");

        conversaAtual.push({
            texto: mensagemErro,
            tipo: "erro"
        });

        salvarConversa();

    } finally {
        enviando = false;

        if (campoMensagem) {
            campoMensagem.disabled = false;
            campoMensagem.focus();
            ajustarAlturaCampo();
        }

        if (botaoEnviar) {
            botaoEnviar.disabled = false;
        }

        if (botaoAnexar) {
            botaoAnexar.disabled = false;
        }

        if (botaoMicrofone) {
            botaoMicrofone.disabled = false;
        }
    }
}

/* ============ NOVO CHAT ============ */

function novoChat() {
    if (enviando) return;

    salvarConversa();
    removerPDF();

    conversaAtual = [];

    const nome = usuarioAtual
        ? usuarioAtual.nomeExibicao
        : "Visitante";

    areaMensagens.innerHTML = "";

    const boasVindas = document.createElement("div");
    boasVindas.className = "boas-vindas";
    boasVindas.id = "boas-vindas";

    const titulo = document.createElement("h1");
    titulo.textContent = "Olá, " + nome + "!";

    const descricao = document.createElement("p");
    descricao.textContent = "Como posso te ajudar hoje?";

    boasVindas.appendChild(titulo);
    boasVindas.appendChild(descricao);
    areaMensagens.appendChild(boasVindas);

    atualizarHistorico();

    if (campoMensagem) {
        campoMensagem.value = "";
        ajustarAlturaCampo();
        campoMensagem.focus();
    }
}

/* ============ TEMA ============ */

function alternarTema() {
    document.body.classList.toggle("tema-claro");

    const tema = document.body.classList.contains("tema-claro")
        ? "claro"
        : "escuro";

    localStorage.setItem("vortexTema", tema);
}

function carregarTema() {
    const salvo = localStorage.getItem("vortexTema");

    document.body.classList.toggle(
        "tema-claro",
        salvo === "claro"
    );
}

/* ============ SAIR ============ */

async function sair() {
    if (enviando) return;

    salvarConversa();

    saindo = true;

    try {
        await clienteSupabase.auth.signOut();

    } catch (erro) {
        console.error("Erro ao encerrar sessão:", erro);
    }

    window.location.replace("index.html");
}

/* ============ EVENTOS ============ */

if (formularioChat) {
    formularioChat.addEventListener("submit", enviarMensagem);
}

if (botaoNovoChat) {
    botaoNovoChat.addEventListener("click", novoChat);
}

if (botaoTema) {
    botaoTema.addEventListener("click", alternarTema);
}

if (botaoSair) {
    botaoSair.addEventListener("click", sair);
}

/* ============ RECONHECIMENTO DE VOZ ============ */

const ReconhecimentoVoz =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let reconhecimento = null;
let gravando = false;

if (ReconhecimentoVoz && botaoMicrofone) {
    reconhecimento = new ReconhecimentoVoz();

    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = true;
    reconhecimento.interimResults = true;

    let textoAnterior = "";
    let textoFinal = "";

    botaoMicrofone.addEventListener("click", function () {
        if (gravando) {
            reconhecimento.stop();
            return;
        }

        textoAnterior = campoMensagem.value.trim();

        if (textoAnterior) {
            textoAnterior += " ";
        }

        textoFinal = "";

        try {
            reconhecimento.start();
        } catch (erro) {
            console.error("Não foi possível iniciar o microfone:", erro);
        }
    });

    reconhecimento.onstart = function () {
        gravando = true;

        botaoMicrofone.classList.add("gravando");
        botaoMicrofone.title = "Parar gravação";
    };

    reconhecimento.onresult = function (event) {
        let textoParcial = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const resultado = event.results[i];
            const transcricao = resultado[0].transcript;

            if (resultado.isFinal) {
                textoFinal += transcricao + " ";
            } else {
                textoParcial += transcricao;
            }
        }

        campoMensagem.value =
            textoAnterior + textoFinal + textoParcial;

        ajustarAlturaCampo();
    };

    reconhecimento.onerror = function (event) {
        console.error(
            "Erro no reconhecimento de voz:",
            event.error
        );

        if (event.error === "not-allowed") {
            alert(
                "Permita o acesso ao microfone nas configurações do navegador."
            );
        }
    };

    reconhecimento.onend = function () {
        gravando = false;

        botaoMicrofone.classList.remove("gravando");
        botaoMicrofone.title = "Falar com a Vortex";
    };

} else if (botaoMicrofone) {
    botaoMicrofone.disabled = true;
    botaoMicrofone.title =
        "Seu navegador não suporta reconhecimento de voz.";
}

/* ============ INICIALIZAÇÃO ============ */

iniciar();