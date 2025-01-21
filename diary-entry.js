export class DiaryEntry {
  constructor({ title, content, mood, theme, date, weather, stickers = [] }) {
    this.title = title;
    this.content = content;
    this.mood = mood;
    this.theme = theme;
    this.date = date;
    this.weather = weather;
    this.stickers = stickers;
  }
}
