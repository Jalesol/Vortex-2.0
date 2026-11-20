
/* =================================
      VORTEX 2.0 - SISTEMA DE CHAT
      IA via Groq + memória no Supabase
      Leitura de PDF com PDF.js
      Formatação Markdown + geração de PDF
      Idiomas: Português, Inglês e Espanhol
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

const CHAVE_IDIOMA = "vortex_idioma";

let idiomaAtual = localStorage.getItem(CHAVE_IDIOMA) || "pt";

if (!["pt", "en", "es"].includes(idiomaAtual)) {
    idiomaAtual = "pt";
}

const TRADUCOES = {
    pt: {
        checkingSession: "Verificando sua sessão...",
        brandTag: "Sua IA, sempre com você.",
        newChat: "Novo chat",
        chatHistory: "◷ Histórico de conversas",
        toggleTheme: "Alternar tema",
        signOut: "Sair",
        online: "Online",
        language: "Idioma",
        welcomeSubtitle: "Como posso te ajudar hoje?",
        removePdf: "Remover PDF",
        attachPdf: "Anexar documento PDF",
        speakToVortex: "Falar com a Vortex",
        startVoiceRecognition: "Iniciar reconhecimento de voz",
        stopRecording: "Parar gravação",
        unsupportedVoice: "Seu navegador não suporta reconhecimento de voz.",
        messagePlaceholder: "Converse com a Vortex...",
        sendMessage: "Enviar mensagem",
        newConversation: "Nova conversa",
        sessionExpired: "Sessão expirada. Entre novamente.",
        serverOffline: "Servidor fora do ar. Confira se o npm start está rodando.",
        serverCommunicationError: "Falha na comunicação com o servidor.",
        pdfLibraryError: "Não foi possível carregar o gerador de PDF. Verifique sua conexão com a internet.",
        generatingPdf: "Gerando PDF...",
        pdfSubtitle: "Resposta gerada pela Vortex",
        pdfGenerationError: "Não foi possível gerar o PDF. Tente novamente.",
        pdfReaderError: "Não foi possível carregar o leitor de PDF. Verifique sua conexão com a internet.",
        pdfTooLarge: "O PDF ultrapassa o limite de {limit} MB.",
        pdfTextLimit: "[Texto limitado para respeitar o tamanho máximo de leitura.]",
        pdfPageLabel: "Página",
        pdfPageLimit: "[O documento possui {total} páginas. Foram extraídas apenas as primeiras {limit} páginas.]",
        pdfNoText: "Não encontrei texto neste PDF. Se ele for um documento digitalizado como imagem, será necessário usar OCR.",
        selectValidPdf: "Selecione um arquivo PDF válido.",
        readingPdf: "Lendo PDF...",
        readingFile: "Lendo {name}...",
        pdfReady: "PDF pronto: {name} ({pages} páginas)",
        pdfReadError: "Não foi possível ler esse PDF.",
        removePdfTitle: "Anexar PDF",
        pdfDefaultPrompt: "Analise este documento PDF e faça um resumo.",
        attachedDocument: "📎 Documento anexado: {name}",
        memoryEmpty: "Minha memória permanente está vazia no momento.",
        memoryList: "Estas são as informações que guardo na minha memória:",
        confirmClearMemory: "Tem certeza de que deseja apagar TODAS as informações da memória da Vortex?",
        memoryCancelled: "Tudo bem! Mantive todas as informações da minha memória.",
        invalidAiResponse: "A Vortex não recebeu uma resposta válida.",
        cannotRespond: "Não consegui responder. ",
        microphonePermission: "Permita o acesso ao microfone nas configurações do navegador.",
        themeLight: "claro",
        themeDark: "escuro",
        hello: "Olá",
        helpToday: "Como posso te ajudar hoje?"
    },

    en: {
        checkingSession: "Checking your session...",
        brandTag: "Your AI, always with you.",
        newChat: "New chat",
        chatHistory: "◷ Chat history",
        toggleTheme: "Toggle theme",
        signOut: "Sign out",
        online: "Online",
        language: "Language",
        welcomeSubtitle: "How can I help you today?",
        removePdf: "Remove PDF",
        attachPdf: "Attach PDF document",
        speakToVortex: "Talk to Vortex",
        startVoiceRecognition: "Start voice recognition",
        stopRecording: "Stop recording",
        unsupportedVoice: "Your browser does not support speech recognition.",
        messagePlaceholder: "Chat with Vortex...",
        sendMessage: "Send message",
        newConversation: "New conversation",
        sessionExpired: "Session expired. Please sign in again.",
        serverOffline: "Server is unavailable. Check whether npm start is running.",
        serverCommunicationError: "Communication with the server failed.",
        pdfLibraryError: "Could not load the PDF generator. Check your internet connection.",
        generatingPdf: "Generating PDF...",
        pdfSubtitle: "Response generated by Vortex",
        pdfGenerationError: "Could not generate the PDF. Please try again.",
        pdfReaderError: "Could not load the PDF reader. Check your internet connection.",
        pdfTooLarge: "The PDF exceeds the {limit} MB limit.",
        pdfTextLimit: "[Text was limited to respect the maximum reading size.]",
        pdfPageLabel: "Page",
        pdfPageLimit: "[The document has {total} pages. Only the first {limit} pages were extracted.]",
        pdfNoText: "No text was found in this PDF. If it is a scanned image, OCR will be required.",
        selectValidPdf: "Please select a valid PDF file.",
        readingPdf: "Reading PDF...",
        readingFile: "Reading {name}...",
        pdfReady: "PDF ready: {name} ({pages} pages)",
        pdfReadError: "Could not read this PDF.",
        removePdfTitle: "Attach PDF",
        pdfDefaultPrompt: "Analyze this PDF document and summarize it.",
        attachedDocument: "📎 Attached document: {name}",
        memoryEmpty: "My permanent memory is currently empty.",
        memoryList: "These are the details I have saved in my memory:",
        confirmClearMemory: "Are you sure you want to delete ALL information from Vortex's memory?",
        memoryCancelled: "No problem! I kept all the information in my memory.",
        invalidAiResponse: "Vortex did not receive a valid response.",
        cannotRespond: "I couldn't respond. ",
        microphonePermission: "Allow microphone access in your browser settings.",
        themeLight: "light",
        themeDark: "dark",
        hello: "Hello",
        helpToday: "How can I help you today?"
    },

    es: {
        checkingSession: "Verificando tu sesión...",
        brandTag: "Tu IA, siempre contigo.",
        newChat: "Nuevo chat",
        chatHistory: "◷ Historial de conversaciones",
        toggleTheme: "Cambiar tema",
        signOut: "Salir",
        online: "En línea",
        language: "Idioma",
        welcomeSubtitle: "¿Cómo puedo ayudarte hoy?",
        removePdf: "Eliminar PDF",
        attachPdf: "Adjuntar documento PDF",
        speakToVortex: "Hablar con Vortex",
        startVoiceRecognition: "Iniciar reconocimiento de voz",
        stopRecording: "Detener grabación",
        unsupportedVoice: "Tu navegador no admite el reconocimiento de voz.",
        messagePlaceholder: "Habla con Vortex...",
        sendMessage: "Enviar mensaje",
        newConversation: "Nueva conversación",
        sessionExpired: "La sesión ha caducado. Inicia sesión de nuevo.",
        serverOffline: "El servidor no está disponible. Comprueba si npm start está en ejecución.",
        serverCommunicationError: "Error de comunicación con el servidor.",
        pdfLibraryError: "No se pudo cargar el generador de PDF. Comprueba tu conexión a internet.",
        generatingPdf: "Generando PDF...",
        pdfSubtitle: "Respuesta generada por Vortex",
        pdfGenerationError: "No se pudo generar el PDF. Inténtalo de nuevo.",
        pdfReaderError: "No se pudo cargar el lector de PDF. Comprueba tu conexión a internet.",
        pdfTooLarge: "El PDF supera el límite de {limit} MB.",
        pdfTextLimit: "[El texto se limitó para respetar el tamaño máximo de lectura.]",
        pdfPageLabel: "Página",
        pdfPageLimit: "[El documento tiene {total} páginas. Solo se extrajeron las primeras {limit} páginas.]",
        pdfNoText: "No se encontró texto en este PDF. Si es una imagen escaneada, será necesario utilizar OCR.",
        selectValidPdf: "Selecciona un archivo PDF válido.",
        readingPdf: "Leyendo PDF...",
        readingFile: "Leyendo {name}...",
        pdfReady: "PDF listo: {name} ({pages} páginas)",
        pdfReadError: "No se pudo leer este PDF.",
        removePdfTitle: "Adjuntar PDF",
        pdfDefaultPrompt: "Analiza este documento PDF y haz un resumen.",
        attachedDocument: "📎 Documento adjunto: {name}",
        memoryEmpty: "Mi memoria permanente está vacía en este momento.",
        memoryList: "Esta es la información que guardo en mi memoria:",
        confirmClearMemory: "¿Estás seguro de que quieres borrar TODA la información de la memoria de Vortex?",
        memoryCancelled: "¡De acuerdo! He conservado toda la información de mi memoria.",
        invalidAiResponse: "Vortex no recibió una respuesta válida.",
        cannotRespond: "No pude responder. ",
        microphonePermission: "Permite el acceso al micrófono en la configuración del navegador.",
        themeLight: "claro",
        themeDark: "oscuro",
        hello: "¡Hola",
        helpToday: "¿Cómo puedo ayudarte hoy?"
    }
};

/* ============ IDIOMAS ============ */

