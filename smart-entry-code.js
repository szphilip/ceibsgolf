// ═══════════════════════════════════════════════════════════════
//  智能赛事录入系统 - 核心代码
// ═══════════════════════════════════════════════════════════════

// 全局变量存储当前录入的数据
let currentEntryData = {
  course: '',
  date: '',
  pars: [5,4,3,4,5,4,4,3,4,5,4,4,4,3,4,4,3,5],
  players: []
};

// 切换输入标签页
function switchInputTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById('input-tab-' + tab).classList.add('active');
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// 处理Excel文件上传
async function handleSmartExcel(file) {
  if (!file) return;
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    // 提取球员和成绩
    const players = [];
    data.forEach(row => {
      const name = row['姓名'] || row['球员'] || row['name'];
      const grossScore = parseInt(row['总杆'] || row['成绩'] || row['总成绩'] || row['gross']);
      
      if (name && grossScore && grossScore > 0) {
        // 尝试提取各洞成绩
        const holes = [];
        for (let i = 1; i <= 18; i++) {
          const holeScore = row[`洞${i}`] || row[`${i}`] || row[`H${i}`];
          if (holeScore) holes.push(parseInt(holeScore));
        }
        
        players.push({
          name: name,
          grossScore: grossScore,
          holes: holes.length === 18 ? holes : null
        });
      }
    });
    
    if (players.length === 0) {
      showToast('❌ 未能识别到有效数据，请检查Excel格式');
      return;
    }
    
    currentEntryData.players = players;
    displaySmartScoresTable();
    showToast(`✅ 成功识别 ${players.length} 名球员`);
    
  } catch (error) {
    console.error('Excel解析错误:', error);
    showToast('❌ Excel文件解析失败，请检查格式');
  }
}

