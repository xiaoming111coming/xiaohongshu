const STORAGE_KEY = "leadBoardData";

const form = document.getElementById("leadForm");
const leadList = document.getElementById("leadList");
const statsCards = document.getElementById("statsCards");
const filterStatus = document.getElementById("filterStatus");

let leads = loadLeads();

render();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const newLead = {
    id: Date.now(),
    name: document.getElementById("name").value.trim(),
    source: document.getElementById("source").value,
    demand: document.getElementById("demand").value,
    status: document.getElementById("status").value,
    amount: Number(document.getElementById("amount").value || 0),
    followUpDate: document.getElementById("followUpDate").value,
    note: document.getElementById("note").value.trim(),
  };

  leads.unshift(newLead);
  saveLeads();
  form.reset();
  render();
});

filterStatus.addEventListener("change", render);

function loadLeads() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLeads() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function render() {
  renderStats();
  renderList();
}

function renderStats() {
  const today = todayString();
  const total = leads.length;
  const todayNeedFollow = leads.filter((lead) => lead.followUpDate && lead.followUpDate <= today).length;
  const expectedRevenue = leads.reduce((sum, lead) => sum + (lead.amount || 0), 0);
  const wonRevenue = leads
    .filter((lead) => lead.status === "已成交")
    .reduce((sum, lead) => sum + (lead.amount || 0), 0);

  statsCards.innerHTML = `
    <div class="stat-card"><div class="stat-title">总线索数</div><div class="stat-value">${total}</div></div>
    <div class="stat-card"><div class="stat-title">今日需跟进</div><div class="stat-value">${todayNeedFollow}</div></div>
    <div class="stat-card"><div class="stat-title">预计总收入</div><div class="stat-value">¥${expectedRevenue.toFixed(2)}</div></div>
    <div class="stat-card"><div class="stat-title">已成交收入</div><div class="stat-value">¥${wonRevenue.toFixed(2)}</div></div>
  `;
}

function renderList() {
  const selectedStatus = filterStatus.value;
  const list = selectedStatus === "全部" ? leads : leads.filter((lead) => lead.status === selectedStatus);

  if (list.length === 0) {
    leadList.innerHTML = '<div class="empty">还没有符合条件的线索，先添加一个吧 👇</div>';
    return;
  }

  leadList.innerHTML = list
    .map((lead) => {
      const urgent = isUrgent(lead.followUpDate);
      return `
      <article class="lead-item ${urgent ? "overdue" : ""}">
        <div class="lead-main">
          <strong>${escapeHtml(lead.name)}</strong>
          <span>${lead.status}</span>
        </div>
        <div class="lead-meta">
          来源：${lead.source} ｜ 需求：${lead.demand} ｜ 预计金额：¥${(lead.amount || 0).toFixed(2)}
        </div>
        <div class="lead-meta" style="color:${urgent ? "#ff4d6d" : "#687089"}">
          下次跟进：${lead.followUpDate || "未设置"}
        </div>
        <div class="lead-meta">备注：${escapeHtml(lead.note) || "无"}</div>
        <div class="actions">
          <select onchange="changeStatus(${lead.id}, this.value)">
            ${statusOptions(lead.status)}
          </select>
          <button class="deal-btn" onclick="markWon(${lead.id})">一键标记已成交</button>
          <button class="delete-btn" onclick="deleteLead(${lead.id})">删除</button>
        </div>
      </article>`;
    })
    .join("");
}

function isUrgent(dateString) {
  if (!dateString) return false;
  return dateString <= todayString();
}

function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function statusOptions(current) {
  const statuses = ["新线索", "已私聊", "已报价", "考虑中", "已成交", "已放弃"];
  return statuses
    .map((status) => `<option value="${status}" ${status === current ? "selected" : ""}>${status}</option>`)
    .join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 下面三个函数挂到 window，方便在按钮 onclick 里直接调用
window.changeStatus = function (id, newStatus) {
  leads = leads.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead));
  saveLeads();
  render();
};

window.markWon = function (id) {
  leads = leads.map((lead) => (lead.id === id ? { ...lead, status: "已成交" } : lead));
  saveLeads();
  render();
};

window.deleteLead = function (id) {
  leads = leads.filter((lead) => lead.id !== id);
  saveLeads();
  render();
};
