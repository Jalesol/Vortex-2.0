
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const ARQUIVO_MEMORIA = path.join(__dirname, "memoria.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// MODELOS DA VORTEX
const MODELO_PRINCIPAL = "gemini-3.6-flash";
const MODELO_RESERVA = "gemini-3.5-flash";

// MEMÓRIA
let memoriaPermanente = [];

const memoriaInicial = [
    "O nome do usuário é Lucas.",
    "O projeto de inteligência artificial do usuário se chama Vortex 2.0.",
    "O usuário está desenvolvendo a Vortex utilizando JavaScript."
];

// CARREGAR MEMÓRIA
async function carregarMemoria() {
    try {
        const conteudo = await fs.readFile(
            ARQUIVO_MEMORIA,
            "utf8"
        );

        const dados = JSON.parse(conteudo);

        memoriaPermanente = Array.isArray(dados.memories)
            ? dados.memories.filter(item => typeof item === "string")
            : [];

        console.log(
            `Memória carregada: ${memoriaPermanente.length} informações.`
        );

    } catch (erro) {
        if (erro.code !== "ENOENT") {
            throw erro;
        }

        memoriaPermanente = [...memoriaInicial];

        await salvarMemoria();

        console.log("Arquivo de memória criado!");
    }
}

// SALVAR MEMÓRIA NO ARQUIVO
async function salvarMemoria() {
    const dados = {
        memories: memoriaPermanente
    };

    await fs.writeFile(
        ARQUIVO_MEMORIA,
        JSON.stringify(dados, null, 4),
        "utf8"
    );
}

// TESTE DO SERVIDOR
app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        message: "Servidor da Vortex funcionando!"
    });
});

// CONSULTAR MEMÓRIA
app.get("/api/memory", (req, res) => {
    res.json({
        memories: memoriaPermanente
    });
});

// ADICIONAR INFORMAÇÃO
app.post("/api/memory", async (req, res) => {
    try {
        const { fact } = req.body;

        if (typeof fact !== "string" || !fact.trim()) {
            return res.status(400).json({
                error: "Informe uma informação para guardar."
            });
        }

        const novaInformacao = fact.trim();

        if (novaInformacao.length > 500) {
            return res.status(400).json({
                error: "A informação deve ter no máximo 500 caracteres."
            });
        }

        const jaExiste = memoriaPermanente.some(
            item => item.toLowerCase() === novaInformacao.toLowerCase()
        );

        if (jaExiste) {
            return res.json({
                success: true,
                message: "Essa informação já está na memória."
            });
        }

        memoriaPermanente.push(novaInformacao);

        await salvarMemoria();

        console.log("Nova memória salva:", novaInformacao);

        res.json({
            success: true,
            message: "Informação salva na memória da Vortex!"
        });

    } catch (erro) {
        console.error("Erro ao salvar memória:", erro.message);

        res.status(500).json({
            error: "Não foi possível salvar a memória."
        });
    }
});

// EXCLUIR UMA INFORMAÇÃO ESPECÍFICA
app.post("/api/memory/delete", async (req, res) => {
    try {
        const { fact } = req.body;

        if (typeof fact !== "string" || !fact.trim()) {
            return res.status(400).json({
                error: "Informe qual informação deseja esquecer."
            });
        }

        const termo = fact.trim().toLowerCase();

        const quantidadeAnterior = memoriaPermanente.length;

        memoriaPermanente = memoriaPermanente.filter(
            item => !item.toLowerCase().includes(termo)
        );

        if (memoriaPermanente.length === quantidadeAnterior) {
            return res.json({
                success: true,
                deleted: false,
                message: "Não encontrei essa informação na memória."
            });
        }

        await salvarMemoria();

        console.log("Memória excluída:", fact);

        res.json({
            success: true,
            deleted: true,
            message: "Informação removida da memória!"
        });

    } catch (erro) {
        console.error("Erro ao excluir memória:", erro.message);

        res.status(500).json({
            error: "Não foi possível excluir a informação."
        });
    }
});

// LIMPAR TODA A MEMÓRIA
app.post("/api/memory/clear", async (req, res) => {
    try {
        memoriaPermanente = [];

        await salvarMemoria();

        console.log("Toda a memória permanente foi apagada.");

        res.json({
            success: true,
            message: "Toda a memória foi apagada."
        });

    } catch (erro) {
        console.error("Erro ao limpar memória:", erro.message);

        res.status(500).json({
            error: "Não foi possível limpar a memória."
        });
    }
});

// IDENTIFICAR ERROS TEMPORÁRIOS
function erroTemporario(error) {
    const mensagem = String(error.message || error);

    return /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|500|INTERNAL/i
        .test(mensagem);
}

