const studentTable = document.getElementById("student-table");
const rankingTable = document.getElementById("ranking-table");
const statsGrid = document.getElementById("stats-grid");
const distributionGrid = document.getElementById("distribution-grid");
const failingList = document.getElementById("failing-list");
const toast = document.getElementById("toast");

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.background = isError ? "rgba(165,59,42,0.95)" : "rgba(30,26,22,0.92)";
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Request failed");
  }
  return result.data;
}

function renderStudents(students) {
  if (!students.length) {
    studentTable.innerHTML = '<tr><td colspan="8" class="empty">当前没有学生数据</td></tr>';
    return;
  }

  studentTable.innerHTML = students.map((student) => `
    <tr>
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.math.toFixed(2)}</td>
      <td>${student.english.toFixed(2)}</td>
      <td>${student.cLanguage.toFixed(2)}</td>
      <td>${student.total.toFixed(2)}</td>
      <td>${student.gpa.toFixed(2)}</td>
      <td><button class="danger" data-id="${student.id}">删除</button></td>
    </tr>
  `).join("");
}

function renderRanking(rows) {
  if (!rows.length) {
    rankingTable.innerHTML = '<tr><td colspan="5" class="empty">暂无排名数据</td></tr>';
    return;
  }

  rankingTable.innerHTML = rows.map((student) => `
    <tr>
      <td>${student.rank}</td>
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.total.toFixed(2)}</td>
      <td>${student.gpa.toFixed(2)}</td>
    </tr>
  `).join("");
}

function renderStats(stats) {
  const items = [
    ["高数", stats.math],
    ["英语", stats.english],
    ["C语言", stats.cLanguage]
  ];

  statsGrid.innerHTML = items.map(([label, item]) => `
    <div class="metric-card">
      <h3>${label}</h3>
      <p>平均分：${item.average.toFixed(2)}</p>
      <p>最高分：${item.highest.toFixed(2)}</p>
      <p>最低分：${item.lowest.toFixed(2)}</p>
      <p>及格率：${item.passRate.toFixed(2)}%</p>
      <p>优秀率：${item.excellentRate.toFixed(2)}%</p>
    </div>
  `).join("");
}

function renderDistribution(items) {
  distributionGrid.innerHTML = items.map((item) => `
    <div class="distribution-card">
      <h3>${item.label}</h3>
      <p>人数：${item.count}</p>
    </div>
  `).join("");
}

function renderFailing(items) {
  if (!items.length) {
    failingList.innerHTML = '<div class="empty">当前没有不及格学生</div>';
    return;
  }

  failingList.innerHTML = items.map((item) => `
    <div class="fail-card">
      <h3>${item.name} <small>(${item.id})</small></h3>
      <p>不及格科目：${item.failedSubjects.join("、")}</p>
    </div>
  `).join("");
}

async function refreshDashboard(students) {
  const [ranking, stats, distribution, failing] = await Promise.all([
    request("/api/ranking"),
    request("/api/stats"),
    request("/api/distribution"),
    request("/api/failing")
  ]);

  if (students) {
    renderStudents(students);
  } else {
    renderStudents(await request("/api/students"));
  }
  renderRanking(ranking);
  renderStats(stats);
  renderDistribution(distribution);
  renderFailing(failing);
}

async function loadAll() {
  try {
    await refreshDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
}

document.getElementById("add-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    await request("/api/students", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    event.target.reset();
    showToast("学生添加成功");
    await loadAll();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("update-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());

  try {
    await request(`/api/students/${encodeURIComponent(payload.id)}`, {
      method: "PUT",
      body: JSON.stringify({
        field: payload.field,
        value: payload.value
      })
    });
    event.target.reset();
    showToast("学生信息已更新");
    await loadAll();
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("search-btn").addEventListener("click", async () => {
  const type = document.getElementById("search-type").value;
  const keyword = document.getElementById("search-keyword").value.trim();

  if (!keyword) {
    showToast("请输入查询内容", true);
    return;
  }

  try {
    const students = await request(`/api/students/search?type=${type}&keyword=${encodeURIComponent(keyword)}`);
    renderStudents(students);
    showToast(`查询到 ${students.length} 条记录`);
  } catch (error) {
    showToast(error.message, true);
  }
});

document.getElementById("reload-btn").addEventListener("click", () => {
  document.getElementById("search-keyword").value = "";
  loadAll();
});

studentTable.addEventListener("click", async (event) => {
  if (!event.target.matches("button[data-id]")) {
    return;
  }

  const id = event.target.dataset.id;
  const confirmed = window.confirm(`确认删除学号为 ${id} 的学生吗？`);
  if (!confirmed) return;

  try {
    await request(`/api/students/${encodeURIComponent(id)}`, { method: "DELETE" });
    showToast("学生记录已删除");
    await loadAll();
  } catch (error) {
    showToast(error.message, true);
  }
});

loadAll();