// 显示成绩数据表格
function displaySmartScoresTable() {
  const card = document.getElementById('se-scores-card');
  const tbody = document.getElementById('se-scores-tbody');
  const badge = document.getElementById('se-player-count');
  
  if (currentEntryData.players.length === 0) {
    card.style.display = 'none';
    return;
  }
  
  card.style.display = 'block';
  badge.textContent = `${currentEntryData.players.length}人`;
  
  // 按总杆排序
  const sorted = [...currentEntryData.players].sort((a,b) => a.grossScore - b.grossScore);
  
  tbody.innerHTML = sorted.map((p, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><input class="form-input" value="${p.name}" onchange="updatePlayerName(${index}, this.value)" style="min-width:80px"></td>
      <td><input class="form-input" type="number" value="${p.grossScore}" onchange="updatePlayerScore(${index}, this.value)" style="width:80px"></td>
      <td style="font-size:11px;color:var(--ink-muted)">${p.holes ? '已有详细成绩' : '仅总杆'}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="removePlayer(${index})">删除</button></td>
    </tr>
  `).join('');
}

// 更新球员姓名
function updatePlayerName(index, name) {
  const sorted = [...currentEntryData.players].sort((a,b) => a.grossScore - b.grossScore);
  const player = sorted[index];
  const originalIndex = currentEntryData.players.indexOf(player);
  currentEntryData.players[originalIndex].name = name;
}

// 更新球员成绩
function updatePlayerScore(index, score) {
  const sorted = [...currentEntryData.players].sort((a,b) => a.grossScore - b.grossScore);
  const player = sorted[index];
  const originalIndex = currentEntryData.players.indexOf(player);
  currentEntryData.players[originalIndex].grossScore = parseInt(score);
  displaySmartScoresTable();
}

// 移除球员
function removePlayer(index) {
  const sorted = [...currentEntryData.players].sort((a,b) => a.grossScore - b.grossScore);
  const player = sorted[index];
  const originalIndex = currentEntryData.players.indexOf(player);
  currentEntryData.players.splice(originalIndex, 1);
  displaySmartScoresTable();
}

// 添加手动球员
function addManualPlayer() {
  const listDiv = document.getElementById('manual-players-list');
  const index = currentEntryData.players.length;
  
  const playerDiv = document.createElement('div');
  playerDiv.className = 'form-grid';
  playerDiv.style.marginBottom = '12px';
  playerDiv.innerHTML = `
    <div class="form-group">
      <input class="form-input" id="manual-name-${index}" placeholder="球员姓名">
    </div>
    <div class="form-group">
      <input class="form-input" type="number" id="manual-score-${index}" placeholder="总杆数">
    </div>
    <div class="form-group">
      <button class="btn btn-ghost btn-sm" onclick="saveManualPlayer(${index})">添加</button>
    </div>
  `;
  
  listDiv.appendChild(playerDiv);
}

// 保存手动添加的球员
function saveManualPlayer(index) {
  const name = document.getElementById(`manual-name-${index}`).value;
  const score = parseInt(document.getElementById(`manual-score-${index}`).value);
  
  if (!name || !score) {
    showToast('❌ 请填写姓名和总杆数');
    return;
  }
  
  currentEntryData.players.push({
    name: name,
    grossScore: score,
    holes: null
  });
  
  displaySmartScoresTable();
  document.getElementById(`manual-name-${index}`).value = '';
  document.getElementById(`manual-score-${index}`).value = '';
  showToast('✅ 已添加球员');
}

// 清空录入
function clearSmartEntry() {
  if (!confirm('确定要清空当前数据？')) return;
  
  currentEntryData.players = [];
  document.getElementById('se-course').value = '';
  document.getElementById('se-date').value = '';
  document.getElementById('se-scores-card').style.display = 'none';
  document.getElementById('se-results-section').style.display = 'none';
  showToast('已清空');
}

// 计算奖罚并保存
function calculateAndSave() {
  // 获取赛事信息
  const course = document.getElementById('se-course').value.trim();
  const date = document.getElementById('se-date').value;
  const parsInput = document.getElementById('se-pars').value;
  
  if (!course || !date) {
    showToast('❌ 请填写球场名称和比赛日期');
    return;
  }
  
  if (currentEntryData.players.length === 0) {
    showToast('❌ 请先上传成绩单或手动添加球员');
    return;
  }
  
  // 解析标准杆
  const pars = parsInput.split(',').map(p => parseInt(p.trim()));
  if (pars.length !== 18) {
    showToast('❌ 标准杆配置必须是18个数字');
    return;
  }
  
  currentEntryData.course = course;
  currentEntryData.date = date;
  currentEntryData.pars = pars;
  
  // 计算每个球员的奖罚
  const processedPlayers = currentEntryData.players.map(player => {
    const result = calculatePlayerRewards(player, pars);
    return {
      ...player,
      ...result
    };
  });
  
  // 按总杆排序
  processedPlayers.sort((a,b) => a.grossScore - b.grossScore);
  
  // 显示结果
  displayResults(processedPlayers);
}

// 计算单个球员的奖罚
function calculatePlayerRewards(player, pars) {
  let rewards = 0;
  let penalties = 0;
  let birdies = 0, eagles = 0, holeInOnes = 0;
  let tripleBogeys = 0, doublePars = 0;
  
  // 如果有各洞成绩，才计算详细奖罚
  if (player.holes && player.holes.length === 18) {
    player.holes.forEach((score, index) => {
      const par = pars[index];
      const diff = score - par;
      
      // 奖励计算
      if (par === 3 && score === 1) {
        holeInOnes++;
        rewards += 5000;
      } else if (diff === -2) {
        eagles++;
        rewards += 1000;
      } else if (diff === -1) {
        birdies++;
        rewards += 100;
      }
      
      // 罚款计算
      if (player.grossScore < 95) {
        // 加三罚款
        if (score >= par + 3) {
          tripleBogeys++;
          penalties += 100;
        }
      } else {
        // 双倍Par罚款（上限500）
        if (score >= par * 2) {
          doublePars++;
          penalties = Math.min(penalties + 100, 500);
        }
      }
    });
  }
  
  return {
    birdies,
    eagles,
    holeInOnes,
    tripleBogeys,
    doublePars,
    reward: rewards,
    penalty: penalties,
    net: rewards - penalties
  };
}

// 显示计算结果
function displayResults(players) {
  const resultsSection = document.getElementById('se-results-section');
  const leaderboardDiv = document.getElementById('se-leaderboard');
  const financialTbody = document.getElementById('se-financial-tbody');
  
  // 生成排行榜
  leaderboardDiv.innerHTML = `
    <div style="background:linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);border-radius:12px;padding:24px">
      <h3 style="font-size:20px;color:var(--green);margin:0 0 8px 0">${currentEntryData.course}例赛</h3>
      <div style="font-size:13px;color:var(--ink-muted);margin-bottom:20px">
        📅 日期：${currentEntryData.date} | 👤 参赛人数：${players.length}人
      </div>
      <ol style="list-style:none;padding:0;margin:0">
        ${players.map((p, i) => `
          <li style="display:flex;align-items:center;gap:12px;padding:12px;background:${i===0?'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)':'white'};color:${i===0?'white':'inherit'};margin-bottom:8px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.05);font-weight:${i<3?'600':'400'}">
            <span style="min-width:30px;text-align:center;font-size:18px">${i+1}</span>
            <span style="flex:1">${p.name}</span>
            <span style="font-size:16px;font-weight:700">${p.grossScore}杆</span>
            ${i===0 ? '<span style="font-size:20px">🏆</span>' : ''}
            ${i===1 ? '<span style="font-size:18px">🥈</span>' : ''}
            ${i===2 ? '<span style="font-size:18px">🥉</span>' : ''}
          </li>
        `).join('')}
      </ol>
    </div>
  `;
  
  // 生成财务表
  financialTbody.innerHTML = players.map((p, i) => {
    const rewardDetails = [];
    if (p.holeInOnes > 0) rewardDetails.push(`${p.holeInOnes}个一杆进洞`);
    if (p.eagles > 0) rewardDetails.push(`${p.eagles}个老鹰`);
    if (p.birdies > 0) rewardDetails.push(`${p.birdies}个小鸟`);
    
    const penaltyDetails = [];
    if (p.tripleBogeys > 0) penaltyDetails.push(`${p.tripleBogeys}个加三`);
    if (p.doublePars > 0) penaltyDetails.push(`${p.doublePars}个DoublePar`);
    
    return `
      <tr>
        <td>${i+1}</td>
        <td>${p.name}</td>
        <td>${p.grossScore}</td>
        <td>${rewardDetails.join('、') || '无'}</td>
        <td style="color:#22c55e;font-weight:600">¥${p.reward}</td>
        <td>${penaltyDetails.join('、') || '无'}</td>
        <td style="color:#ef4444;font-weight:600">¥${p.penalty}</td>
        <td style="color:${p.net >= 0 ? '#22c55e' : '#ef4444'};font-weight:700">
          ${p.net >= 0 ? '+' : ''}¥${p.net}
        </td>
      </tr>
    `;
  }).join('');
  
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({behavior:'smooth'});
  
  showToast('✅ 计算完成！');
}

// 确认保存到赛事记录
function confirmSaveMatch() {
  if (!confirm('确认保存到赛事记录？保存后可在"赛事记录"页面查看。')) return;
  
  // 构建match对象
  const matchId = parseInt(currentEntryData.date.replace(/-/g, ''));
  const match = {
    id: matchId,
    name: `${currentEntryData.course}例赛`,
    date: currentEntryData.date,
    course: currentEntryData.course,
    type: 'regular',
    published: true,
    scores: currentEntryData.players.map((p, index) => ({
      id: index + 1,
      playerId: '',
      playerName: p.name,
      grossScore: p.grossScore,
      handicap: 0,
      netScore: p.grossScore,
      birdies: p.birdies || 0,
      eagles: p.eagles || 0,
      holeInOnes: p.holeInOnes || 0,
      tripleBogeys: p.tripleBogeys || 0,
      doublePars: p.doublePars || 0,
      reward: p.reward || 0,
      penalty: p.penalty || 0,
      net: p.net || 0,
      penalties: {
        absence: false,
        cancelLate: false,
        noUniform: false,
        withdrawal: false,
        noBetting: false
      }
    }))
  };
  
  // 检查是否已存在
  const existingIndex = STORE.matches.findIndex(m => m.id === matchId);
  if (existingIndex >= 0) {
    if (!confirm('该日期的赛事已存在，是否覆盖？')) return;
    STORE.matches[existingIndex] = match;
  } else {
    STORE.matches.push(match);
  }
  
  // 保存
  saveStore();
  renderPublicMatches();
  
  showToast('✅ 已保存到赛事记录！');
  
  // 询问是否清空重新开始
  setTimeout(() => {
    if (confirm('是否清空数据，录入下一场赛事？')) {
      clearSmartEntry();
    }
  }, 1000);
}