function t(chave, variaveis) {
    let texto =
        TRADUCOES[idiomaAtual][chave] ||
        TRADUCOES.pt[chave] ||
        chave;

    if (variaveis) {
        Object.keys(variaveis).forEach(function (nome) {
            texto = texto.replaceAll(
                "{" + nome + "}",
                variaveis[nome]
            );
        });
    }

    return texto;
}

function obterLocale() {
    const locales = {
        pt: "pt-BR",
        en: "en-US",
        es: "es-ES"
    };

    return locales[idiomaAtual] || "pt-BR";
}

function atualizarIdioma() {
    document.documentElement.lang = obterLocale();

    document.querySelectorAll("[data-i18n]").forEach(function (elemento) {
        const chave = elemento.dataset.i18n;
        elemento.textContent = t(chave);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (elemento) {
        elemento.placeholder = t(elemento.dataset.i18nPlaceholder);
    });

    document.querySelectorAll("[data-i18n-title]").forEach(function (elemento) {
        elemento.title = t(elemento.dataset.i18nTitle);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (elemento) {
        elemento.setAttribute(
            "aria-label",
            t(elemento.dataset.i18nAria)
        );
    });

    document.title = "Vortex AI — Chat";

    const seletor = document.querySelector("#idioma-chat");

    if (seletor && seletor.value !== idiomaAtual) {
        seletor.value = idiomaAtual;
    }

    atualizarSaudacao();
    atualizarIdiomaMicrofone();
}

function alterarIdioma(novoIdioma) {
    if (!["pt", "en", "es"].includes(novoIdioma)) {
        return;
    }

    idiomaAtual = novoIdioma;
    localStorage.setItem(CHAVE_IDIOMA, idiomaAtual);

    atualizarIdioma();
    atualizarHistorico();
}

const seletorIdioma = document.querySelector("#idioma-chat");

if (seletorIdioma) {
    seletorIdioma.value = idiomaAtual;

    seletorIdioma.addEventListener("change", function () {
        alterarIdioma(seletorIdioma.value);
    });
}

/* ============ ELEMENTOS ============ */

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

/* ============ SAUDAÇÃO ============ */

function atualizarSaudacao() {
    if (!saudacao || !usuarioAtual) return;

    const nome = usuarioAtual.nomeExibicao || "";

    if (idiomaAtual === "en") {
        saudacao.textContent = "Hello, " + nome + "!";
    } else if (idiomaAtual === "es") {
        saudacao.textContent = "¡Hola, " + nome + "!";
    } else {
        saudacao.textContent = "Olá, " + nome + "!";
    }
}

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

        atualizarIdioma();
        atualizarSaudacao();

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
        throw new Error(t("sessionExpired"));
    }

    const expiraEm = data.session.expires_at * 1000;

    if (Date.now() > expiraEm - 60000) {
        const { data: renovado, error } =
            await clienteSupabase.auth.refreshSession();

        if (error || !renovado.session) {
            throw new Error(t("sessionExpired"));
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
        throw new Error(t("serverOffline"));
    }

    let dados = {};

    try {
        dados = await resposta.json();
    } catch (erro) {
        dados = {};
    }

    if (resposta.status === 401) {
        throw new Error(t("sessionExpired"));
    }

    if (!resposta.ok) {
        throw new Error(
            dados.error || t("serverCommunicationError")
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
        alert(t("pdfLibraryError"));
        return;
    }

    const textoBotao = botao.innerHTML;

    try {
        botao.disabled = true;
        botao.innerHTML = t("generatingPdf");

        const areaPDF = document.createElement("div");
        areaPDF.className = "documento-pdf";

        const titulo = document.createElement("h1");
        titulo.textContent = "VORTEX AI";

        const subtitulo = document.createElement("p");
        subtitulo.textContent = t("pdfSubtitle");

        const data = document.createElement("p");
        data.textContent = new Date().toLocaleString(obterLocale());

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
        alert(t("pdfGenerationError"));
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
        botaoAnexar.title = t("attachPdf");
    }
}

async function extrairTextoPDF(arquivo) {
    if (!window.pdfjsLib) {
        throw new Error(t("pdfReaderError"));
    }

    if (arquivo.size > LIMITE_PDF_MB * 1024 * 1024) {
        throw new Error(
            t("pdfTooLarge", {
                limit: LIMITE_PDF_MB
            })
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
            "\n\n[" + t("pdfPageLabel") + " " + numero + "]\n" +
            textoPagina;

        if (textoCompleto.length >= LIMITE_CARACTERES_PDF) {
            textoCompleto = textoCompleto.slice(
                0,
                LIMITE_CARACTERES_PDF
            );

            textoCompleto += "\n\n" + t("pdfTextLimit");
            break;
        }
    }

    if (!textoCompleto.trim()) {
        throw new Error(t("pdfNoText"));
    }

    if (totalPaginas > LIMITE_PAGINAS_PDF) {
        textoCompleto +=
            "\n\n" +
            t("pdfPageLimit", {
                total: totalPaginas,
                limit: LIMITE_PAGINAS_PDF
            });
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
        alert(t("selectValidPdf"));
        campoArquivoPDF.value = "";
        return;
    }

    processandoPDF = true;
    pdfContexto = null;

    if (botaoAnexar) {
        botaoAnexar.disabled = true;
        botaoAnexar.title = t("readingPdf");
    }

    atualizarStatusPDF(
        t("readingFile", {
            name: arquivo.name
        })
    );

    try {
        const resultado = await extrairTextoPDF(arquivo);

        pdfContexto = {
            nome: arquivo.name,
            texto: resultado.texto,
            paginas: resultado.paginas
        };

        atualizarStatusPDF(
            t("pdfReady", {
                name: arquivo.name,
                pages: resultado.paginas
            })
        );
    } catch (erro) {
        console.error("Erro ao ler PDF:", erro);

        removerPDF();
        alert(erro.message || t("pdfReadError"));
    } finally {
        processandoPDF = false;

        if (botaoAnexar) {
            botaoAnexar.disabled = false;
            botaoAnexar.title = t("attachPdf");
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
            : t("newConversation");

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
    /^(?:vortex[,:]\s*)?(?:lembre-se(?:\s+de)?|guarde|memorize|não\s+esqueça|remember(?:\s+that)?|save|memorize|recuerda(?:\s+que)?|guarda|memoriza)(?:\s+que)?\s*[:,\\-]?\s*(.+)$/i;

const PADRAO_ESQUECER =
    /^(?:vortex[,:]\s*)?(?:esqueça|apague|remova|exclua|forget|delete|remove|olvida|borra|elimina)(?:\s+que)?\s*[:,\\-]?\s*(.+)$/i;

const PADRAO_CONSULTAR =
    /^(?:vortex[,:]\s*)?(?:o\s+que\s+você\s+lembra|o\s+que\s+sabe\s+sobre\s+mim|mostre\s+sua\s+memória|consultar\s+memória|ver\s+memória|what\s+do\s+you\s+remember|what\s+do\s+you\s+know\s+about\s+me|show\s+your\s+memory|check\s+memory|qué\s+recuerdas|qué\s+sabes\s+de\s+mí|muestra\s+tu\s+memoria|consultar\s+memoria|ver\s+memoria)/i;

const PADRAO_LIMPAR =
    /^(?:vortex[,:]\s*)?(?:apague|apagar|limpe|limpar|exclua|excluir|delete|clear|erase|borra|borrar|elimina|eliminar)\s+(?:(?:toda|todas)\s+)?(?:a\s+)?(?:sua\s+)?(?:sua\s+)?(?:memória|memoria|memory)(?:\s+permanente)?[.!?]?$/i;

async function executarComandoMemoria(texto) {
    const mensagem = texto.trim();

    if (PADRAO_CONSULTAR.test(mensagem)) {
        const memorias = await consultarMemoria();

        if (memorias.length === 0) {
            return t("memoryEmpty");
        }

        return t("memoryList") + "\n\n" +
            memorias.map(function (item, indice) {
                return (indice + 1) + ". " + item;
            }).join("\n");
    }

    if (PADRAO_LIMPAR.test(mensagem)) {
        const confirmar = window.confirm(
            t("confirmClearMemory")
        );

        if (!confirmar) {
            return t("memoryCancelled");
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
        throw new Error(t("invalidAiResponse"));
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
            textoExibido = t("pdfDefaultPrompt");
        }

        textoExibido += "\n\n" + t("attachedDocument", {
            name: documentoPDF.nome
        });
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

        if (
            erro.message.indexOf(t("sessionExpired")) !== -1 ||
            erro.message.indexOf("Sessão expirada") !== -1
        ) {
            voltarParaLogin();
            return;
        }

        const mensagemErro =
            t("cannotRespond") + erro.message;

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

    if (idiomaAtual === "en") {
        titulo.textContent = "Hello, " + nome + "!";
    } else if (idiomaAtual === "es") {
        titulo.textContent = "¡Hola, " + nome + "!";
    } else {
        titulo.textContent = "Olá, " + nome + "!";
    }

    const descricao = document.createElement("p");
    descricao.textContent = t("helpToday");

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

function atualizarIdiomaMicrofone() {
    if (!reconhecimento) return;

    reconhecimento.lang = obterLocale();

    if (botaoMicrofone && !gravando) {
        botaoMicrofone.title = t("speakToVortex");
        botaoMicrofone.setAttribute(
            "aria-label",
            t("startVoiceRecognition")
        );
    }
}

if (ReconhecimentoVoz && botaoMicrofone) {
    reconhecimento = new ReconhecimentoVoz();

    reconhecimento.continuous = true;
    reconhecimento.interimResults = true;

    atualizarIdiomaMicrofone();

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
        botaoMicrofone.title = t("stopRecording");
        botaoMicrofone.setAttribute(
            "aria-label",
            t("stopRecording")
        );
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
            alert(t("microphonePermission"));
        }
    };

    reconhecimento.onend = function () {
        gravando = false;

        botaoMicrofone.classList.remove("gravando");
        botaoMicrofone.title = t("speakToVortex");
        botaoMicrofone.setAttribute(
            "aria-label",
            t("startVoiceRecognition")
        );
    };

} else if (botaoMicrofone) {
    botaoMicrofone.disabled = true;
    botaoMicrofone.title = t("unsupportedVoice");
    botaoMicrofone.setAttribute(
        "aria-label",
        t("unsupportedVoice")
    );
}

/* ============ INICIALIZAÇÃO ============ */

iniciar();
