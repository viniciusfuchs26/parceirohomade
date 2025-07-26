// ========================================
// DASHBOARD ADMINISTRATIVO - JAVASCRIPT
// ========================================

// Importar o cliente Supabase (assumindo que supabaseClient.js já o inicializou globalmente)
const supabase = window.supabase;

// Variáveis globais
let currentUser = null;
let indicationsData = [];
let currentEditingId = null;
let currentAdvancingId = null;

// Inicialização
document.addEventListener("DOMContentLoaded", function() {
    checkAuthentication();
    initializeDashboard();
    setupEventListeners();
});

function checkAuthentication() {
    const adminSession = localStorage.getItem("adminSession");
    if (!adminSession) {
        // Redirecionar para login
        window.location.href = "../../pages/login/admin.html";
        return;
    }
    
    try {
        const session = JSON.parse(adminSession);
        if (session.expires < Date.now()) {
            // Sessão expirada
            localStorage.removeItem("adminSession");
            window.location.href = "../../pages/login/admin.html";
            return;
        }
        
        currentUser = session;
        updateUserInfo();
    } catch (e) {
        // Sessão inválida
        localStorage.removeItem("adminSession");
        window.location.href = "../../pages/login/admin.html";
    }
}

function updateUserInfo() {
    const userInfoElement = document.getElementById("userInfo");
    if (userInfoElement && currentUser) {
        userInfoElement.textContent = `Logado como: ${currentUser.email}`;
    }
}

async function initializeDashboard() {
    showLoading(true);
    
    try {
        await loadIndicationsFromSupabase();
        updateStatistics();
        renderIndicationsTable();
        
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        showError("Erro ao carregar dados do dashboard.");
    } finally {
        showLoading(false);
    }
}

async function loadIndicationsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from("indicacoes")
            .select("*")
            .order("data_criacao", { ascending: false });
        
        if (error) {
            console.error("Erro do Supabase:", error);
            return;
        }
        
        if (data && data.length > 0) {
            indicationsData = data;
        }
    } catch (error) {
        console.error("Erro ao conectar com Supabase:", error);
    }
}

function updateStatistics() {
    const total = indicationsData.length;
    const recebidas = indicationsData.filter(item => item.status === "recebido").length;
    const andamento = indicationsData.filter(item => ["contato", "curadoria", "negociacao"].includes(item.status)).length;
    const concluidas = indicationsData.filter(item => item.status === "pagamento").length;
    
    document.getElementById("totalIndicacoes").textContent = total;
    document.getElementById("indicacoesRecebidas").textContent = recebidas;
    document.getElementById("indicacoesAndamento").textContent = andamento;
    document.getElementById("indicacoesConcluidas").textContent = concluidas;
}

