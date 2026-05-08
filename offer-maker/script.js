const STORAGE_KEY = "offerMakerHistory";

const form = document.getElementById("offerForm");
const offerPlans = document.getElementById("offerPlans");
const saveBtn = document.getElementById("saveBtn");
const historyList = document.getElementById("historyList");

let latestDraft = null;

function loadHistory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveHistory(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function money(n) {
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}

// 根据表单数据计算三档报价
function buildOfferData(data) {
  const floor = Number(data.floorPrice);
  const target = Number(data.targetPrice);
  const complexityRate = data.complexity === "复杂" ? 1.2 : data.complexity === "中等" ? 1.1 : 1;
  const urgentRate = data.urgent === "是" ? 1.15 : 1;
  const budgetRate = data.budgetLevel === "高" ? 1.12 : data.budgetLevel === "低" ? 0.95 : 1;

  // 基础版不低于底价
  const basicPrice = Math.max(floor, floor * complexityRate * urgentRate * budgetRate);
  // 标准版尽量贴合理想价格，再按实际情况上浮
  const standardPrice = Math.max(target, target * complexityRate * urgentRate * budgetRate);
  // 高配版用于承接高预算客户
  const premiumPrice = Math.max(standardPrice * 1.25, target * 1.4);

  return [
    {
      title: "基础版",
      price: basicPrice,
      fit: "预算谨慎、先小范围验证效果的客户",
      includes: ["1次需求沟通", "核心交付内容", "1轮小修改"],
      excludes: ["额外加急", "跨平台扩展", "长期陪跑"],
      timeline: "3-5天",
      pay: "50%预付款 + 50%交付后",
      script: `我们可以先从基础版开始，先把最关键问题解决，报价是${money(basicPrice)}。`
    },
    {
      title: "标准版",
      price: standardPrice,
      fit: "希望稳定推进，重视质量与效率的客户",
      includes: ["2次深度沟通", "完整方案+执行建议", "2轮优化修改"],
      excludes: ["超范围新增需求", "长期驻场支持"],
      timeline: "5-7天",
      pay: "60%预付款 + 40%交付后",
      script: `如果你希望效果和节奏都更稳，推荐标准版，报价是${money(standardPrice)}。`
    },
    {
      title: "高配版",
      price: premiumPrice,
      fit: "预算充足、追求省心与更高成果的客户",
      includes: ["优先排期", "定制策略与执行清单", "阶段复盘+答疑支持"],
      excludes: ["无限次修改", "未约定的额外现场服务"],
      timeline: "7-10天（含复盘）",
      pay: "70%预付款 + 30%收尾",
      script: `如果你希望一次做到位、并且留出优化空间，高配版会更适合，报价是${money(premiumPrice)}。`
    }
  ];
}

function renderPlans(plans) {
  offerPlans.innerHTML = plans
    .map((plan) => `
      <article class="card plan">
        <h3>${plan.title}</h3>
        <p class="price">${money(plan.price)}</p>
        <p><strong>适合客户：</strong>${plan.fit}</p>
        <p><strong>交付内容：</strong></p>
        <ul>${plan.includes.map((x) => `<li>${x}</li>`).join("")}</ul>
        <p><strong>不包含：</strong></p>
        <ul>${plan.excludes.map((x) => `<li>${x}</li>`).join("")}</ul>
        <p><strong>交付周期：</strong>${plan.timeline}</p>
        <p><strong>付款建议：</strong>${plan.pay}</p>
        <p><strong>报价话术：</strong>${plan.script}</p>
      </article>
    `)
    .join("");
}

function renderStatsAndHistory() {
  const history = loadHistory();
  const total = history.length;
  const dealCount = history.filter((x) => x.deal).length;
  const dealAmount = history.filter((x) => x.deal).reduce((sum, x) => sum + x.standardPrice, 0);
  const avg = total ? history.reduce((sum, x) => sum + x.standardPrice, 0) / total : 0;

  document.getElementById("statTotal").textContent = String(total);
  document.getElementById("statDeals").textContent = String(dealCount);
  document.getElementById("statAmount").textContent = money(dealAmount);
  document.getElementById("statAverage").textContent = money(avg);

  historyList.innerHTML = history.length
    ? history
        .map(
          (item) => `
      <article class="history-item">
        <div class="history-top">
          <div>
            <strong>${item.projectName}</strong>
            <div>${item.serviceType} · ${item.clientSource}</div>
            <div>标准版：${money(item.standardPrice)} · ${item.createdAt}</div>
            <div>状态：${item.deal ? "✅ 已成交" : "⏳ 待跟进"}</div>
          </div>
        </div>
        <div class="history-actions">
          <button class="btn-success" onclick="markDeal('${item.id}')">标记已成交</button>
          <button class="btn-danger" onclick="removeHistory('${item.id}')">删除</button>
        </div>
      </article>
    `
        )
        .join("")
    : "<p>还没有历史报价记录，先生成一条吧。</p>";
}

function markDeal(id) {
  const history = loadHistory().map((item) => (item.id === id ? { ...item, deal: true } : item));
  saveHistory(history);
  renderStatsAndHistory();
}

function removeHistory(id) {
  const history = loadHistory().filter((item) => item.id !== id);
  saveHistory(history);
  renderStatsAndHistory();
}

window.markDeal = markDeal;
window.removeHistory = removeHistory;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(form).entries());

  if (Number(formData.targetPrice) < Number(formData.floorPrice)) {
    alert("理想价格不能低于心理底价，请调整后再生成。");
    return;
  }

  const plans = buildOfferData(formData);
  renderPlans(plans);

  latestDraft = {
    ...formData,
    plans,
    standardPrice: plans[1].price,
    createdAt: new Date().toLocaleString("zh-CN", { hour12: false })
  };

  saveBtn.disabled = false;
});

saveBtn.addEventListener("click", () => {
  if (!latestDraft) return;
  const history = loadHistory();
  history.unshift({
    id: String(Date.now()),
    projectName: latestDraft.projectName,
    serviceType: latestDraft.serviceType,
    clientSource: latestDraft.clientSource,
    standardPrice: latestDraft.standardPrice,
    createdAt: latestDraft.createdAt,
    deal: false
  });
  saveHistory(history);
  renderStatsAndHistory();
  saveBtn.disabled = true;
  alert("报价已保存到历史记录。");
});

renderStatsAndHistory();
