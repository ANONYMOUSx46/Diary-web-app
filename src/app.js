import { WeatherService } from './weather.js';
import { DiaryEntry } from './diary-entry.js';
import { SecurityService } from './security.js';

class DiaryApp {
  constructor() {
    this.weatherService = new WeatherService();
    this.securityService = new SecurityService();
    this.entries = [];
    this.currentTheme = 'default';
    this.setupEventListeners();
    this.init();
    this.selectedStickers = new Set();
    this.quill = new Quill('#entry-content', {
      theme: 'snow'
    });
  }

  async init() {
    const hasPassword = await this.securityService.hasPassword();
    document.getElementById('first-time-msg').style.display = hasPassword ? 'none' : 'block';
    
    // Load saved entries
    const savedEntries = localStorage.getItem('diary-entries');
    if (savedEntries) {
      this.entries = JSON.parse(savedEntries).map(entry => new DiaryEntry(entry));
    }
    
    // Set current date
    const dateElem = document.getElementById('current-date');
    if (dateElem) {
      dateElem.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    // Get weather
    try {
      const weather = await this.weatherService.getCurrentWeather();
      document.getElementById('weather-info').textContent = `${weather.temp}°C ${weather.description}`;
    } catch (error) {
      console.error('Weather fetch failed:', error);
    }

    this.initCalendar();
  }

  setupEventListeners() {
    // Login
    document.getElementById('unlock-btn').addEventListener('click', () => this.handleLogin());
    
    // Navigation
    document.getElementById('new-entry-btn').addEventListener('click', () => this.showModal('new-entry-modal'));
    document.getElementById('settings-btn').addEventListener('click', () => this.showModal('settings-modal'));
    document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

    // Entry creation
    document.getElementById('save-entry').addEventListener('click', () => this.saveEntry());
    document.getElementById('cancel-entry').addEventListener('click', () => this.hideModal('new-entry-modal'));

    // Settings
    document.getElementById('change-password-btn').addEventListener('click', () => this.changePassword());
    document.getElementById('close-settings').addEventListener('click', () => this.hideModal('settings-modal'));
    document.getElementById('app-theme').addEventListener('change', (e) => this.changeTheme(e.target.value));

    // Theme and sticker buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setEntryTheme(btn.dataset.theme));
    });

