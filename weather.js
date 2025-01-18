export class WeatherService {
  constructor() {
    this.apiKey = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your API key
    this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
  }

  async getCurrentWeather() {
    // If API key isn't set, return mock data
    if (this.apiKey === 'YOUR_OPENWEATHER_API_KEY') {
      return this.getMockWeather();
    }

    try {
      // Get user's location
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // Fetch weather data
      const response = await fetch(
        `${this.baseUrl}?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.apiKey}`
      );
      
      if (!response.ok) throw new Error('Weather API request failed');
      
      const data = await response.json();
      
      return {
        temp: Math.round(data.main.temp),
        description: data.weather[0].description
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.getMockWeather();
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  getMockWeather() {
    const mockWeathers = [
      { temp: 22, description: 'sunny' },
      { temp: 18, description: 'partly cloudy' },
      { temp: 25, description: 'clear skies' },
      { temp: 20, description: 'light breeze' }
    ];
    return mockWeathers[Math.floor(Math.random() * mockWeathers.length)];
  }
}