
/* =================================
   VORTEX 2.0 - SISTEMA DE CHAT
   Gemini AI + Memória permanente
================================= */

// CONFIGURAÇÃO DAS APIs
const API_URL = "http://localhost:3000/api/chat";
const API_MEMORIA_URL = "http://localhost:3000/api/memory";

// DADOS DO USUÁRIO
const nomeUsuario = localStorage.getItem("vortexNome") || "";

// ELEMENTOS HTML
const saudacao = document.querySelector("#saudacao");
const formularioChat = document.querySelector("#form-chat");
const campoMensagem = document.querySelector("#mensagem");
const areaMensagens = document.querySelector("#mensagens");
const botaoNovoChat = document.querySelector("#novo-chat");
const botaoSair = document.querySelector("#sair");
const botaoTema = document.querySelector("#alternar-tema");
const listaConversas = document.querySelector("#lista-conversas");

// CONVERSAS
let conversas = JSON.parse(
    localStorage.getItem("vortexConversas") || "[]"
);

let conversaAtual = [];
let enviando = false;

// SAUDAÇÃO
if (saudacao) {
    saudacao.textContent = nomeUsuario
        ? `Olá, ${nomeUsuario}!`
        : "Olá! Como posso te chamar?";
}

// CRIAR MENSAGEM
function criarMensagem(texto, tipo) {
    const mensagem = document.createElement("div");

    mensagem.classList.add("mensagem", tipo);
    mensagem.textContent = texto;

    areaMensagens.appendChild(mensagem);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;

    return mensagem;
}

// SALVAR CONVERSA
function salvarConversa() {
    if (conversaAtual.length === 0) return;

    const id = conversaAtual.id || Date.now();
    conversaAtual.id = id;

    const conversa = {
        id: id,
        mensagens: conversaAtual.map(function (mensagem) {
            return {
                texto: mensagem.texto,
                tipo: mensagem.tipo
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

    localStorage.setItem(
        "vortexConversas",
        JSON.stringify(conversas)
    );

    atualizarHistorico();
}

// ATUALIZAR HISTÓRICO
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

// ABRIR CONVERSA
function abrirConversa(id) {
    const conversa = conversas.find(function (item) {
        return item.id === id;
    });

    if (!conversa) return;

    conversaAtual = conversa.mensagens.map(function (mensagem) {
        return {
            texto: mensagem.texto,
            tipo: mensagem.tipo
        };
    });

    conversaAtual.id = conversa.id;

    areaMensagens.innerHTML = "";

    conversaAtual.forEach(function (mensagem) {
        criarMensagem(mensagem.texto, mensagem.tipo);
    });

    atualizarHistorico();
}

// INDICADOR DE DIGITAÇÃO
function mostrarPensamento() {
    const pensamento = document.createElement("div");

    pensamento.classList.add(
        "mensagem",
        "vortex",
        "pensando"
    );

    pensamento.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    areaMensagens.appendChild(pensamento);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;

    return pensamento;
}

// PREPARAR HISTÓRICO PARA GEMINI
function prepararHistorico() {
    return conversaAtual
        .slice(0, -1)
        .map(function (mensagem) {
            return {
                role: mensagem.tipo === "usuario"
                    ? "user"
                    : "model",
                text: mensagem.texto
            };
        });
}

// IDENTIFICAR PEDIDO PARA GUARDAR
function identificarInformacaoParaGuardar(texto) {
    const padrao = /^(?:vortex[,:]\s*)?(?:lembre-se(?:\s+de)?|guarde|memorize|não\s+esqueça)(?:\s+que)?\s*[:,\-]?\s*(.+)$/i;

    const resultado = texto.trim().match(padrao);

    if (!resultado || !resultado[1]) {
        return null;
    }

    return resultado[1].trim();
}

// IDENTIFICAR PEDIDO PARA ESQUECER
function identificarInformacaoParaEsquecer(texto) {
    const padrao = /^(?:vortex[,:]\s*)?(?:esqueça|esqueca|apague|remova|exclua)(?:\s+que)?\s*[:,\-]?\s*(.+)$/i;

    const resultado = texto.trim().match(padrao);

    if (!resultado || !resultado[1]) {
        return null;
    }

    return resultado[1].trim();
}

// CONSULTAR MEMÓRIA
async function consultarMemoria() {
    const resposta = await fetch(API_MEMORIA_URL);

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.error || "Não foi possível consultar a memória."
        );
    }

    return dados.memories || [];
}

// SALVAR MEMÓRIA
async function salvarMemoriaPermanente(fact) {
    const resposta = await fetch(API_MEMORIA_URL, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            fact: fact
        })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.error || "Não foi possível salvar a memória."
        );
    }

    return dados;
}

// EXCLUIR UMA MEMÓRIA
async function excluirMemoria(fact) {
    const resposta = await fetch(
        `${API_MEMORIA_URL}/delete`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                fact: fact
            })
        }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.error || "Não foi possível excluir a memória."
        );
    }

    return dados;
}

// LIMPAR TODA A MEMÓRIA
async function limparTodaMemoria() {
    const resposta = await fetch(
        `${API_MEMORIA_URL}/clear`,
        {
            method: "POST"
        }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.error || "Não foi possível limpar a memória."
        );
    }

    return dados;
}

