/* =================================
   VORTEX 2.0 - SISTEMA DE LOGIN
   Supabase Auth
================================= */

const SUPABASE_URL = "https://ytoykihtjcsttnmizbou.supabase.co";
const SUPABASE_KEY = "sb_publishable_7TFboQCIOTNwKLWsTlmTXg_jFCRM-IH";

const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ELEMENTOS
const formLogin = document.querySelector("#form-login");
const formRegister = document.querySelector("#form-register");

const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#password");
const erroLogin = document.querySelector("#erro-login");
const btnEntrar = document.querySelector("#btn-entrar");

const campoNome = document.querySelector("#nome");
const campoEmailRegister = document.querySelector("#email-register");
const campoSenhaRegister = document.querySelector("#password-register");
const erroRegister = document.querySelector("#erro-register");
const btnRegister = document.querySelector("#btn-register");

const irLogin = document.querySelector("#ir-login");
const irRegister = document.querySelector("#ir-register");

const btnGoogle = document.querySelector("#login-google");
const btnFacebook = document.querySelector("#login-facebook");
const avisoSocial = document.querySelector("#aviso-social");
const linkRecuperar = document.querySelector("#link-recuperar");

// ============ VALIDAÇÃO ============

const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

function emailValido(email) {
    return PADRAO_EMAIL.test(email);
}

function limparErro(elemento) {
    if (!elemento) return;
    elemento.textContent = "";
    elemento.style.color = "#FF6470";
}

function mostrarErro(elemento, mensagem) {
    if (!elemento) return;
    elemento.style.color = "#FF6470";
    elemento.textContent = mensagem;
}

function mostrarSucesso(elemento, mensagem) {
    if (!elemento) return;
    elemento.style.color = "#00C8FF";
    elemento.textContent = mensagem;
}

function marcarInvalido(campo, invalido) {
    if (!campo) return;
    campo.classList.toggle("campo-invalido", invalido);
}

// ============ TRADUZIR ERROS DO SUPABASE ============

function traduzirErro(mensagem) {
    const texto = String(mensagem || "").toLowerCase();

    if (texto.includes("invalid login credentials")) {
        return "E-mail ou senha incorretos.";
    }

    if (texto.includes("email not confirmed")) {
        return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
    }

    if (texto.includes("user already registered")) {
        return "Este e-mail já tem uma conta. Tente entrar.";
    }

    if (texto.includes("password should be at least")) {
        return "A senha precisa ter pelo menos 8 caracteres.";
    }

    if (texto.includes("unable to validate email") || texto.includes("invalid email")) {
        return "Digite um e-mail válido.";
    }

    if (texto.includes("rate limit") || texto.includes("too many")) {
        return "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.";
    }

    if (texto.includes("failed to fetch") || texto.includes("network")) {
        return "Não foi possível conectar. Verifique sua internet.";
    }

    if (texto.includes("auth")) {
        return "Erro de autenticação. Verifique as configurações no painel do Supabase.";
    }

    return "Algo deu errado. Tente novamente.";
}

// ============ ALTERNAR TELAS ============

function mostrarLogin() {
    if (formRegister) formRegister.hidden = true;
    if (formLogin) formLogin.hidden = false;
    limparErro(erroLogin);
    limparErro(erroRegister);
    if (campoEmail) campoEmail.focus();
}

function mostrarRegister() {
    if (formLogin) formLogin.hidden = true;
    if (formRegister) formRegister.hidden = false;
    limparErro(erroLogin);
    limparErro(erroRegister);
    if (campoNome) campoNome.focus();
}

if (irLogin) irLogin.addEventListener("click", mostrarLogin);
if (irRegister) irRegister.addEventListener("click", mostrarRegister);

// ============ LOGIN ============

if (formLogin) {
    formLogin.addEventListener("submit", async function (event) {
        event.preventDefault();

        limparErro(erroLogin);

        const email = campoEmail.value.trim();
        const senha = campoSenha.value;

        let temErro = false;

        if (!emailValido(email)) {
            mostrarErro(erroLogin, "Digite um e-mail válido.");
            marcarInvalido(campoEmail, true);
            temErro = true;
        } else {
            marcarInvalido(campoEmail, false);
        }

        if (senha.length < 8) {
            if (!temErro) {
                mostrarErro(erroLogin, "A senha precisa ter pelo menos 8 caracteres.");
            }
            marcarInvalido(campoSenha, true);
            temErro = true;
        } else {
            marcarInvalido(campoSenha, false);
        }

        if (temErro) return;

        btnEntrar.disabled = true;
        btnEntrar.textContent = "Entrando...";

        try {
            const { data, error } = await clienteSupabase.auth.signInWithPassword({
                email: email,
                password: senha
            });

            if (error) {
                console.error("Erro do Supabase no login:", error);
                mostrarErro(erroLogin, traduzirErro(error.message));
                return;
            }

            if (!data.session) {
                mostrarErro(erroLogin, "Não foi possível iniciar a sessão. Tente novamente.");
                return;
            }

            mostrarSucesso(erroLogin, "Entrando...");
            window.location.href = "chat.html";

        } catch (erro) {
            console.error("Erro no login:", erro);
            mostrarErro(erroLogin, "Não foi possível conectar. Tente novamente.");

        } finally {
            btnEntrar.disabled = false;
            btnEntrar.textContent = "Entrar";
        }
    });
}

