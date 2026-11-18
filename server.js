
/* =================================
   VORTEX 2.0 - SERVIDOR
   IA via Groq + memória no Supabase
   Compatível com ambiente local e Vercel
================================= */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const MODELO_PRINCIPAL = "openai/gpt-oss-120b";
const MODELO_RESERVA = "openai/gpt-oss-20b";

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

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

const ORIGENS_PERMITIDAS = [
    process.env.SITE_URL
].filter(Boolean);

/* ============ MIDDLEWARES ============ */

app.use(cors({
    origin: function (origem, callback) {
        const local = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origem || "");

        if (!origem || local || ORIGENS_PERMITIDAS.includes(origem)) {
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
            return res.status(401).json({
                error: "Não autenticado."
            });
        }

        const token = cabecalho.slice(7);

        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                error: "Sessão inválida."
            });
        }

        req.usuario = data.user;
        next();

    } catch (erro) {
        console.error("Erro na autenticação:", erro.message);

        return res.status(401).json({
            error: "Sessão inválida."
        });
    }
}

/* ============ MEMÓRIA ============ */

async function listarMemorias(userId) {
    const { data, error } = await supabaseAdmin
        .from("memorias")
        .select("conteudo")
        .eq("user_id", userId)
        .order("criado_em", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(function (linha) {
        return linha.conteudo;
    });
}

/* ============ IA ============ */

function erroTemporario(erro) {
    const texto = String(erro.message || erro);

    return /429|rate limit|503|500|502|504|timeout|ECONNRESET/i.test(texto);
}

function esperar(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

function montarInstrucao(memorias) {
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

    return "Seu nome é Vortex.\n\n" +
        "Você é uma assistente de inteligência artificial desenvolvida por " +
        nome + ".\n\n" +
        "Responda em português brasileiro.\n\n" +
        "Seja inteligente, educada, objetiva, prestativa e natural.\n\n" +
        "Explique assuntos técnicos de maneira clara e ajude o usuário com " +
        "programação, tecnologia, estudos e projetos.\n\n" +
        contexto;
}

async function consultarModelo(modelo, mensagens, memorias) {
    const resposta = await groq.chat.completions.create({
        model: modelo,
        messages: [
            {
                role: "system",
                content: montarInstrucao(memorias)
            }
        ].concat(mensagens),
        temperature: 0.7,
        max_tokens: 1024
    });

    const escolha = resposta.choices && resposta.choices[0];

    return escolha && escolha.message
        ? escolha.message.content
        : null;
}

async function tentarModelo(modelo, mensagens, memorias, tentativas) {
    let ultimoErro = null;

    for (let i = 0; i < tentativas; i++) {
        try {
            const texto = await consultarModelo(
                modelo,
                mensagens,
                memorias
            );

            if (texto) {
                return texto;
            }

            throw new Error("Resposta vazia do modelo.");

        } catch (erro) {
            ultimoErro = erro;

            const mensagem = String(erro.message || erro);

            console.log(
                "Falha em " + modelo + " (" +
                (i + 1) + "/" + tentativas + "): " +
                mensagem.slice(0, 100)
            );

            if (/model_decommissioned|model_not_found|404/i.test(mensagem)) {
                break;
            }

            if (!erroTemporario(erro)) {
                break;
            }

            await esperar(1200 * (i + 1));
        }
    }

    throw ultimoErro;
}

async function gerarResposta(mensagens, memorias) {
    try {
        return await tentarModelo(
            MODELO_PRINCIPAL,
            mensagens,
            memorias,
            3
        );

    } catch (erro) {
        console.log("Principal falhou, ativando reserva...");
    }

    return await tentarModelo(
        MODELO_RESERVA,
        mensagens,
        memorias,
        2
    );
}

/* ============ ROTAS DA API ============ */

app.get("/api/health", function (req, res) {
    res.json({
        status: "online",
        message: "Servidor da Vortex funcionando!"
    });
});

app.get("/api/memory", autenticar, async function (req, res) {
    try {
        const memorias = await listarMemorias(req.usuario.id);

        res.json({
            memories: memorias
        });

    } catch (erro) {
        console.error("Erro ao consultar memória:", erro.message);

        res.status(500).json({
            error: "Não foi possível consultar a memória."
        });
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

        if (error) {
            throw new Error(error.message);
        }

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

        if (error) {
            throw new Error(error.message);
        }

        res.json({
            success: true,
            deleted: true,
            message: "Informação removida da memória!"
        });

    } catch (erro) {
        console.error("Erro ao excluir memória:", erro.message);

        res.status(500).json({
            error: "Não foi possível excluir a memória."
        });
    }
});

app.post("/api/memory/clear", autenticar, async function (req, res) {
    try {
        const { error } = await supabaseAdmin
            .from("memorias")
            .delete()
            .eq("user_id", req.usuario.id);

        if (error) {
            throw new Error(error.message);
        }

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

        const history = Array.isArray(req.body.history)
            ? req.body.history
            : [];

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Digite uma mensagem."
            });
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
                    role: item.role === "model"
                        ? "assistant"
                        : "user",
                    content: item.text.slice(0, 8000)
                };
            });

        const mensagens = historicoSeguro.concat([{
            role: "user",
            content: message.trim()
        }]);

        const memorias = await listarMemorias(req.usuario.id);

        const texto = await gerarResposta(mensagens, memorias);

        res.json({
            reply: texto
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
});

/* ============ ARQUIVOS DO SITE ============ */

// No ambiente local, serve os arquivos da pasta public.
// Na Vercel, os arquivos de public são servidos pela CDN.
app.use(express.static(path.join(__dirname, "public")));

// Atalho para abrir o chat.
app.get("/chat", function (req, res) {
    res.redirect(302, "/chat.html");
});

/* ============ TRATAMENTO DE ERROS ============ */

app.use(function (erro, req, res, next) {
    console.error("Erro no servidor:", erro.message);

    if (res.headersSent) {
        return next(erro);
    }

    res.status(500).json({
        error: "Erro interno do servidor."
    });
});

/* ============ INICIAR SERVIDOR ============ */

function iniciarServidor() {
    if (!process.env.GROQ_API_KEY) {
        console.error("ERRO: GROQ_API_KEY não encontrada.");
        process.exit(1);
    }

    if (!process.env.SUPABASE_URL) {
        console.error("ERRO: SUPABASE_URL não encontrada.");
        process.exit(1);
    }

    if (!process.env.SUPABASE_SECRET_KEY) {
        console.error("ERRO: SUPABASE_SECRET_KEY não encontrada.");
        process.exit(1);
    }

    app.listen(PORT, function () {
        console.log("--------------------------------");
        console.log(" VORTEX AI - SERVIDOR ONLINE");
        console.log("--------------------------------");
        console.log("Site: http://localhost:" + PORT);
        console.log("Modelo: " + MODELO_PRINCIPAL);
        console.log("Reserva: " + MODELO_RESERVA);
        console.log("--------------------------------");
    });
}

iniciarServidor();
