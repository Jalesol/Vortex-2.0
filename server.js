/* =================================
   VORTEX 2.0 - SERVIDOR
   Gemini AI + memória no Supabase
================================= */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const MODELO_PRINCIPAL = "gemini-3.8-flash";
const MODELO_RESERVA = "gemini-3.7-flash";

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

const ORIGENS_PERMITIDAS = [
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    process.env.SITE_URL
].filter(Boolean);

app.use(cors({
    origin: function (origem, callback) {
        if (!origem || ORIGENS_PERMITIDAS.includes(origem)) {
            return callback(null, true);
        }
        return callback(new Error("Origem não permitida."));
    }
}));

app.use(express.json({ limit: "1mb" }));

/* ============ AUTENTICAÇÃO ============ */

async function autenticar(req, res, next) {
    try {
        const cabecalho = req.headers.authorization || "";

        if (!cabecalho.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Não autenticado." });
        }

        const token = cabecalho.slice(7);

        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ error: "Sessão inválida." });
        }

        req.usuario = data.user;
        next();

    } catch (erro) {
        console.error("Erro na autenticação:", erro.message);
        return res.status(401).json({ error: "Sessão inválida." });
    }
}

/* ============ MEMÓRIA ============ */

async function listarMemorias(userId) {
    const { data, error } = await supabaseAdmin
        .from("memorias")
        .select("conteudo")
        .eq("user_id", userId)
        .order("criado_em", { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map(function (linha) {
        return linha.conteudo;
    });
}

/* ============ GEMINI ============ */

function erroTemporario(erro) {
    const mensagem = String(erro.message || erro);
    return /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|500|INTERNAL/i.test(mensagem);
}

function esperar(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

let ai = null;

async function carregarGemini() {
    const { GoogleGenAI } = await import("@google/genai");

    ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });
}

async function consultarModelo(modelo, contents, memorias) {
    const contexto = memorias.length > 0
        ? "INFORMAÇÕES IMPORTANTES SOBRE O USUÁRIO:\n\n" +
          memorias.map(function (item) {
              return "- " + item;
          }).join("\n") +
          "\n\nUse essas informações quando forem relevantes. " +
          "Não invente informações que não estejam registradas. " +
          "Se algo não estiver na memória, pergunte ao usuário."
        : "Nenhuma informação permanente sobre o usuário foi registrada.";

    const nome = process.env.NOME_DESENVOLVEDOR || "Lucas Jales de Oliveira";

    return await ai.models.generateContent({
        model: modelo,
        contents: contents,
        config: {
            systemInstruction:
                "Seu nome é Vortex.\n\n" +
                "Você é uma assistente de inteligência artificial desenvolvida por " +
                nome + ".\n\n" +
                "Responda em português brasileiro.\n\n" +
                "Seja inteligente, educada, objetiva, prestativa e natural.\n\n" +
                "Explique assuntos técnicos de maneira clara e ajude o usuário com " +
                "programação, tecnologia, estudos e projetos.\n\n" +
                contexto
        }
    });
}

async function tentarModelo(modelo, contents, memorias, tentativas) {
    let ultimoErro = null;

    for (let i = 0; i < tentativas; i++) {
        try {
            return await consultarModelo(modelo, contents, memorias);

        } catch (erro) {
            ultimoErro = erro;

            const mensagem = String(erro.message || erro);
            console.log("Falha em " + modelo + " (" + (i + 1) + "/" + tentativas + "): " +
                mensagem.slice(0, 100));

            if (/404|NOT_FOUND/i.test(mensagem)) break;
            if (!erroTemporario(erro)) break;

            await esperar(1500 * (i + 1));
        }
    }

    throw ultimoErro;
}

async function gerarResposta(contents, memorias) {
    try {
        return await tentarModelo(MODELO_PRINCIPAL, contents, memorias, 3);

    } catch (erro) {
        console.log("Principal falhou, ativando reserva...");
    }

    return await tentarModelo(MODELO_RESERVA, contents, memorias, 2);
}

/* ============ ROTAS ============ */

app.get("/api/health", function (req, res) {
    res.json({
        status: "online",
        message: "Servidor da Vortex funcionando!"
    });
});

app.get("/api/memory", autenticar, async function (req, res) {
    try {
        const memorias = await listarMemorias(req.usuario.id);
        res.json({ memories: memorias });

    } catch (erro) {
        console.error("Erro ao consultar memória:", erro.message);
        res.status(500).json({ error: "Não foi possível consultar a memória." });
    }
});

app.post("/api/memory", autenticar, async function (req, res) {
    try {
        const { fact } = req.body;

        if (typeof fact !== "string" || !fact.trim()) {
            return res.status(400).json({
                error: "Informe uma informação para guardar."
            });
        }

        const conteudo = fact.trim();

        if (conteudo.length > 500) {
            return res.status(400).json({
                error: "A informação deve ter no máximo 500 caracteres."
            });
        }

        const memorias = await listarMemorias(req.usuario.id);

        const jaExiste = memorias.some(function (item) {
            return item.toLowerCase() === conteudo.toLowerCase();
        });

        if (jaExiste) {
            return res.json({
                success: true,
                message: "Essa informação já está na memória."
            });
        }

        const { error } = await supabaseAdmin
            .from("memorias")
            .insert({
                user_id: req.usuario.id,
                conteudo: conteudo
            });

        if (error) throw new Error(error.message);

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

app.post("/api/memory/delete", autenticar, async function (req, res) {
    try {
        const { fact } = req.body;

        if (typeof fact !== "string" || !fact.trim()) {
            return res.status(400).json({
                error: "Informe qual informação deseja esquecer."
            });
        }

        const termo = fact.trim().toLowerCase();

        const memorias = await listarMemorias(req.usuario.id);

        const alvo = memorias.filter(function (item) {
            return item.toLowerCase().includes(termo);
        });

        if (alvo.length === 0) {
            return res.json({
                success: true,
                deleted: false,
                message: "Não encontrei essa informação na memória."
            });
        }

        const { error } = await supabaseAdmin
            .from("memorias")
            .delete()
            .eq("user_id", req.usuario.id)
            .in("conteudo", alvo);

        if (error) throw new Error(error.message);

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

app.post("/api/memory/clear", autenticar, async function (req, res) {
    try {
        const { error } = await supabaseAdmin
            .from("memorias")
            .delete()
            .eq("user_id", req.usuario.id);

        if (error) throw new Error(error.message);

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

app.post("/api/chat", autenticar, async function (req, res) {
    try {
        const { message } = req.body;
        const history = Array.isArray(req.body.history) ? req.body.history : [];

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ error: "Digite uma mensagem." });
        }

        const historicoSeguro = history
            .filter(function (item) {
                return item &&
                    ["user", "model"].indexOf(item.role) !== -1 &&
                    typeof item.text === "string";
            })
            .slice(-20)
            .map(function (item) {
                return {
                    role: item.role,
                    parts: [{ text: item.text.slice(0, 8000) }]
                };
            });

        const contents = historicoSeguro.concat([{
            role: "user",
            parts: [{ text: message.trim() }]
        }]);

        const memorias = await listarMemorias(req.usuario.id);

        const resposta = await gerarResposta(contents, memorias);
        const texto = resposta.text;

        if (!texto) {
            throw new Error("A Gemini não retornou uma resposta.");
        }

        res.json({ reply: texto });

    } catch (erro) {
        console.error("Erro na conversa:", erro.message);
        res.status(500).json({
            error: "A Vortex não conseguiu responder. " + erro.message
        });
    }
});

/* ============ INICIAR ============ */

async function iniciarServidor() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY não encontrada no .env");
        }

        if (!process.env.SUPABASE_URL) {
            throw new Error("SUPABASE_URL não encontrada no .env");
        }

        if (!process.env.SUPABASE_SECRET_KEY) {
            throw new Error("SUPABASE_SECRET_KEY não encontrada no .env");
        }

        await carregarGemini();

        app.listen(PORT, function () {
            console.log("--------------------------------");
            console.log(" VORTEX AI - SERVIDOR ONLINE");
            console.log("--------------------------------");
            console.log("Servidor: http://localhost:" + PORT);
            console.log("Modelo: " + MODELO_PRINCIPAL);
            console.log("Reserva: " + MODELO_RESERVA);
            console.log("--------------------------------");
        });

  } catch (erro) {
        console.error("Erro na conversa:", erro.message);

        const temporario = erroTemporario(erro);

        res.status(temporario ? 503 : 500).json({
            error: temporario
                ? "Estou com muita demanda agora. Tente de novo em alguns segundos."
                : "A Vortex não conseguiu responder."
        });
    }
}

iniciarServidor();