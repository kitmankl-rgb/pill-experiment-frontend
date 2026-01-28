// 前端邏輯代碼
document.addEventListener('DOMContentLoaded', function() {
    // 檢查當前頁面
    if (window.location.pathname.includes('result.html')) {
        // 結果頁面的邏輯在 results.js 中
        return;
    }
    
    // 首頁邏輯
    const blueOptionBtn = document.querySelector('.blue-option .select-btn');
    const redOptionBtn = document.querySelector('.red-option .select-btn');
    const reasonModal = document.getElementById('reason-modal');
    const selectedOptionText = document.getElementById('selected-option-text');
    const userNicknameElement = document.getElementById('user-nickname');
    const reasonTextarea = document.getElementById('reason');
    const charCountElement = document.getElementById('char-count');
    const submitReasonBtn = document.getElementById('submit-reason');
    const cancelReasonBtn = document.getElementById('cancel-reason');
    const loader = document.getElementById('loader');
    
    // 使用您的 Vercel 后端地址
    const API_BASE_URL = 'https://pill-experiment-backend.vercel.app/api';
    
    // 生成隨機暱稱
    const adjectives = ['勇敢', '深思', '謹慎', '樂觀', '悲觀', '理性', '感性', '好奇', '果斷', '猶豫'];
    const nouns = ['探險家', '思想家', '觀察者', '決策者', '夢想家', '現實主義者', '理想主義者', '哲學家', '科學家', '藝術家'];
    
    function generateRandomNickname() {
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNumber = Math.floor(Math.random() * 1000);
        return `${randomAdjective}的${randomNoun}${randomNumber}`;
    }
    
    // 獲取或創建用戶ID
    function getOrCreateUserId() {
        let userId = localStorage.getItem('pill_experiment_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            localStorage.setItem('pill_experiment_user_id', userId);
        }
        return userId;
    }
    
    // 獲取或創建用戶暱稱
    function getOrCreateUserNickname() {
        let nickname = localStorage.getItem('pill_experiment_nickname');
        if (!nickname) {
            nickname = generateRandomNickname();
            localStorage.setItem('pill_experiment_nickname', nickname);
        }
        return nickname;
    }
    
    // 更新統計數據顯示
    function updateStatsDisplay() {
        // 從後端獲取實際數據
        fetch(`${API_BASE_URL}/stats`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const bluePercent = data.total > 0 ? Math.round((data.blue / data.total) * 100) : 0;
                    const redPercent = data.total > 0 ? Math.round((data.red / data.total) * 100) : 0;
                    
                    document.getElementById('blue-stat-bar').style.width = `${bluePercent}%`;
                    document.getElementById('blue-stat-bar').textContent = `${bluePercent}%`;
                    document.getElementById('blue-count').textContent = `${data.blue} 票`;
                    
                    document.getElementById('red-stat-bar').style.width = `${redPercent}%`;
                    document.getElementById('red-stat-bar').textContent = `${redPercent}%`;
                    document.getElementById('red-count').textContent = `${data.red} 票`;
                    
                    document.getElementById('total-votes').textContent = data.total;
                }
            })
            .catch(error => {
                console.error('獲取統計數據失敗:', error);
                // 使用默認值
                document.getElementById('blue-stat-bar').style.width = `0%`;
                document.getElementById('blue-stat-bar').textContent = `0%`;
                document.getElementById('blue-count').textContent = `0 票`;
                
                document.getElementById('red-stat-bar').style.width = `0%`;
                document.getElementById('red-stat-bar').textContent = `0%`;
                document.getElementById('red-count').textContent = `0 票`;
                
                document.getElementById('total-votes').textContent = 0;
            });
    }
    
    // 初始化
    const userNickname = getOrCreateUserNickname();
    userNicknameElement.textContent = userNickname;
    updateStatsDisplay();
    
    // 選擇藥丸事件
    function selectPill(option) {
        selectedOptionText.textContent = option === 'blue' ? '藍色藥丸' : '紅色藥丸';
        selectedOptionText.style.color = option === 'blue' ? '#3498db' : '#e74c3c';
        
        // 檢查是否已投票
        if (localStorage.getItem('pill_experiment_voted')) {
            if (confirm('您已經投過票了。要查看結果嗎？')) {
                window.location.href = 'result.html';
            }
            return;
        }
        
        reasonModal.style.display = 'flex';
    }
    
    blueOptionBtn.addEventListener('click', () => selectPill('blue'));
    redOptionBtn.addEventListener('click', () => selectPill('red'));
    
    // 字數統計
    reasonTextarea.addEventListener('input', function() {
        const length = this.value.length;
        charCountElement.textContent = length;
        
        if (length < 10) {
            charCountElement.style.color = '#e74c3c';
        } else {
            charCountElement.style.color = '#2ecc71';
        }
    });
    
    // 提交理由
    submitReasonBtn.addEventListener('click', function() {
        const reason = reasonTextarea.value.trim();
        const selectedOption = selectedOptionText.textContent === '藍色藥丸' ? 'blue' : 'red';
        
        if (reason.length < 10) {
            alert('請輸入至少10個字的理由');
            return;
        }
        
        // 顯示加載動畫
        loader.style.display = 'flex';
        
        // 獲取用戶信息
        const userId = getOrCreateUserId();
        const nickname = getOrCreateUserNickname();
        
        // 構建投票數據
        const voteData = {
            userId: userId,
            nickname: nickname,
            option: selectedOption,
            reason: reason
        };
        
        // 發送到後端API
        fetch(`${API_BASE_URL}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(voteData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP錯誤 ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // 標記用戶已投票
                localStorage.setItem('pill_experiment_voted', 'true');
                
                // 隱藏加載動畫和彈窗
                loader.style.display = 'none';
                reasonModal.style.display = 'none';
                
                // 跳轉到結果頁面
                window.location.href = 'result.html';
            } else {
                throw new Error(data.error || '提交失敗');
            }
        })
        .catch(error => {
            console.error('提交錯誤:', error);
            
            // 降級方案：使用本地存儲
            alert('無法連接到伺服器，使用本地存儲模式');
            
            // 保存到本地存儲
            voteData.timestamp = new Date().toISOString();
            voteData.id = Date.now().toString();
            
            let votes = JSON.parse(localStorage.getItem('pill_experiment_votes') || '[]');
            votes.push(voteData);
            localStorage.setItem('pill_experiment_votes', JSON.stringify(votes));
            
            // 標記用戶已投票
            localStorage.setItem('pill_experiment_voted', 'true');
            
            // 隱藏加載動畫和彈窗
            loader.style.display = 'none';
            reasonModal.style.display = 'none';
            
            // 跳轉到結果頁面
            window.location.href = 'result.html';
        });
    });
    
    // 取消理由填寫
    cancelReasonBtn.addEventListener('click', function() {
        reasonModal.style.display = 'none';
        reasonTextarea.value = '';
        charCountElement.textContent = '0';
        charCountElement.style.color = '#7f8c8d';
    });
    
    // 點擊彈窗外關閉彈窗
    reasonModal.addEventListener('click', function(e) {
        if (e.target === reasonModal) {
            reasonModal.style.display = 'none';
            reasonTextarea.value = '';
            charCountElement.textContent = '0';
            charCountElement.style.color = '#7f8c8d';
        }
    });
});