// ============ CADASTRO ============

if (formRegister) {
    formRegister.addEventListener("submit", async function (event) {
        event.preventDefault();

        limparErro(erroRegister);

        const nome = campoNome.value.trim();
        const email = campoEmailRegister.value.trim();
        const senha = campoSenhaRegister.value;

        let temErro = false;

        if (nome.length < 2) {
            mostrarErro(erroRegister, "Digite seu nome.");
            marcarInvalido(campoNome, true);
            temErro = true;
        } else {
            marcarInvalido(campoNome, false);
        }

        if (!emailValido(email)) {
            if (!temErro) {
                mostrarErro(erroRegister, "Digite um e-mail válido.");
            }
            marcarInvalido(campoEmailRegister, true);
            temErro = true;
        } else {
            marcarInvalido(campoEmailRegister, false);
        }

        if (senha.length < 8) {
            if (!temErro) {
                mostrarErro(erroRegister, "A senha precisa ter pelo menos 8 caracteres.");
            }
            marcarInvalido(campoSenhaRegister, true);
            temErro = true;
        } else {
            marcarInvalido(campoSenhaRegister, false);
        }

        if (temErro) return;

        btnRegister.disabled = true;
        btnRegister.textContent = "Criando conta...";

        try {
            const { data, error } = await clienteSupabase.auth.signUp({
                email: email,
                password: senha,
                options: {
                    data: { nome: nome }
                }
            });

            if (error) {
                console.error("Erro do Supabase no cadastro:", error);
                mostrarErro(erroRegister, traduzirErro(error.message));
                return;
            }

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                mostrarErro(erroRegister, "Este e-mail já tem uma conta. Tente entrar.");
                return;
            }

            if (data.session) {
                window.location.href = "chat.html";
                return;
            }

            mostrarSucesso(
                erroRegister,
                "Conta criada! Confirme seu e-mail para poder entrar."
            );
            formRegister.reset();

        } catch (erro) {
            console.error("Erro no cadastro:", erro);
            mostrarErro(erroRegister, "Não foi possível conectar. Tente novamente.");

        } finally {
            btnRegister.disabled = false;
            btnRegister.textContent = "Criar minha conta";
        }
    });
}

// ============ LOGIN SOCIAL ============

async function entrarComProvedor(provedor) {
    if (avisoSocial) {
        avisoSocial.textContent = "Redirecionando...";
    }

    try {
        const { error } = await clienteSupabase.auth.signInWithOAuth({
            provider: provedor,
            options: {
                redirectTo: window.location.origin + "/chat.html"
            }
        });

        if (error) {
            console.error("Erro no login social:", error);
            if (avisoSocial) {
                avisoSocial.textContent =
                    provedor === "google"
                        ? "Login com Google ainda não está configurado no projeto."
                        : "Login com Facebook ainda não está configurado no projeto.";
            }
        }
    } catch (erro) {
        console.error("Erro no login social:", erro);
        if (avisoSocial) {
            avisoSocial.textContent = "Não foi possível iniciar o login social.";
        }
    }
}

if (btnGoogle) {
    btnGoogle.addEventListener("click", function () {
        entrarComProvedor("google");
    });
}

if (btnFacebook) {
    btnFacebook.addEventListener("click", function () {
        entrarComProvedor("facebook");
    });
}

// ============ RECUPERAR SENHA ============

if (linkRecuperar) {
    linkRecuperar.addEventListener("click", async function (event) {
        event.preventDefault();

        const email = campoEmail.value.trim();

        if (!emailValido(email)) {
            mostrarErro(erroLogin, "Digite seu e-mail acima para recuperar a senha.");
            marcarInvalido(campoEmail, true);
            return;
        }

        limparErro(erroLogin);

        const { error } = await clienteSupabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/redefinir-senha.html"
        });

        if (error) {
            mostrarErro(erroLogin, traduzirErro(error.message));
            return;
        }

        mostrarSucesso(erroLogin, "Enviei um link de recuperação para o seu e-mail.");
    });
}

// ============ SESSÃO EXISTENTE ============

async function verificarSessao() {
    try {
        const { data } = await clienteSupabase.auth.getSession();

        if (data && data.session) {
            window.location.href = "chat.html";
        }
    } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);
    }
}

verificarSessao();