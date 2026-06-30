const STORAGE_KEY = "student-score-system-data";
const DEFAULT_STUDENTS = [
  { id: "2023001", name: "Alice", math: 92, english: 88, cLanguage: 95 },
  { id: "2023002", name: "Bob", math: 76, english: 81, cLanguage: 68 },
  { id: "2023003", name: "Charlie", math: 59, english: 73, cLanguage: 62 },
  { id: "2023004", name: "Q", math: 97, english: 62, cLanguage: 57 },
  { id: "2023005", name: "StudentA", math: 68, english: 68, cLanguage: 85 }
];

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

function cloneStudents(students) {
  return students.map((student) => ({ ...student }));
}

function getStudents() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = cloneStudents(DEFAULT_STUDENTS);
    saveStudents(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : cloneStudents(DEFAULT_STUDENTS);
  } catch {
    return cloneStudents(DEFAULT_STUDENTS);
  }
}

function saveStudents(students) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function parseScore(value) {
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
}

function totalScore(student) {
  return student.math + student.english + student.cLanguage;
}

function subjectGpa(score) {
  if (score >= 90) return 4.0;
  if (score >= 85) return 3.7;
  if (score >= 82) return 3.3;
  if (score >= 78) return 3.0;
  if (score >= 75) return 2.7;
  if (score >= 72) return 2.3;
  if (score >= 68) return 2.0;
  if (score >= 64) return 1.5;
  if (score >= 60) return 1.0;
  return 0.0;
}

function averageGpa(student) {
  return (subjectGpa(student.math) + subjectGpa(student.english) + subjectGpa(student.cLanguage)) / 3;
}

function buildViewStudent(student) {
  return {
    ...student,
    total: totalScore(student),
    gpa: averageGpa(student)
  };
}

function renderStudents(students) {
  if (!students.length) {
    studentTable.innerHTML = '<tr><td colspan="8" class="empty">当前没有学生数据</td></tr>';
    return;
  }

  studentTable.innerHTML = students.map((student) => {
    const view = buildViewStudent(student);
    return `
      <tr>
        <td>${view.id}</td>
        <td>${view.name}</td>
        <td>${view.math.toFixed(2)}</td>
        <td>${view.english.toFixed(2)}</td>
        <td>${view.cLanguage.toFixed(2)}</td>
        <td>${view.total.toFixed(2)}</td>
        <td>${view.gpa.toFixed(2)}</td>
        <td><button class="danger" data-id="${view.id}">删除</button></td>
      </tr>
    `;
  }).join("");
}

function compareStudents(left, right) {
  const totalDiff = totalScore(right) - totalScore(left);
  if (totalDiff !== 0) return totalDiff;
  const mathDiff = right.math - left.math;
  if (mathDiff !== 0) return mathDiff;
  return left.id.localeCompare(right.id, "zh-CN");
}

