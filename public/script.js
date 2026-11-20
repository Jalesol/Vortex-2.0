
/* =================================
   VORTEX 2.0 - SISTEMA DE LOGIN
   Supabase Auth + Internacionalização
================================= */

const SUPABASE_URL = "https://ytoykihtjcsttnmizbou.supabase.co";
const SUPABASE_KEY = "sb_publishable_7TFboQCIOTNwKLWsTlmTXg_jFCRM-IH";

const clienteSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

/* ============ ELEMENTOS ============ */

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
const avisoSocial = document.querySelector("#aviso-social");
const linkRecuperar = document.querySelector("#link-recuperar");

const seletorIdioma = document.querySelector("#Idioma");

/* =================================
   SISTEMA DE IDIOMAS
================================= */

const traducoes = {

    pt: {
        nav_home: "Home",
        nav_about: "Sobre",
        nav_blog: "Blog",
        nav_contact: "Contato",
        nav_login: "Entrar",
        nav_register: "Cadastrar",

        login_title: "Entrar na Vortex",
        register_title: "Criar conta",

        label_name: "Nome",
        label_email: "E-mail",
        label_password: "Senha",

        placeholder_name: "Como podemos te chamar?",
        placeholder_email: "Digite seu e-mail",
        placeholder_password: "Digite sua senha",
        placeholder_new_password: "Mínimo de 8 caracteres",

        forgot_password: "Esqueceu sua senha?",

        login_button: "Entrar",
        register_button: "Criar minha conta",

        continue_with: "Ou continue com",
        google_login: "Entrar com Google",

        loading_login: "Entrando...",
        loading_register: "Criando conta...",

        invalid_email: "Digite um e-mail válido.",
        invalid_password: "A senha precisa ter pelo menos 8 caracteres.",
        invalid_name: "Digite seu nome.",

        login_error: "E-mail ou senha incorretos.",
        email_not_confirmed: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
        already_registered: "Este e-mail já tem uma conta. Tente entrar.",
        rate_limit: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
        connection_error: "Não foi possível conectar. Verifique sua internet.",
        auth_error: "Erro de autenticação. Verifique as configurações no Supabase.",
        generic_error: "Algo deu errado. Tente novamente.",

        session_error: "Não foi possível iniciar a sessão. Tente novamente.",

        success_login: "Entrando...",
        success_register: "Conta criada! Confirme seu e-mail para poder entrar.",

        google_redirect: "Redirecionando para o Google...",
        google_error: "Não foi possível entrar com o Google. Tente novamente.",
        google_start_error: "Não foi possível iniciar o login com Google.",

        recover_email: "Digite seu e-mail acima para recuperar a senha.",
        recover_success: "Enviei um link de recuperação para o seu e-mail.",
        recover_error: "Não foi possível enviar o link. Tente novamente."
    },

    en: {
        nav_home: "Home",
        nav_about: "About",
        nav_blog: "Blog",
        nav_contact: "Contact",
        nav_login: "Sign in",
        nav_register: "Sign up",

        login_title: "Sign in to Vortex",
        register_title: "Create account",

        label_name: "Name",
        label_email: "Email",
        label_password: "Password",

        placeholder_name: "What should we call you?",
        placeholder_email: "Enter your email",
        placeholder_password: "Enter your password",
        placeholder_new_password: "At least 8 characters",

        forgot_password: "Forgot your password?",

        login_button: "Sign in",
        register_button: "Create my account",

        continue_with: "Or continue with",
        google_login: "Sign in with Google",

        loading_login: "Signing in...",
        loading_register: "Creating account...",

        invalid_email: "Enter a valid email address.",
        invalid_password: "Your password must contain at least 8 characters.",
        invalid_name: "Enter your name.",

        login_error: "Incorrect email or password.",
        email_not_confirmed: "Please confirm your email before signing in. Check your inbox.",
        already_registered: "This email already has an account. Try signing in.",
        rate_limit: "Too many attempts. Wait a minute and try again.",
        connection_error: "Unable to connect. Check your internet connection.",
        auth_error: "Authentication error. Check your Supabase settings.",
        generic_error: "Something went wrong. Please try again.",

        session_error: "Unable to start your session. Please try again.",

        success_login: "Signing in...",
        success_register: "Account created! Confirm your email before signing in.",

        google_redirect: "Redirecting to Google...",
        google_error: "Unable to sign in with Google. Please try again.",
        google_start_error: "Unable to start Google sign-in.",

        recover_email: "Enter your email above to reset your password.",
        recover_success: "A password recovery link has been sent to your email.",
        recover_error: "Unable to send the link. Please try again."
    },

    es: {
        nav_home: "Inicio",
        nav_about: "Acerca de",
        nav_blog: "Blog",
        nav_contact: "Contacto",
        nav_login: "Iniciar sesión",
        nav_register: "Registrarse",

        login_title: "Entrar en Vortex",
        register_title: "Crear cuenta",

        label_name: "Nombre",
        label_email: "Correo electrónico",
        label_password: "Contraseña",

        placeholder_name: "¿Cómo podemos llamarte?",
        placeholder_email: "Introduce tu correo electrónico",
        placeholder_password: "Introduce tu contraseña",
        placeholder_new_password: "Mínimo de 8 caracteres",

        forgot_password: "¿Olvidaste tu contraseña?",

        login_button: "Entrar",
        register_button: "Crear mi cuenta",

        continue_with: "O continúa con",
        google_login: "Entrar con Google",

        loading_login: "Iniciando sesión...",
        loading_register: "Creando cuenta...",

        invalid_email: "Introduce un correo electrónico válido.",
        invalid_password: "La contraseña debe tener al menos 8 caracteres.",
        invalid_name: "Introduce tu nombre.",

        login_error: "Correo electrónico o contraseña incorrectos.",
        email_not_confirmed: "Confirma tu correo electrónico antes de entrar. Revisa tu bandeja de entrada.",
        already_registered: "Este correo electrónico ya tiene una cuenta. Intenta iniciar sesión.",
        rate_limit: "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
        connection_error: "No se pudo conectar. Comprueba tu conexión a Internet.",
        auth_error: "Error de autenticación. Comprueba la configuración de Supabase.",
        generic_error: "Algo salió mal. Inténtalo de nuevo.",

        session_error: "No se pudo iniciar la sesión. Inténtalo de nuevo.",

        success_login: "Iniciando sesión...",
        success_register: "¡Cuenta creada! Confirma tu correo electrónico para entrar.",

        google_redirect: "Redirigiendo a Google...",
        google_error: "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
        google_start_error: "No se pudo iniciar el acceso con Google.",

        recover_email: "Introduce tu correo electrónico arriba para recuperar tu contraseña.",
        recover_success: "Se ha enviado un enlace de recuperación a tu correo electrónico.",
        recover_error: "No se pudo enviar el enlace. Inténtalo de nuevo."
    }

};

