/* =================================
   VORTEX 2.0 - SISTEMA DE CHAT
   Gemini AI + memória no Supabase
================================= */

const SUPABASE_URL = "https://ytoykihtjcsttnmizbou.supabase.co";
const SUPABASE_KEY = "sb_publishable_7TFboQCIOTNwKLWsTlmTXg_jFCRM-IH";

const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const API_BASE = (window.location.hostname === "localhost" ||
                  window.location.hostname === "127.0.0.1")
    ? "http://localhost:3000"
    : "";

const API_URL = API_BASE + "/api/chat";
const API_MEMORIA_URL = API_BASE + "/api/memory";

let usuarioAtual = null;
let conversaAtual = [];
let conversas = [];
let enviando = false;

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

/* ============ PROTEÇÃO DE ROTA ============ */

async function iniciar() {
    try {
        const { data } = await clienteSupabase.auth.getSession();

        if (!data || !data.session) {
            window.location.replace("index.html");
            return;
        }

        usuarioAtual = data.session.user;

        const nome = (usuarioAtual.user_metadata && usuarioAtual.user_metadata.nome)
            || (usuarioAtual.email || "").split("@")[0]
            || "Visitante";

        usuarioAtual.nomeExibicao = nome;

        if (saudacao) {
            saudacao.textContent = "Olá, " + nome + "!";
        }

        carregarConversasSalvas();
        carregarTema();
        atualizarHistorico();

        if (carregando) carregando.remove();
        app.hidden = false;

        if (campoMensagem) campoMensagem.focus();

    } catch (erro) {
        console.error("Erro ao iniciar o chat:", erro);
        window.location.replace("index.html");
    }
}