function renderRanking(students) {
  const ranking = cloneStudents(students).sort(compareStudents);

  if (!ranking.length) {
    rankingTable.innerHTML = '<tr><td colspan="5" class="empty">暂无排名数据</td></tr>';
    return;
  }

  rankingTable.innerHTML = ranking.map((student, index) => {
    const view = buildViewStudent(student);
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${view.id}</td>
        <td>${view.name}</td>
        <td>${view.total.toFixed(2)}</td>
        <td>${view.gpa.toFixed(2)}</td>
      </tr>
    `;
  }).join("");
}

function computeSubjectStats(students, field) {
  if (!students.length) {
    return { average: 0, highest: 0, lowest: 0, passRate: 0, excellentRate: 0 };
  }

  const scores = students.map((student) => student[field]);
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const passCount = scores.filter((score) => score >= 60).length;
  const excellentCount = scores.filter((score) => score >= 90).length;

  return {
    average: sum / scores.length,
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
    passRate: (passCount * 100) / scores.length,
    excellentRate: (excellentCount * 100) / scores.length
  };
}

function renderStats(students) {
  const items = [
    ["高数", computeSubjectStats(students, "math")],
    ["英语", computeSubjectStats(students, "english")],
    ["C语言", computeSubjectStats(students, "cLanguage")]
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

function renderDistribution(students) {
  const buckets = [
    { label: "90-100", count: 0 },
    { label: "80-89", count: 0 },
    { label: "70-79", count: 0 },
    { label: "60-69", count: 0 },
    { label: "0-59", count: 0 }
  ];

  students.forEach((student) => {
    const average = totalScore(student) / 3;
    if (average >= 90) buckets[0].count += 1;
    else if (average >= 80) buckets[1].count += 1;
    else if (average >= 70) buckets[2].count += 1;
    else if (average >= 60) buckets[3].count += 1;
    else buckets[4].count += 1;
  });

  distributionGrid.innerHTML = buckets.map((item) => `
    <div class="distribution-card">
      <h3>${item.label}</h3>
      <p>人数：${item.count}</p>
    </div>
  `).join("");
}

function renderFailing(students) {
  const failingStudents = students
    .map((student) => {
      const failedSubjects = [];
      if (student.math < 60) failedSubjects.push("高数");
      if (student.english < 60) failedSubjects.push("英语");
      if (student.cLanguage < 60) failedSubjects.push("C语言");
      return { ...student, failedSubjects };
    })
    .filter((student) => student.failedSubjects.length > 0);

  if (!failingStudents.length) {
    failingList.innerHTML = '<div class="empty">当前没有不及格学生</div>';
    return;
  }

  failingList.innerHTML = failingStudents.map((student) => `
    <div class="fail-card">
      <h3>${student.name} <small>(${student.id})</small></h3>
      <p>不及格科目：${student.failedSubjects.join("、")}</p>
    </div>
  `).join("");
}

function refreshDashboard(displayStudents = null) {
  const students = getStudents();
  renderStudents(displayStudents || students);
  renderRanking(students);
  renderStats(students);
  renderDistribution(students);
  renderFailing(students);
}

function findStudentIndexById(students, id) {
  return students.findIndex((student) => student.id === id);
}

document.getElementById("add-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());
  const students = getStudents();

  if (findStudentIndexById(students, payload.id) !== -1) {
    showToast("学号已存在", true);
    return;
  }

  const math = parseScore(payload.math);
  const english = parseScore(payload.english);
  const cLanguage = parseScore(payload.cLanguage);
  if (math === null || english === null || cLanguage === null) {
    showToast("成绩必须是 0 到 100 的数字", true);
    return;
  }

  students.push({
    id: payload.id.trim(),
    name: payload.name.trim(),
    math,
    english,
    cLanguage
  });
  saveStudents(students);
  event.target.reset();
  showToast("学生添加成功");
  refreshDashboard();
});

document.getElementById("update-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = Object.fromEntries(formData.entries());
  const students = getStudents();
  const index = findStudentIndexById(students, payload.id);

  if (index === -1) {
    showToast("未找到对应学号", true);
    return;
  }

  if (payload.field === "id") {
    if (payload.value !== payload.id && findStudentIndexById(students, payload.value) !== -1) {
      showToast("新的学号已存在", true);
      return;
    }
    students[index].id = payload.value.trim();
  } else if (payload.field === "name") {
    students[index].name = payload.value.trim();
  } else {
    const score = parseScore(payload.value);
    if (score === null) {
      showToast("成绩必须是 0 到 100 的数字", true);
      return;
    }
    students[index][payload.field] = score;
  }

  saveStudents(students);
  event.target.reset();
  showToast("学生信息已更新");
  refreshDashboard();
});

document.getElementById("search-btn").addEventListener("click", () => {
  const type = document.getElementById("search-type").value;
  const keyword = document.getElementById("search-keyword").value.trim();
  const students = getStudents();

  if (!keyword) {
    showToast("请输入查询内容", true);
    return;
  }

  const matched = students.filter((student) => {
    if (type === "id") return student.id === keyword;
    return student.name.includes(keyword);
  });

  renderStudents(matched);
  showToast(`查询到 ${matched.length} 条记录`);
});

document.getElementById("reload-btn").addEventListener("click", () => {
  document.getElementById("search-keyword").value = "";
  refreshDashboard();
});

document.getElementById("reset-seed-btn").addEventListener("click", () => {
  const confirmed = window.confirm("确认恢复示例数据吗？这会覆盖当前浏览器中的学生记录。");
  if (!confirmed) return;
  saveStudents(cloneStudents(DEFAULT_STUDENTS));
  showToast("示例数据已恢复");
  refreshDashboard();
});

document.getElementById("export-btn").addEventListener("click", () => {
  const students = getStudents();
  const blob = new Blob([JSON.stringify(students, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "students-export.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("数据已导出");
});

studentTable.addEventListener("click", (event) => {
  if (!event.target.matches("button[data-id]")) return;

  const id = event.target.dataset.id;
  const confirmed = window.confirm(`确认删除学号为 ${id} 的学生吗？`);
  if (!confirmed) return;

  const students = getStudents().filter((student) => student.id !== id);
  saveStudents(students);
  showToast("学生记录已删除");
  refreshDashboard();
});

refreshDashboard();