    // Mood selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectMood(e.target));
    });

    // Sticker selection
    document.querySelectorAll('.sticker-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.toggleSticker(e.target));
    });

    // Search functionality
    document.getElementById('search-input').addEventListener('input', (event) => {
      this.searchEntries(event.target.value);
    });

    // Add event listener for edit button in entry card
    document.getElementById('entries-container').addEventListener('click', (event) => {
      if (event.target.classList.contains('edit-btn')) {
        const index = parseInt(event.target.getAttribute('data-index'), 10);
        if (index >= 0 && index < this.entries.length) {
          this.editEntry(index);
        }
      }
    });
  }

  async handleLogin() {
    const password = document.getElementById('password').value;
    const hasPassword = await this.securityService.hasPassword();
    if (!hasPassword) {
      await this.securityService.setPassword(password);
      this.showMainScreen();
    } else {
      const isValid = await this.securityService.validatePassword(password);
      if (isValid) {
        this.showMainScreen();
      } else {
        alert('Invalid password!');
      }
    }
  }

  showMainScreen() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    this.renderEntries();
  }

  handleLogout() {
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('password').value = '';
  }

  showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  selectMood(button) {
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    button.classList.add('selected');
  }

  toggleSticker(button) {
    button.classList.toggle('selected');
    const sticker = button.textContent;
    if (this.selectedStickers.has(sticker)) {
      this.selectedStickers.delete(sticker);
    } else {
      this.selectedStickers.add(sticker);
    }
  }

  async saveEntry() {
    const title = document.getElementById('entry-title').value;
    const content = this.quill.root.innerHTML; // Get Quill editor content
    const mood = document.querySelector('.mood-btn.selected')?.dataset.mood;
    const stickers = Array.from(this.selectedStickers);
    if (!title || !content) {
      alert('Please fill in all fields!');
      return;
    }
    const entryData = {
      title,
      content,
      mood,
      stickers,
      theme: this.currentTheme,
      date: new Date().toISOString(),
      weather: document.getElementById('weather-info').textContent
    };
    if (this.editingIndex !== undefined) {
      this.entries[this.editingIndex] = new DiaryEntry(entryData);
      delete this.editingIndex; // Clear editing index after saving
    } else {
      this.entries.unshift(new DiaryEntry(entryData));
    }
    localStorage.setItem('diary-entries', JSON.stringify(this.entries));
    this.hideModal('new-entry-modal');
    this.renderEntries();
    this.clearEntryForm();
  }

  renderEntries() {
    const container = document.getElementById('entries-container');
    container.innerHTML = '';
    this.entries.forEach((entry, index) => {
      const card = document.createElement('div');
      card.className = `entry-card theme-${entry.theme}`;
      
      const stickersHtml = entry.stickers ? 
          `<div class="entry-stickers">${entry.stickers.join(' ')}</div>` : '';
      
      card.innerHTML = `
          <h3>${entry.title}</h3>
          <div class="entry-meta">
              <span>${new Date(entry.date).toLocaleDateString()}</span>
              <span>${entry.weather}</span>
              ${entry.mood ? `<span class="mood">${this.getMoodEmoji(entry.mood)}</span>` : ''}
          </div>
          ${stickersHtml}
          <div class="entry-content">${entry.content}</div>
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
      `;
      container.appendChild(card);
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', (e) => this.deleteEntry(e));
    });
  }

  getMoodEmoji(mood) {
    const moods = {
      happy: '😊',
      sad: '😢',
      excited: '🤗',
      tired: '😴'
    };
    return moods[mood] || '';
  }

  clearEntryForm() {
    document.getElementById('entry-title').value = '';
    this.quill.root.innerHTML = ''; // Clear Quill editor content
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.sticker-btn').forEach(btn => btn.classList.remove('selected'));
    this.selectedStickers.clear();
    this.currentTheme = 'default';
  }

  setEntryTheme(theme) {
    this.currentTheme = theme;
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.theme === theme);
    });
  }

  async changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    if (!currentPassword || !newPassword) {
      alert('Please fill in both password fields!');
      return;
    }
    const isValid = await this.securityService.validatePassword(currentPassword);
    if (isValid) {
      await this.securityService.setPassword(newPassword);
      alert('Password updated successfully!');
      this.hideModal('settings-modal');
    } else {
      alert('Current password is incorrect!');
    }
  }

  changeTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('app-theme', theme);
  }

  deleteEntry(event) {
    const index = parseInt(event.target.getAttribute('data-index'), 10);
    if (index >= 0 && index < this.entries.length) {
        // Remove the entry from the entries array
        this.entries.splice(index, 1);
        
        // Update local storage
        localStorage.setItem('diary-entries', JSON.stringify(this.entries));
        
        // Re-render the entries to reflect the changes
        this.renderEntries();
    }
  }

  editEntry(index) {
    const entry = this.entries[index];
    document.getElementById('entry-title').value = entry.title;
    this.quill.root.innerHTML = entry.content; // Set Quill editor content
    document.querySelector(`.mood-btn[data-mood="${entry.mood}"]`).classList.add('selected');
    entry.stickers.forEach(sticker => this.selectedStickers.add(sticker));
    this.currentTheme = entry.theme;
    this.showModal('new-entry-modal');
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.theme === entry.theme);
    });
    this.editingIndex = index; // Store the index of the entry being edited
  }

  searchEntries(query) {
    const filteredEntries = this.entries.filter(entry => 
      entry.title.toLowerCase().includes(query.toLowerCase()) || 
      entry.content.toLowerCase().includes(query.toLowerCase())
    );
    this.renderFilteredEntries(filteredEntries);
  }

  renderFilteredEntries(entries) {
    const container = document.getElementById('entries-container');
    container.innerHTML = '';
    entries.forEach((entry, index) => {
      const card = document.createElement('div');
      card.className = `entry-card theme-${entry.theme}`;
      
      const stickersHtml = entry.stickers ? 
          `<div class="entry-stickers">${entry.stickers.join(' ')}</div>` : '';
      
      card.innerHTML = `
          <h3>${entry.title}</h3>
          <div class="entry-meta">
              <span>${new Date(entry.date).toLocaleDateString()}</span>
              <span>${entry.weather}</span>
              ${entry.mood ? `<span class="mood">${this.getMoodEmoji(entry.mood)}</span>` : ''}
          </div>
          ${stickersHtml}
          <p>${entry.content}</p>
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
      `;
      container.appendChild(card);
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', (e) => this.deleteEntry(e));
    });
  }

  initCalendar() {
    document.addEventListener('DOMContentLoaded', function() {
      var calendarEl = document.getElementById('calendar');
      var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: this.getCalendarEvents()
      });
      calendar.render();
    }.bind(this));
  }

  getCalendarEvents() {
    return this.entries.map(entry => ({
      title: entry.title,
      start: new Date(entry.date)
    }));
  }
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  new DiaryApp();
});