/* ============ IDIOMA ATUAL ============ */

function obterIdiomaSalvo() {
    try {
        const idioma = localStorage.getItem("vortex_idioma");

        return traducoes[idioma] ? idioma : "pt";
    } catch (erro) {
        return "pt";
    }
}

let idiomaAtual = obterIdiomaSalvo();

function t(chave) {
    return traducoes[idiomaAtual][chave] ||
        traducoes.pt[chave] ||
        chave;
}

/* ============ APLICAR TRADUÇÕES ============ */

function aplicarIdioma(idioma) {

    if (!traducoes[idioma]) {
        idioma = "pt";
    }

    idiomaAtual = idioma;

    const idiomasHTML = {
        pt: "pt-BR",
        en: "en",
        es: "es"
    };

    document.documentElement.lang = idiomasHTML[idioma];

    document.querySelectorAll("[data-i18n]").forEach(elemento => {

        const chave = elemento.dataset.i18n;

        if (traducoes[idioma][chave]) {
            elemento.textContent = t(chave);
        }

    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(elemento => {

        const chave = elemento.dataset.i18nPlaceholder;

        if (traducoes[idioma][chave]) {
            elemento.placeholder = t(chave);
        }

    });

    document.querySelectorAll("[data-i18n-title]").forEach(elemento => {

        const chave = elemento.dataset.i18nTitle;

        if (traducoes[idioma][chave]) {
            elemento.title = t(chave);
        }

    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach(elemento => {

        const chave = elemento.dataset.i18nAriaLabel;

        if (traducoes[idioma][chave]) {
            elemento.setAttribute("aria-label", t(chave));
        }

    });

    if (seletorIdioma) {
        seletorIdioma.value = idioma;
    }

    try {
        localStorage.setItem("vortex_idioma", idioma);
    } catch (erro) {
        console.warn("Não foi possível salvar o idioma:", erro);
    }

    if (formLogin && !btnEntrar.disabled) {
        btnEntrar.textContent = t("login_button");
    }

    if (formRegister && !btnRegister.disabled) {
        btnRegister.textContent = t("register_button");
    }
}

if (seletorIdioma) {

    seletorIdioma.addEventListener("change", function () {
        aplicarIdioma(this.value);
    });

}

aplicarIdioma(idiomaAtual);

/* =================================
   CONTROLE DE NAVEGAÇÃO
================================= */

let indoParaChat = false;

function irParaChat() {

    if (indoParaChat) return;

    indoParaChat = true;

    window.location.replace("chat.html");
}

/* =================================
   VALIDAÇÃO
================================= */

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
    elemento.hidden = false;
}

function mostrarSucesso(elemento, mensagem) {

    if (!elemento) return;

    elemento.style.color = "#00C8FF";
    elemento.textContent = mensagem;
    elemento.hidden = false;
}

function marcarInvalido(campo, invalido) {

    if (!campo) return;

    campo.classList.toggle("campo-invalido", invalido);
}

/* =================================
   TRADUZIR ERROS DO SUPABASE
================================= */

function traduzirErro(mensagem) {

    const texto = String(mensagem || "").toLowerCase();

    if (texto.includes("invalid login credentials")) {
        return t("login_error");
    }

    if (texto.includes("email not confirmed")) {
        return t("email_not_confirmed");
    }

    if (texto.includes("user already registered")) {
        return t("already_registered");
    }

    if (texto.includes("password should be at least")) {
        return t("invalid_password");
    }

    if (
        texto.includes("unable to validate email") ||
        texto.includes("invalid email")
    ) {
        return t("invalid_email");
    }

    if (
        texto.includes("rate limit") ||
        texto.includes("too many")
    ) {
        return t("rate_limit");
    }

    if (
        texto.includes("failed to fetch") ||
        texto.includes("network")
    ) {
        return t("connection_error");
    }

    if (texto.includes("auth")) {
        return t("auth_error");
    }

    return t("generic_error");
}

/* =================================
   ALTERNAR TELAS
================================= */

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

if (irLogin) {
    irLogin.addEventListener("click", mostrarLogin);
}

if (irRegister) {
    irRegister.addEventListener("click", mostrarRegister);
}

/* =================================
   LOGIN
================================= */

if (formLogin) {

    formLogin.addEventListener("submit", async function (event) {

        event.preventDefault();

        limparErro(erroLogin);

        const email = campoEmail.value.trim();
        const senha = campoSenha.value;

        let temErro = false;

        if (!emailValido(email)) {

            mostrarErro(erroLogin, t("invalid_email"));
            marcarInvalido(campoEmail, true);

            temErro = true;

        } else {

            marcarInvalido(campoEmail, false);

        }

        if (senha.length < 8) {

            if (!temErro) {
                mostrarErro(erroLogin, t("invalid_password"));
            }

            marcarInvalido(campoSenha, true);

            temErro = true;

        } else {

            marcarInvalido(campoSenha, false);

        }

        if (temErro) return;

        btnEntrar.disabled = true;
        btnEntrar.textContent = t("loading_login");

        try {

            const { data, error } =
                await clienteSupabase.auth.signInWithPassword({
                    email: email,
                    password: senha
                });

            if (error) {

                console.error("Erro do Supabase no login:", error);

                mostrarErro(erroLogin, traduzirErro(error.message));

                return;
            }

            if (!data.session) {

                mostrarErro(erroLogin, t("session_error"));

                return;
            }

            mostrarSucesso(erroLogin, t("success_login"));

            irParaChat();

        } catch (erro) {

            console.error("Erro no login:", erro);

            mostrarErro(erroLogin, t("connection_error"));

        } finally {

            if (!indoParaChat) {

                btnEntrar.disabled = false;
                btnEntrar.textContent = t("login_button");

            }

        }

    });

}

/* =================================
   CADASTRO
================================= */

if (formRegister) {

    formRegister.addEventListener("submit", async function (event) {

        event.preventDefault();

        limparErro(erroRegister);

        const nome = campoNome.value.trim();
        const email = campoEmailRegister.value.trim();
        const senha = campoSenhaRegister.value;

        let temErro = false;

        if (nome.length < 2) {

            mostrarErro(erroRegister, t("invalid_name"));
            marcarInvalido(campoNome, true);

            temErro = true;

        } else {

            marcarInvalido(campoNome, false);

        }

        if (!emailValido(email)) {

            if (!temErro) {
                mostrarErro(erroRegister, t("invalid_email"));
            }

            marcarInvalido(campoEmailRegister, true);

            temErro = true;

        } else {

            marcarInvalido(campoEmailRegister, false);

        }

        if (senha.length < 8) {

            if (!temErro) {
                mostrarErro(erroRegister, t("invalid_password"));
            }

            marcarInvalido(campoSenhaRegister, true);

            temErro = true;

        } else {

            marcarInvalido(campoSenhaRegister, false);

        }

        if (temErro) return;

        btnRegister.disabled = true;
        btnRegister.textContent = t("loading_register");

        try {

            const { data, error } =
                await clienteSupabase.auth.signUp({
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

            if (
                data.user &&
                data.user.identities &&
                data.user.identities.length === 0
            ) {

                mostrarErro(erroRegister, t("already_registered"));

                return;
            }

            if (data.session) {

                irParaChat();

                return;
            }

            mostrarSucesso(
                erroRegister,
                t("success_register")
            );

            formRegister.reset();

        } catch (erro) {

            console.error("Erro no cadastro:", erro);

            mostrarErro(erroRegister, t("connection_error"));

        } finally {

            if (!indoParaChat) {

                btnRegister.disabled = false;
                btnRegister.textContent = t("register_button");

            }

        }

    });

}

/* =================================
   LOGIN COM GOOGLE
================================= */

async function entrarComGoogle() {

    if (avisoSocial) {
        avisoSocial.textContent = t("google_redirect");
    }

    if (btnGoogle) {
        btnGoogle.disabled = true;
    }

    try {

        const { error } =
            await clienteSupabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin + "/chat.html"
                }
            });

        if (error) {

            console.error("Erro no login com Google:", error);

            if (avisoSocial) {
                avisoSocial.textContent = t("google_error");
            }

            if (btnGoogle) {
                btnGoogle.disabled = false;
            }

        }

    } catch (erro) {

        console.error("Erro no login com Google:", erro);

        if (avisoSocial) {
            avisoSocial.textContent = t("google_start_error");
        }

        if (btnGoogle) {
            btnGoogle.disabled = false;
        }

    }

}

if (btnGoogle) {
    btnGoogle.addEventListener("click", entrarComGoogle);
}

/* =================================
   RECUPERAR SENHA
================================= */

if (linkRecuperar) {

    linkRecuperar.addEventListener("click", async function (event) {

        event.preventDefault();

        const email = campoEmail.value.trim();

        if (!emailValido(email)) {

            mostrarErro(
                erroLogin,
                t("recover_email")
            );

            marcarInvalido(campoEmail, true);

            return;
        }

        limparErro(erroLogin);

        try {

            const { error } =
                await clienteSupabase.auth.resetPasswordForEmail(email, {
                    redirectTo:
                        window.location.origin + "/redefinir-senha.html"
                });

            if (error) {

                mostrarErro(erroLogin, traduzirErro(error.message));

                return;
            }

            mostrarSucesso(
                erroLogin,
                t("recover_success")
            );

        } catch (erro) {

            console.error("Erro ao recuperar senha:", erro);

            mostrarErro(
                erroLogin,
                t("recover_error")
            );

        }

    });

}

/* =================================
   SESSÃO JÁ ABERTA
================================= */

async function temSessaoValida() {

    try {

        const { data, error } = await clienteSupabase.auth.getUser();

        if (error) return false;

        return !!(data && data.user);

    } catch (erro) {

        return false;

    }

}

async function iniciarTela() {

    const validando = await temSessaoValida();

    if (validando) {
        irParaChat();
    }

}

iniciarTela();
