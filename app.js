// Aindo - AI Chat Application
class AindoChat {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key') || '';
        this.model = localStorage.getItem('openai_model') || 'gpt-3.5-turbo';
        this.conversationHistory = [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadSettings();
    }
    
    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.settingsButton = document.getElementById('settingsButton');
        this.settingsModal = document.getElementById('settingsModal');
        this.apiKeyInput = document.getElementById('apiKey');
        this.modelSelect = document.getElementById('modelSelect');
        this.saveSettingsButton = document.getElementById('saveSettings');
        this.closeSettingsButton = document.getElementById('closeSettings');
    }
    
    attachEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = this.userInput.scrollHeight + 'px';
        });
        
        this.settingsButton.addEventListener('click', () => this.openSettings());
        this.closeSettingsButton.addEventListener('click', () => this.closeSettings());
        this.saveSettingsButton.addEventListener('click', () => this.saveSettings());
        
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
    }
    
    loadSettings() {
        this.apiKeyInput.value = this.apiKey;
        this.modelSelect.value = this.model;
        
        if (!this.apiKey) {
            this.showWarning();
        }
    }
    
    showWarning() {
        const warningMsg = this.createMessage(
            'ai',
            '⚠️ <strong>API Key Required:</strong> Please click the settings button (⚙️) in the bottom right corner to configure your OpenAI API key before chatting.'
        );
        this.chatMessages.appendChild(warningMsg);
        this.scrollToBottom();
    }
    
    openSettings() {
        this.settingsModal.classList.add('active');
    }
    
    closeSettings() {
        this.settingsModal.classList.remove('active');
    }
    
    saveSettings() {
        this.apiKey = this.apiKeyInput.value.trim();
        this.model = this.modelSelect.value;
        
        if (this.apiKey) {
            localStorage.setItem('openai_api_key', this.apiKey);
            localStorage.setItem('openai_model', this.model);
            this.closeSettings();
            
            const successMsg = this.createMessage(
                'ai',
                '✅ Settings saved successfully! You can now start chatting.'
            );
            this.chatMessages.appendChild(successMsg);
            this.scrollToBottom();
        } else {
            alert('Please enter a valid API key');
        }
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        
        if (!message) return;
        
        if (!this.apiKey) {
            alert('Please configure your API key in settings first!');
            this.openSettings();
            return;
        }
        
        // Add user message to chat
        const userMsg = this.createMessage('user', message);
        this.chatMessages.appendChild(userMsg);
        
        // Clear input
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        
        // Disable input while processing
        this.setInputState(false);
        
        // Add loading indicator
        const loadingMsg = this.createLoadingMessage();
        this.chatMessages.appendChild(loadingMsg);
        this.scrollToBottom();
        
        try {
            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: message
            });
            
            // Call OpenAI API
            const response = await this.callOpenAI();
            
            // Remove loading indicator
            loadingMsg.remove();
            
            // Add AI response
            const aiMsg = this.createMessage('ai', response);
            this.chatMessages.appendChild(aiMsg);
            
            // Add to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });
            
        } catch (error) {
            loadingMsg.remove();
            const errorMsg = this.createMessage(
                'ai',
                `❌ <strong>Error:</strong> ${error.message}`
            );
            this.chatMessages.appendChild(errorMsg);
        } finally {
            this.setInputState(true);
            this.scrollToBottom();
        }
    }
    
    async callOpenAI() {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant. You help users with their tasks by providing clear, accurate, and helpful responses.'
                    },
                    ...this.conversationHistory
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get response from AI');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    createMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (type === 'user') {
            contentDiv.textContent = content;
        } else {
            // AI messages can contain HTML (for formatting)
            contentDiv.innerHTML = content;
        }
        
        messageDiv.appendChild(contentDiv);
        return messageDiv;
    }
    
    createLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = '<span class="loading"></span> <span class="loading"></span> <span class="loading"></span>';
        
        messageDiv.appendChild(contentDiv);
        return messageDiv;
    }
    
    setInputState(enabled) {
        this.userInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
        
        if (enabled) {
            this.userInput.focus();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the chat application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AindoChat();
});