// AGUARDAR
function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// CONSULTAR MODELO
async function consultarModelo(ai, modelo, contents) {
    const contextoMemoria = memoriaPermanente.length > 0
        ? `
            INFORMAÇÕES IMPORTANTES SOBRE O USUÁRIO:

            ${memoriaPermanente.map(item => `- ${item}`).join("\n")}

            Utilize essas informações quando forem relevantes.
            Não invente informações que não estejam registradas.
            Se uma informação não estiver na memória, pergunte ao usuário.
        `
        : "Nenhuma informação permanente sobre o usuário foi registrada.";

    return await ai.models.generateContent({
        model: modelo,
        contents: contents,
        config: {
            systemInstruction: `
                Seu nome é Vortex.

                Você é uma assistente de inteligência
                artificial desenvolvida por Lucas
                Jales de Oliveira.

                Responda em português brasileiro.

                Seja inteligente, educada, objetiva,
                prestativa e natural.

                Explique assuntos técnicos de maneira
                clara e ajude o usuário com programação,
                tecnologia, estudos e projetos.

                ${contextoMemoria}
            `
        }
    });
}

// TENTAR MODELO PRINCIPAL E RESERVA
async function gerarResposta(ai, contents) {
    try {
        console.log("Consultando Gemini 3.6 Flash...");

        return await consultarModelo(
            ai,
            MODELO_PRINCIPAL,
            contents
        );

    } catch (erro) {
        console.error("Erro no modelo principal:", erro.message);

        if (!erroTemporario(erro)) {
            throw erro;
        }

        console.log("Tentando novamente em 2 segundos...");

        await esperar(2000);

        try {
            return await consultarModelo(
                ai,
                MODELO_PRINCIPAL,
                contents
            );

        } catch (segundoErro) {
            console.error(
                "Segunda tentativa falhou:",
                segundoErro.message
            );

            if (!erroTemporario(segundoErro)) {
                throw segundoErro;
            }
        }
    }

    console.log("Ativando Gemini 3.5 Flash...");

    try {
        return await consultarModelo(
            ai,
            MODELO_RESERVA,
            contents
        );

    } catch (erroReserva) {
        console.error(
            "Modelo reserva também falhou:",
            erroReserva.message
        );

        throw erroReserva;
    }
}

// INICIAR SERVIDOR
async function iniciarServidor() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error(
                "GEMINI_API_KEY não encontrada no .env"
            );
        }

        await carregarMemoria();

        const { GoogleGenAI } = await import("@google/genai");

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        console.log("SDK Gemini carregado.");

        // ROTA DE CHAT
        app.post("/api/chat", async (req, res) => {
            try {
                const { message, history = [] } = req.body;

                if (
                    typeof message !== "string" ||
                    !message.trim()
                ) {
                    return res.status(400).json({
                        error: "Digite uma mensagem."
                    });
                }

                const historicoSeguro = Array.isArray(history)
                    ? history
                        .filter(item =>
                            item &&
                            ["user", "model"].includes(item.role) &&
                            typeof item.text === "string"
                        )
                        .slice(-20)
                        .map(item => ({
                            role: item.role,
                            parts: [{
                                text: item.text.slice(0, 8000)
                            }]
                        }))
                    : [];

                const contents = [
                    ...historicoSeguro,
                    {
                        role: "user",
                        parts: [{
                            text: message.trim()
                        }]
                    }
                ];

                console.log("Mensagem recebida:", message);
                console.log(
                    "Informações na memória:",
                    memoriaPermanente.length
                );

                const resposta = await gerarResposta(ai, contents);

                const texto = resposta.text;

                if (!texto) {
                    throw new Error(
                        "A Gemini não retornou uma resposta."
                    );
                }

                console.log("Resposta enviada com sucesso!");

                res.json({
                    reply: texto
                });

            } catch (erro) {
                console.error("Erro na conversa:", erro.message);

                res.status(500).json({
                    error: "A Vortex não conseguiu responder. " +
                        erro.message
                });
            }
        });

        app.listen(PORT, () => {
            console.log("--------------------------------");
            console.log(" VORTEX AI - SERVIDOR ONLINE");
            console.log("--------------------------------");
            console.log(`Servidor: http://localhost:${PORT}`);
            console.log(`API: http://localhost:${PORT}/api/chat`);
            console.log(`Memória: http://localhost:${PORT}/api/memory`);
            console.log(`Modelo principal: ${MODELO_PRINCIPAL}`);
            console.log(`Modelo reserva: ${MODELO_RESERVA}`);
            console.log("--------------------------------");
        });

    } catch (erro) {
        console.error(
            "Erro ao iniciar servidor:",
            erro.message
        );

        process.exit(1);
    }
}

iniciarServidor();
