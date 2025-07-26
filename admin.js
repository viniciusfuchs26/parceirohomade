// ========================================
// LOGIN ADMINISTRATIVO - JAVASCRIPT
// ========================================

// Importar o cliente Supabase (assumindo que supabaseClient.js já o inicializou globalmente)
const supabase = window.supabase;

// Elementos DOM
let loginForm, emailInput, passwordInput, loginBtn, btnText, btnLoading;

// Inicialização
document.addEventListener("DOMContentLoaded", function() {
    initializeElements();
    setupEventListeners();
    checkExistingSession();
});

function initializeElements() {
    loginForm = document.getElementById("adminLoginForm");
    emailInput = document.getElementById("email");
    passwordInput = document.getElementById("password");
    loginBtn = document.querySelector(".login-btn");
    btnText = document.querySelector(".btn-text");
    btnLoading = document.querySelector(".btn-loading");
}

function setupEventListeners() {
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
    
    // Enter key para submeter
    document.addEventListener("keypress", function(e) {
        if (e.key === "Enter" && (emailInput === document.activeElement || passwordInput === document.activeElement)) {
            e.preventDefault();
            handleLogin(e);
        }
    });
}

function checkExistingSession() {
    const adminSession = localStorage.getItem("adminSession");
    if (adminSession) {
        try {
            const session = JSON.parse(adminSession);
            if (session.expires > Date.now()) {
                // Sessão válida, redirecionar
                redirectToDashboard();
                return;
            }
        } catch (e) {
            // Sessão inválida, limpar
            localStorage.removeItem("adminSession");
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validação básica
    if (!email || !password) {
        showError("Por favor, preencha todos os campos.");
        return;
    }
    
    if (!isValidEmail(email)) {
        showError("Por favor, insira um e-mail válido.");
        return;
    }
    
    // Mostrar loading
    setLoading(true);
    
    try {
        // Credenciais de teste para funcionar sem Supabase
        const testCredentials = {
            email: "admin@homade.com",
            password: "admin123"
        };
        
        // Verificar credenciais de teste primeiro
        if (email === testCredentials.email && password === testCredentials.password) {
            // Login bem-sucedido com credenciais de teste
            showSuccess("Login realizado com sucesso! Redirecionando...");
            
            // Salvar sessão
            const session = {
                email: email,
                loginTime: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
            };
            localStorage.setItem("adminSession", JSON.stringify(session));
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                redirectToDashboard();
            }, 2000);
            return;
        }
        
        // Se não for credencial de teste, tentar Supabase (se disponível)
        if (typeof supabase !== 'undefined' && supabase && supabase.auth) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) {
                console.error("Erro de autenticação Supabase:", error.message);
                showError("E-mail ou senha incorretos. Tente novamente.");
                setLoading(false);
                return;
            }
            
            // Login bem-sucedido
            showSuccess("Login realizado com sucesso! Redirecionando...");
            
            // Salvar sessão
            const session = {
                email: data.user.email,
                loginTime: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
            };
            localStorage.setItem("adminSession", JSON.stringify(session));
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                redirectToDashboard();
            }, 2000);
        } else {
            // Supabase não disponível, mostrar erro
            showError("E-mail ou senha incorretos. Tente novamente.");
            setLoading(false);
        }
        
    } catch (error) {
        console.error("Erro no login:", error);
        showError("Erro interno. Tente novamente em alguns instantes.");
        setLoading(false);
    }
}

function redirectToDashboard() {
    // Redirecionar para a página de dashboard na nova estrutura
    window.location.href = "../dashboard/index.html";
}

function setLoading(loading) {
    if (loading) {
        loginBtn.classList.add("loading");
        loginBtn.disabled = true;
        btnText.style.display = "none";
        btnLoading.style.display = "inline";
    } else {
        loginBtn.classList.remove("loading");
        loginBtn.disabled = false;
        btnText.style.display = "inline";
        btnLoading.style.display = "none";
    }
}

function showError(message) {
    hideMessages();
    
    let errorDiv = document.querySelector(".error-message");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        loginForm.insertBefore(errorDiv, loginForm.firstChild);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
        errorDiv.style.display = "none";
    }, 5000);
}

function showSuccess(message) {
    hideMessages();
    
    let successDiv = document.querySelector(".success-message");
    if (!successDiv) {
        successDiv = document.createElement("div");
        successDiv.className = "success-message";
        loginForm.insertBefore(successDiv, loginForm.firstChild);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = "block";
}

function hideMessages() {
    const errorMsg = document.querySelector(".error-message");
    const successMsg = document.querySelector(".success-message");
    
    if (errorMsg) errorMsg.style.display = "none";
    if (successMsg) successMsg.style.display = "none";
}

function isValidEmail(email) {
    const emailRegex = /^[^
]+@[^
]+\.[^
]+$/;
    return emailRegex.test(email);
}

function togglePassword() {
    const passwordField = document.getElementById("password");
    const toggleBtn = document.querySelector(".toggle-password");
    
    if (passwordField.type === "password") {
        passwordField.type = "text";
        toggleBtn.textContent = "🙈";
    } else {
        passwordField.type = "password";
        toggleBtn.textContent = "👁️";
    }
}

// Função global para toggle de senha
window.togglePassword = togglePassword;

// Limpar mensagens quando o usuário começar a digitar
document.addEventListener("input", function(e) {
    if (e.target === emailInput || e.target === passwordInput) {
        hideMessages();
    }
});

// Prevenir múltiplos submits
let isSubmitting = false;
function preventMultipleSubmits(e) {
    if (isSubmitting) {
        e.preventDefault();
        return false;
    }
    isSubmitting = true;
    setTimeout(() => {
        isSubmitting = false;
    }, 2000);
}

if (loginForm) {
    loginForm.addEventListener("submit", preventMultipleSubmits);
}

// Validação da integração Supabase:
// Este script agora se integra com o Supabase para autenticação de administradores.
// Ele utiliza `supabase.auth.signInWithPassword` para autenticar usuários.
// Certifique-se de que o Supabase Auth esteja configurado para permitir autenticação por e-mail/senha.


