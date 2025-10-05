class BotDashboard {
    constructor() {
        this.socket = io();
        this.initializeSocket();
    }

    initializeSocket() {
        this.socket.on('initialData', (data) => {
            this.updateStats(data.stats);
            this.updateUsersList(data.users);
        });

        this.socket.on('userUpdate', (data) => {
            this.updateStats(data.stats);
            this.updateUsersList(data.users);
        });

        this.socket.on('newMessage', (message) => {
            this.addLiveMessage(message);
        });

        this.socket.on('reconnect', () => {
            this.showNotification('تم إعادة الاتصال بالخادم', 'success');
        });
    }

    updateStats(stats) {
        document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('totalMessages').textContent = stats.totalMessages.toLocaleString();
        document.getElementById('uptime').textContent = stats.uptime;
        document.getElementById('activeUsers').textContent = stats.activeUsers.toLocaleString();
    }

    updateUsersList(users) {
        const usersList = document.getElementById('usersList');
        
        if (users.length === 0) {
            usersList.innerHTML = '<div class="user-card"><div class="user-info"><p>لا يوجد مستخدمين نشطين</p></div></div>';
            return;
        }

        usersList.innerHTML = users.map(user => `
            <div class="user-card">
                <div class="user-info">
                    <h3>👤 ${user.name}</h3>
                    <div class="user-meta">
                        <div>🆔 ${user.id}</div>
                        <div>📅 انضم: ${new Date(user.joinDate).toLocaleDateString('ar-EG')}</div>
                        <div>💬 ${user.messageCount} رسالة</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    addLiveMessage(message) {
        const messagesList = document.getElementById('liveMessages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message-card';
        messageElement.innerHTML = `
            <div class="message-info">
                <h3>👤 ${message.user}</h3>
                <div class="message-meta">
                    ⏰ ${new Date(message.timestamp).toLocaleString('ar-EG')}
                </div>
            </div>
            <div class="message-content">
                ${this.escapeHtml(message.message)}
            </div>
        `;

        messagesList.insertBefore(messageElement, messagesList.firstChild);

        if (messagesList.children.length > 20) {
            messagesList.removeChild(messagesList.lastChild);
        }

        messageElement.style.animation = 'slideIn 0.3s ease';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span>${message}</span>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(-100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #48bb78, #38a169)',
            error: 'linear-gradient(135deg, #f56565, #e53e3e)',
            warning: 'linear-gradient(135deg, #ed8936, #dd6b20)',
            info: 'linear-gradient(135deg, #4299e1, #3182ce)'
        };
        return colors[type] || colors.info;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// أنميشن مخصص
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .notification {
        font-weight: 600;
        font-size: 0.9rem;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;
document.head.appendChild(style);

// تشغيل اللوحة
document.addEventListener('DOMContentLoaded', () => {
    new BotDashboard();
});
