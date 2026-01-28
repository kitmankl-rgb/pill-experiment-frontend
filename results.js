// 結果頁面邏輯
document.addEventListener('DOMContentLoaded', function() {
    const responsesList = document.getElementById('responses-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort-by');
    const refreshBtn = document.getElementById('refresh-results');
    const loader = document.getElementById('loader');
    
    // 使用您的 Vercel 后端地址
    const API_BASE_URL = 'https://pill-experiment-backend.vercel.app/api';
    
    let allResponses = [];
    let filteredResponses = [];
    let currentFilter = 'all';
    
    // 初始化圖表
    let resultsChart = null;
    
    // 加載數據
    function loadData() {
        // 顯示加載動畫
        loader.style.display = 'flex';
        
        // 從後端API獲取數據
        fetch(`${API_BASE_URL}/votes`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP錯誤 ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // 使用後端數據
                allResponses = data.votes;
                
                // 更新統計顯示
                updateStatsFromData(data);
                
                // 初始化過濾
                filterResponses(currentFilter);
                
                // 隱藏加載動畫
                loader.style.display = 'none';
            } else {
                throw new Error(data.error || '數據獲取失敗');
            }
        })
        .catch(error => {
            console.error('API錯誤:', error);
            
            // 降級方案：使用本地存儲
            console.log('使用本地存儲數據');
            const votes = JSON.parse(localStorage.getItem('pill_experiment_votes') || '[]');
            
            if (votes.length === 0) {
                // 如果沒有數據，使用模擬數據
                allResponses = generateMockData();
            } else {
                allResponses = votes;
            }
            
            // 更新統計顯示
            updateStatsFromLocalData();
            
            // 初始化過濾
            filterResponses(currentFilter);
            
            // 隱藏加載動畫
            loader.style.display = 'none';
        });
    }
    
    // 生成模擬數據（用於演示）
    function generateMockData() {
        const mockResponses = [];
        const mockReasonsBlue = [
            "我相信大多數人會選擇合作，這樣大家都能生存。",
            "這是一個信任測試，我願意相信人性本善。",
            "選擇藍色是為了共同利益，即使有風險也值得。",
            "如果每個人都只考慮自己，社會就無法進步。",
            "我願意冒險，因為我相信集體智慧。"
        ];
        
        const mockReasonsRed = [
            "我不相信陌生人會為他人著想，所以選擇保護自己。",
            "這是一個囚徒困境，最安全的選擇是紅色。",
            "歷史上太多例子證明人們在壓力下會選擇自保。",
            "我不想把命運交給別人決定。",
            "理性分析顯示選擇紅色是優勢策略。"
        ];
        
        // 生成一些藍色藥丸選擇
        for (let i = 0; i < 12; i++) {
            mockResponses.push({
                userId: `user_${i}_blue`,
                nickname: `參與者${i+1}`,
                option: 'blue',
                reason: mockReasonsBlue[Math.floor(Math.random() * mockReasonsBlue.length)],
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        // 生成一些紅色藥丸選擇
        for (let i = 12; i < 25; i++) {
            mockResponses.push({
                userId: `user_${i}_red`,
                nickname: `參與者${i+1}`,
                option: 'red',
                reason: mockReasonsRed[Math.floor(Math.random() * mockReasonsRed.length)],
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        return mockResponses;
    }
    
    // 更新統計數據（從後端數據）
    function updateStatsFromData(data) {
        const blueCount = data.counts?.blue || data.blue || 0;
        const redCount = data.counts?.red || data.red || 0;
        const totalCount = data.counts?.total || data.total || 0;
        
        const bluePercent = data.bluePercent || (totalCount > 0 ? Math.round((blueCount / totalCount) * 100) : 0);
        const redPercent = data.redPercent || (totalCount > 0 ? Math.round((redCount / totalCount) * 100) : 0);
        
        // 更新統計顯示
        document.getElementById('summary-blue-count').textContent = `${blueCount} 票`;
        document.getElementById('summary-blue-percent').textContent = `${bluePercent}%`;
        document.getElementById('summary-red-count').textContent = `${redCount} 票`;
        document.getElementById('summary-red-percent').textContent = `${redPercent}%`;
        document.getElementById('summary-total-count').textContent = `${totalCount} 人`;
        
        // 更新結果預測
        const outcomeText = document.getElementById('outcome-text');
        if (bluePercent > 50) {
            outcomeText.innerHTML = '<span class="outcome-success"><i class="fas fa-check-circle"></i> 藍色藥丸超過50%，所有人都能生存！</span>';
        } else {
            outcomeText.innerHTML = '<span class="outcome-danger"><i class="fas fa-exclamation-circle"></i> 藍色藥丸未超過50%，只有選擇紅色藥丸的人生存。</span>';
        }
        
        // 更新圖表
        updateChart(blueCount, redCount);
    }
    
    // 更新統計數據（從本地數據）
    function updateStatsFromLocalData() {
        const blueCount = allResponses.filter(r => r.option === 'blue').length;
        const redCount = allResponses.filter(r => r.option === 'red').length;
        const totalCount = allResponses.length;
        
        updateStatsFromData({
            blue: blueCount,
            red: redCount,
            total: totalCount,
            bluePercent: totalCount > 0 ? Math.round((blueCount / totalCount) * 100) : 0,
            redPercent: totalCount > 0 ? Math.round((redCount / totalCount) * 100) : 0
        });
    }
    
    // 更新圖表
    function updateChart(blueCount, redCount) {
        const ctx = document.getElementById('results-chart').getContext('2d');
        
        // 如果圖表已存在，銷毀它
        if (resultsChart) {
            resultsChart.destroy();
        }
        
        resultsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['藍色藥丸', '紅色藥丸'],
                datasets: [{
                    data: [blueCount, redCount],
                    backgroundColor: ['#3498db', '#e74c3c'],
                    borderColor: ['#2980b9', '#c0392b'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 14
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value}票 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // 過濾回應
    function filterResponses(filter) {
        currentFilter = filter;
        
        if (filter === 'all') {
            filteredResponses = [...allResponses];
        } else {
            filteredResponses = allResponses.filter(r => r.option === filter);
        }
        
        // 排序
        sortResponses(sortSelect.value);
        
        // 更新按鈕狀態
        filterButtons.forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 渲染回應列表
        renderResponses();
    }
    
    // 排序回應
    function sortResponses(sortBy) {
        filteredResponses.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.timestamp) - new Date(a.timestamp);
            } else {
                return new Date(a.timestamp) - new Date(b.timestamp);
            }
        });
    }
    
    // 渲染回應列表
    function renderResponses() {
        if (filteredResponses.length === 0) {
            responsesList.innerHTML = `
                <div class="no-responses">
                    <i class="fas fa-inbox"></i>
                    <p>沒有找到符合條件的回應</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        filteredResponses.forEach(response => {
            const optionText = response.option === 'blue' ? '藍色藥丸' : '紅色藥丸';
            const optionClass = response.option === 'blue' ? 'blue-response' : 'red-response';
            const optionIcon = response.option === 'blue' ? 'fa-capsules blue-icon' : 'fa-capsules red-icon';
            const date = new Date(response.timestamp);
            const formattedDate = `${date.getFullYear()}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            html += `
                <div class="response-card ${optionClass}">
                    <div class="response-header">
                        <div class="response-user">
                            <i class="fas fa-user-circle"></i>
                            <span class="response-nickname">${response.nickname}</span>
                        </div>
                        <div class="response-meta">
                            <span class="response-option">
                                <i class="fas ${optionIcon}"></i> ${optionText}
                            </span>
                            <span class="response-date">
                                <i class="far fa-clock"></i> ${formattedDate}
                            </span>
                        </div>
                    </div>
                    <div class="response-reason">
                        <p>${response.reason}</p>
                    </div>
                </div>
            `;
        });
        
        responsesList.innerHTML = html;
    }
    
    // 事件監聽器
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterResponses(this.dataset.filter);
        });
    });
    
    sortSelect.addEventListener('change', function() {
        sortResponses(this.value);
        renderResponses();
    });
    
    refreshBtn.addEventListener('click', function() {
        loadData();
    });
    
    // 初始化
    loadData();
});