// IDENTIFICAR E EXECUTAR COMANDOS DE MEMÓRIA
async function executarComandoMemoria(texto) {
    const mensagem = texto.trim();

    // CONSULTAR MEMÓRIA
    if (
        /^(?:vortex[,:]\s*)?(?:o que você lembra|o que voce lembra|o que sabe sobre mim|o que você sabe sobre mim|mostre sua memória|mostre sua memoria|consultar memória|consultar memoria|ver memória|ver memoria)/i.test(mensagem)
    ) {
        const memorias = await consultarMemoria();

        if (memorias.length === 0) {
            return "Minha memória permanente está vazia no momento.";
        }

        return "Estas são as informações que guardo na minha memória:\n\n" +
            memorias.map((item, indice) =>
                `${indice + 1}. ${item}`
            ).join("\n");
    }

    // LIMPAR TODA A MEMÓRIA
    if (
        /^(?:vortex[,:]\s*)?(?:apague|apagar|limpe|limpar|exclua|excluir)\s+(?:toda\s+)?(?:a\s+)?(?:sua\s+)?mem[oó]ria(?:\s+permanente)?[.!]?$/i.test(mensagem)
    ) {
        const confirmar = window.confirm(
            "Tem certeza de que deseja apagar TODAS as informações da memória permanente da Vortex?"
        );

        if (!confirmar) {
            return "Tudo bem! Mantive todas as informações da minha memória.";
        }

        const resultado = await limparTodaMemoria();

        return resultado.message;
    }

    // EXCLUIR UMA INFORMAÇÃO
    const informacaoParaEsquecer =
        identificarInformacaoParaEsquecer(mensagem);

    if (informacaoParaEsquecer) {
        const resultado = await excluirMemoria(
            informacaoParaEsquecer
        );

        return resultado.message;
    }

    // GUARDAR UMA INFORMAÇÃO
    const informacaoParaGuardar =
        identificarInformacaoParaGuardar(mensagem);

    if (informacaoParaGuardar) {
        const resultado = await salvarMemoriaPermanente(
            informacaoParaGuardar
        );

        return resultado.message;
    }

    return null;
}

// CONVERSAR COM A GEMINI
async function responderComIA(texto) {
    const historico = prepararHistorico();

    const resposta = await fetch(API_URL, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: texto,
            history: historico
        })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.error || "Erro ao consultar a inteligência artificial."
        );
    }

    if (!dados.reply) {
        throw new Error(
            "A Vortex não recebeu uma resposta válida."
        );
    }

    return dados.reply;
}

// ENVIAR MENSAGEM
async function enviarMensagem(event) {
    event.preventDefault();

    if (enviando) return;

    const texto = campoMensagem.value.trim();

    if (!texto) return;

    const boasVindas = document.querySelector("#boas-vindas");

    if (boasVindas) {
        boasVindas.remove();
    }

    criarMensagem(texto, "usuario");

    conversaAtual.push({
        texto: texto,
        tipo: "usuario"
    });

    if (!conversaAtual.id) {
        conversaAtual.id = Date.now();
    }

    campoMensagem.value = "";

    enviando = true;

    if (campoMensagem) {
        campoMensagem.disabled = true;
    }

    const botaoEnviar = formularioChat.querySelector(
        'button[type="submit"]'
    );

    if (botaoEnviar) {
        botaoEnviar.disabled = true;
    }

    const pensamento = mostrarPensamento();

    try {
        // PRIMEIRO, VERIFICAR COMANDOS DE MEMÓRIA
        let resposta = await executarComandoMemoria(texto);

        // SE NÃO FOR UM COMANDO, CONSULTAR A GEMINI
        if (resposta === null) {
            resposta = await responderComIA(texto);
        }

        pensamento.remove();

        criarMensagem(resposta, "vortex");

        conversaAtual.push({
            texto: resposta,
            tipo: "vortex"
        });

        salvarConversa();

    } catch (erro) {
        pensamento.remove();

        console.error("Erro na Vortex:", erro);

        const mensagemErro =
            `Não consegui executar essa ação. ${erro.message}`;

        criarMensagem(mensagemErro, "vortex");

        conversaAtual.push({
            texto: mensagemErro,
            tipo: "vortex"
        });

        salvarConversa();

    } finally {
        enviando = false;

        if (campoMensagem) {
            campoMensagem.disabled = false;
            campoMensagem.focus();
        }

        if (botaoEnviar) {
            botaoEnviar.disabled = false;
        }
    }
}

// NOVO CHAT
function novoChat() {
    if (enviando) return;

    salvarConversa();

    conversaAtual = [];

    areaMensagens.innerHTML = `
        <div class="boas-vindas" id="boas-vindas">
            <h1>Olá, ${nomeUsuario || "Visitante"}!</h1>
            <p>Como posso te ajudar hoje?</p>
        </div>
    `;

    atualizarHistorico();

    if (campoMensagem) {
        campoMensagem.focus();
    }
}

// ALTERNAR TEMA
function alternarTema() {
    document.body.classList.toggle("tema-claro");

    const temaAtual = document.body.classList.contains("tema-claro")
        ? "claro"
        : "escuro";

    localStorage.setItem("vortexTema", temaAtual);
}

// CARREGAR TEMA
function carregarTema() {
    const temaSalvo = localStorage.getItem("vortexTema");

    document.body.classList.toggle(
        "tema-claro",
        temaSalvo === "claro"
    );
}

// SAIR
function sair() {
    if (enviando) return;

    salvarConversa();

    window.location.href = "index.html";
}

// EVENTOS
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

// INICIALIZAÇÃO
carregarTema();
atualizarHistorico();
