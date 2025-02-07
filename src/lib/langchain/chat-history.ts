export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class ChatHistoryManager {
  private history: ChatMessage[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  addMessage(message: ChatMessage) {
    this.history.push(message);
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
  }

  getRecentHistory(count?: number): ChatMessage[] {
    return count ? this.history.slice(-count) : [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  getFormattedHistory(): { type: string; text: string }[] {
    return this.history.map(msg => ({
      type: msg.role,
      text: msg.content
    }));
  }
}
