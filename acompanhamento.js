// ========================================
// LOGIN ACOMPANHAMENTO - JAVASCRIPT
// ========================================

// Importar o cliente Supabase (assumindo que supabaseClient.js já o inicializou globalmente)
const supabase = window.supabase;

// Elementos DOM
let loginForm, emailInput, codigoInput, loginBtn, btnText, btnLoading;

// Inicialização
document.addEventListener("DOMContentLoaded", function() {
    initializeElements();
    setupEventListeners();
    checkExistingSession();
});

function initializeElements() {
    loginForm = document.getElementById("trackingLoginForm");
    emailInput = document.getElementById("email");
    codigoInput = document.getElementById("codigo");
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
        if (e.key === "Enter" && (emailInput === document.activeElement || codigoInput === document.activeElement)) {
            e.preventDefault();
            handleLogin(e);
        }
    });
    
    // Formatação automática do código
    if (codigoInput) {
        codigoInput.addEventListener("input", function(e) {
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
            
            // Formato: HMD-2025-0000
            if (value.length > 3 && !value.includes("-")) {
                value = value.substring(0, 3) + "-" + value.substring(3);
            }
            if (value.length > 8 && value.split("-").length === 2) {
                const parts = value.split("-");
                value = parts[0] + "-" + parts[1].substring(0, 4) + "-" + parts[1].substring(4);
            }
            
            e.target.value = value;
        });
    }
}

function checkExistingSession() {
    const trackingSession = localStorage.getItem("trackingSession");
    if (trackingSession) {
        try {
            const session = JSON.parse(trackingSession);
            if (session.expires > Date.now()) {
                // Sessão válida, redirecionar
                redirectToTracking(session.codigo);
                return;
            }
        } catch (e) {
            // Sessão inválida, limpar
            localStorage.removeItem("trackingSession");
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim().toLowerCase();
    const codigo = codigoInput.value.trim().toUpperCase();
    
    // Validação básica
    if (!email || !codigo) {
        showError("Por favor, preencha todos os campos.");
        return;
    }
    
    if (!isValidEmail(email)) {
        showError("Por favor, insira um e-mail válido.");
        return;
    }
    
    if (!isValidCodigo(codigo)) {
        showError("Por favor, insira um código válido no formato HMD-2025-0000.");
        return;
    }
    
    // Mostrar loading
    setLoading(true);
    
    try {
        // Credenciais de teste para funcionar sem Supabase
        const testCredentials = {
            email: "parceiro@teste.com",
            codigo: "HMD-2025-TESTE"
        };
        
        // Verificar credenciais de teste primeiro
        if (email === testCredentials.email && codigo === testCredentials.codigo) {
            // Login bem-sucedido com credenciais de teste
            showSuccess("Acesso autorizado! Redirecionando...");
            
            // Salvar sessão
            const session = {
                email: email,
                codigo: codigo,
                loginTime: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
            };
            localStorage.setItem("trackingSession", JSON.stringify(session));
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                redirectToTracking(codigo);
            }, 2000);
            return;
        }
        
        // Se não for credencial de teste, tentar Supabase (se disponível)
        if (typeof supabase !== 'undefined' && supabase) {
            const { data, error } = await supabase
                .from("indicacoes")
                .select("id, cliente_email")
                .eq("id", codigo)
                .eq("cliente_email", email)
                .single();
            
            if (error || !data) {
                showError("E-mail ou código de indicação incorretos. Verifique os dados e tente novamente.");
                setLoading(false);
                return;
            }
            
            // Login bem-sucedido
            showSuccess("Acesso autorizado! Redirecionando...");
            
            // Salvar sessão
            const session = {
                email: email,
                codigo: codigo,
                loginTime: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
            };
            localStorage.setItem("trackingSession", JSON.stringify(session));
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                redirectToTracking(codigo);
            }, 2000);
        } else {
            // Supabase não disponível, mostrar erro
            showError("E-mail ou código de indicação incorretos. Verifique os dados e tente novamente.");
            setLoading(false);
        }
        
    } catch (error) {
        console.error("Erro no login:", error);
        showError("Erro interno. Tente novamente em alguns instantes.");
        setLoading(false);
    }
}

function redirectToTracking(codigo) {
    // Redirecionar para a página de acompanhamento na nova estrutura
    window.location.href = `../acompanhamento/index.html?codigo=${codigo}`;
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

function isValidCodigo(codigo) {
    // Formato: HMD-2025-0000
    const codigoRegex = /^HMD-\d{4}-\d{4}$/;
    return codigoRegex.test(codigo);
}

// Limpar mensagens quando o usuário começar a digitar
document.addEventListener("input", function(e) {
    if (e.target === emailInput || e.target === codigoInput) {
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
// Este script agora se integra com o Supabase para autenticação.
// Ele verifica se o email e o código de indicação fornecidos correspondem a um registro na tabela 'indicacoes'.
// Certifique-se de que a tabela 'indicacoes' no Supabase tenha as colunas 'id' (para o código) e 'cliente_email'.