clienteSupabase.auth.onAuthStateChange(function (evento) {
    if (evento === "SIGNED_OUT") {
        window.location.replace("index.html");
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
        const { data: renovado, error } = await clienteSupabase.auth.refreshSession();

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

    const resposta = await fetch(url, {
        method: config.method || "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: config.body
    });

    let dados = {};

    try {
        dados = await resposta.json();
    } catch (erro) {
        dados = {};
    }

    if (!resposta.ok) {
        throw new Error(dados.error || "Falha na comunicação com o servidor.");
    }

    return dados;
}

/* ============ CONVERSAS LOCAIS ============ */

function chaveConversas() {
    return "vortexConversas_" + usuarioAtual.id;
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
        localStorage.setItem(chaveConversas(), JSON.stringify(conversas));
    } catch (erro) {
        console.error("Não foi possível salvar as conversas:", erro);
    }
}

/* ============ MENSAGENS ============ */

function criarMensagem(texto, tipo) {
    const mensagem = document.createElement("div");

    mensagem.classList.add("mensagem", tipo);
    mensagem.textContent = texto;

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

/* ============ HISTÓRICO DE CONVERSAS ============ */

function salvarConversa() {
    if (conversaAtual.length === 0) return;

    const id = conversaAtual.id || Date.now();
    conversaAtual.id = id;

    const conversa = {
        id: id,
        mensagens: conversaAtual.map(function (m) {
            return { texto: m.texto, tipo: m.tipo };
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

        item.textContent = primeira ? primeira.texto : "Nova conversa";

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

    conversaAtual = conversa.mensagens.map(function (m) {
        return { texto: m.texto, tipo: m.tipo };
    });

    conversaAtual.id = conversa.id;

    areaMensagens.innerHTML = "";

    conversaAtual.forEach(function (m) {
        criarMensagem(m.texto, m.tipo);
    });

    areaMensagens.scrollTop = areaMensagens.scrollHeight;
    atualizarHistorico();
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
    return Array.isArray(dados.memories) ? dados.memories : [];
}

async function salvarMemoriaPermanente(fact) {
    return await chamarApi(API_MEMORIA_URL, {
        method: "POST",
        body: JSON.stringify({ fact: fact })
    });
}

async function excluirMemoria(fact) {
    return await chamarApi(API_MEMORIA_URL + "/delete", {
        method: "POST",
        body: JSON.stringify({ fact: fact })
    });
}

async function limparTodaMemoria() {
    return await chamarApi(API_MEMORIA_URL + "/clear", {
        method: "POST",
        body: JSON.stringify({})
    });
}

const PADRAO_GUARDAR = /^(?:vortex[,:]\s*)?(?:lembre-se(?:\s+de)?|guarde|memorize|n[ãa]o\s+esque[çc]a)(?:\s+que)?\s*[:,\-]?\s*(.+)$/i;
const PADRAO_ESQUECER = /^(?:vortex[,:]\s*)?(?:esque[çc]a|apague|remova|exclua)(?:\s+que)?\s*[:,\-]?\s*(.+)$/i;
const PADRAO_CONSULTAR = /^(?:vortex[,:]\s*)?(?:o\s+que\s+voc[êe]\s+lembra|o\s+que\s+sabe\s+sobre\s+mim|mostre\s+sua\s+mem[óo]ria|consultar\s+mem[óo]ria|ver\s+mem[óo]ria)/i;
const PADRAO_LIMPAR = /^(?:vortex[,:]\s*)?(?:apague|apagar|limpe|limpar|exclua|excluir)\s+(?:toda\s+)?(?:a\s+)?(?:sua\s+)?mem[óo]ria(?:\s+permanente)?[.!]?$/i;

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
        const resultado = await excluirMemoria(paraEsquecer[1].trim());
        return resultado.message;
    }

    const paraGuardar = mensagem.match(PADRAO_GUARDAR);

    if (paraGuardar && paraGuardar[1]) {
        const resultado = await salvarMemoriaPermanente(paraGuardar[1].trim());
        return resultado.message;
    }

    return null;
}

/* ============ IA ============ */

async function responderComIA(texto) {
    const dados = await chamarApi(API_URL, {
        method: "POST",
        body: JSON.stringify({
            message: texto,
            history: prepararHistorico()
        })
    });

    if (!dados.reply) {
        throw new Error("A Vortex não recebeu uma resposta válida.");
    }

    return dados.reply;
}

/* ============ ENVIAR ============ */

async function enviarMensagem(event) {
    event.preventDefault();

    if (enviando) return;

    const texto = campoMensagem.value.trim();

    if (!texto) return;

    removerBoasVindas();
    criarMensagem(texto, "usuario");

    conversaAtual.push({ texto: texto, tipo: "usuario" });

    if (!conversaAtual.id) {
        conversaAtual.id = Date.now();
    }

    campoMensagem.value = "";
    enviando = true;
    campoMensagem.disabled = true;

    const botaoEnviar = formularioChat.querySelector('button[type="submit"]');

    if (botaoEnviar) botaoEnviar.disabled = true;

    const pensamento = mostrarPensamento();

    try {
        let resposta = await executarComandoMemoria(texto);

        if (resposta === null) {
            resposta = await responderComIA(texto);
        }

        pensamento.remove();
        criarMensagem(resposta, "vortex");

        conversaAtual.push({ texto: resposta, tipo: "vortex" });
        salvarConversa();

    } catch (erro) {
        pensamento.remove();
        console.error("Erro na Vortex:", erro);

        if (erro.message.indexOf("expirada") !== -1 ||
            erro.message.indexOf("Sessão") !== -1) {
            window.location.replace("index.html");
            return;
        }

        const mensagemErro = "Não consegui responder. " + erro.message;

        criarMensagem(mensagemErro, "erro");
        conversaAtual.push({ texto: mensagemErro, tipo: "vortex" });
        salvarConversa();

    } finally {
        enviando = false;
        campoMensagem.disabled = false;
        campoMensagem.focus();

        if (botaoEnviar) botaoEnviar.disabled = false;
    }
}

/* ============ NOVO CHAT ============ */

function novoChat() {
    if (enviando) return;

    salvarConversa();
    conversaAtual = [];

    const nome = usuarioAtual ? usuarioAtual.nomeExibicao : "Visitante";

    areaMensagens.innerHTML =
        '<div class="boas-vindas" id="boas-vindas">' +
        "<h1>Olá, " + nome + "!</h1>" +
        "<p>Como posso te ajudar hoje?</p>" +
        "</div>";

    atualizarHistorico();
    campoMensagem.focus();
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
    document.body.classList.toggle("tema-claro", salvo === "claro");
}

/* ============ SAIR ============ */

async function sair() {
    if (enviando) return;

    salvarConversa();

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

iniciar();