function renderIndicationsTable() {
    const tbody = document.getElementById("indicationsTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    indicationsData.forEach(indication => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${indication.id}</td>
            <td>${indication.indicador_nome}</td>
            <td>${indication.cliente_nome}</td>
            <td>${indication.valor_projeto}</td>
            <td><span class="status-badge status-${indication.status}">${getStatusLabel(indication.status)}</span></td>
            <td>${formatDate(indication.data_criacao)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-info btn-sm" onclick="showDetails('${indication.id}')">
                        👁️ Detalhes
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="editIndication('${indication.id}')">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-success btn-sm" onclick="advanceStage('${indication.id}')">
                        ➡️ Avançar
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getStatusLabel(status) {
    const labels = {
        "recebido": "Recebido",
        "contato": "Primeiro Contato",
        "curadoria": "Curadoria",
        "negociacao": "Negociação",
        "pagamento": "Pagamento"
    };
    return labels[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
}

function showDetails(id) {
    const indication = indicationsData.find(item => item.id === id);
    if (!indication) return;
    
    const modalBody = document.getElementById("detailsModalBody");
    modalBody.innerHTML = `
        <div class="indication-info">
            <h4>Informações da Indicação</h4>
            <p><strong>ID:</strong> ${indication.id}</p>
            <p><strong>Indicador:</strong> ${indication.indicador_nome} (${indication.indicador_email})</p>
            <p><strong>Cliente:</strong> ${indication.cliente_nome} (${indication.cliente_email})</p>
            <p><strong>Valor do Projeto:</strong> ${indication.valor_projeto}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${indication.status}">${getStatusLabel(indication.status)}</span></p>
            <p><strong>Data de Criação:</strong> ${formatDate(indication.data_criacao)}</p>
            <p><strong>Observações:</strong> ${indication.observacoes || "Nenhuma observação"}</p>
        </div>
    `;
    
    showModal("detailsModal");
}

function editIndication(id) {
    const indication = indicationsData.find(item => item.id === id);
    if (!indication) return;
    
    currentEditingId = id;
    
    // Preencher formulário
    document.getElementById("editIndicadorNome").value = indication.indicador_nome;
    document.getElementById("editIndicadorEmail").value = indication.indicador_email;
    document.getElementById("editClienteNome").value = indication.cliente_nome;
    document.getElementById("editClienteEmail").value = indication.cliente_email;
    document.getElementById("editValorProjeto").value = indication.valor_projeto;
    document.getElementById("editStatus").value = indication.status;
    document.getElementById("editObservacoes").value = indication.observacoes || "";
    
    showModal("editModal");
}

async function saveEdit() {
    if (!currentEditingId) return;
    
    const updatedData = {
        indicador_nome: document.getElementById("editIndicadorNome").value,
        indicador_email: document.getElementById("editIndicadorEmail").value,
        cliente_nome: document.getElementById("editClienteNome").value,
        cliente_email: document.getElementById("editClienteEmail").value,
        valor_projeto: document.getElementById("editValorProjeto").value,
        status: document.getElementById("editStatus").value,
        observacoes: document.getElementById("editObservacoes").value
    };
    
    showLoading(true);
    
    try {
        const { error } = await supabase
            .from("indicacoes")
            .update(updatedData)
            .eq("id", currentEditingId);
        
        if (error) {
            console.error("Erro ao atualizar no Supabase:", error);
            showNotification("Erro ao atualizar indicação: " + error.message, "error");
            return;
        }
        
        // Atualizar dados locais
        const index = indicationsData.findIndex(item => item.id === currentEditingId);
        if (index !== -1) {
            indicationsData[index] = { ...indicationsData[index], ...updatedData };
        }
        
        updateStatistics();
        renderIndicationsTable();
        closeModal("editModal");
        
        showNotification("Indicação atualizada com sucesso!", "success");
        
    } catch (error) {
        console.error("Erro ao salvar:", error);
        showNotification("Erro ao atualizar informações.", "error");
    } finally {
        showLoading(false);
        currentEditingId = null;
    }
}

function advanceStage(id) {
    const indication = indicationsData.find(item => item.id === id);
    if (!indication) return;
    
    currentAdvancingId = id;
    
    // Preencher informações da indicação
    const infoDiv = document.getElementById("advanceIndicationInfo");
    infoDiv.innerHTML = `
        <h4>Indicação: ${indication.id}</h4>
        <p><strong>Cliente:</strong> ${indication.cliente_nome}</p>
        <p><strong>Valor:</strong> ${indication.valor_projeto}</p>
    `;
    
    // Preencher etapa atual
    document.getElementById("currentStage").value = getStatusLabel(indication.status);
    
    // Configurar próximas etapas disponíveis
    const nextStageSelect = document.getElementById("nextStage");
    nextStageSelect.innerHTML = "<option value=\"\">Selecione a próxima etapa</option>";
    
    const stageOrder = ["recebido", "contato", "curadoria", "negociacao", "pagamento"];
    const currentIndex = stageOrder.indexOf(indication.status);
    
    for (let i = currentIndex + 1; i < stageOrder.length; i++) {
        const option = document.createElement("option");
        option.value = stageOrder[i];
        option.textContent = getStatusLabel(stageOrder[i]);
        nextStageSelect.appendChild(option);
    }
    
    document.getElementById("progressNotes").value = "";
    
    showModal("advanceModal");
}

async function advanceStageConfirm() {
    if (!currentAdvancingId) return;
    
    const nextStage = document.getElementById("nextStage").value;
    const progressNotes = document.getElementById("progressNotes").value;
    
    if (!nextStage) {
        showNotification("Por favor, selecione a próxima etapa", "error");
        return;
    }
    
    showLoading(true);
    
    try {
        const updatedData = {
            status: nextStage,
            observacoes: progressNotes || `Avançado para: ${getStatusLabel(nextStage)}`
        };
        
        const { error } = await supabase
            .from("indicacoes")
            .update(updatedData)
            .eq("id", currentAdvancingId);
        
        if (error) {
            console.error("Erro ao atualizar no Supabase:", error);
            showNotification("Erro ao avançar etapa: " + error.message, "error");
            return;
        }
        
        // Atualizar dados locais
        const index = indicationsData.findIndex(item => item.id === currentAdvancingId);
        if (index !== -1) {
            indicationsData[index] = { ...indicationsData[index], ...updatedData };
        }
        
        updateStatistics();
        renderIndicationsTable();
        closeModal("advanceModal");
        
        showNotification(`Etapa avançada para: ${getStatusLabel(nextStage)}`, "success");
        
    } catch (error) {
        console.error("Erro ao avançar etapa:", error);
        showNotification("Erro ao avançar etapa.", "error");
    } finally {
        showLoading(false);
        currentAdvancingId = null;
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("show");
        document.body.style.overflow = "auto";
    }
}

function showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
        if (show) {
            overlay.classList.remove("hidden");
        } else {
            overlay.classList.add("hidden");
        }
    }
}

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    
    if (type === "success") {
        notification.style.background = "linear-gradient(135deg, #28a745 0%, #20c997 100%)";
    } else if (type === "error") {
        notification.style.background = "linear-gradient(135deg, #dc3545 0%, #c82333 100%)";
    } else {
        notification.style.background = "linear-gradient(135deg, #17a2b8 0%, #20c997 100%)";
    }
    
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = "slideOutRight 0.3s ease-out";
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function showError(message) {
    const container = document.querySelector(".dashboard-content");
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <h2>Erro</h2>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
    }
}

async function refreshData() {
    showLoading(true);
    await loadIndicationsFromSupabase();
    updateStatistics();
    renderIndicationsTable();
    showLoading(false);
    showNotification("Dados atualizados com sucesso!", "success");
}

function logout() {
    localStorage.removeItem("adminSession");
    window.location.href = "../../pages/login/admin.html";
}

function setupEventListeners() {
    document.addEventListener("click", function(e) {
        if (e.target.classList.contains("modal")) {
            closeModal(e.target.id);
        }
    });
    
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            const openModal = document.querySelector(".modal.show");
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
    
    window.addEventListener("scroll", function() {
        const header = document.querySelector(".admin-header");
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });
}

window.showDetails = showDetails;
window.editIndication = editIndication;
window.saveEdit = saveEdit;
window.advanceStage = advanceStage;
window.advanceStageConfirm = advanceStageConfirm;
window.closeModal = closeModal;
window.refreshData = refreshData;
window.logout = logout;

const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Validação da integração Supabase:
// Este script agora se integra com o Supabase para carregar, editar e avançar dados de indicações.
// Ele utiliza `supabase.from("indicacoes").select("*")` para buscar dados, `supabase.from("indicacoes").update()` para atualizar.
// Certifique-se de que a tabela `indicacoes` no Supabase esteja configurada com as permissões RLS adequadas para leitura e escrita por usuários autenticados (ou anon, dependendo da sua estratégia).


