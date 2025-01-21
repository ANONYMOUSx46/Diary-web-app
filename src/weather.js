export class WeatherService {
  constructor() {
    this.apiKey = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your actual API key
    this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
  }

  async getCurrentWeather() {
    if (this.apiKey === 'YOUR_OPENWEATHER_API_KEY') {
      return this.getMockWeather();
    }
    try {
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const response = await fetch(
        `${this.baseUrl}?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Weather API request failed with status ${response.status}`);
      }

      const data = await response.json();

      return {
        temp: Math.round(data.main.temp),
        description: data.weather[0].description
      };
    } catch (error) {
      console.error('Error fetching weather:', error.message);
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
      { temp: 20, description: 'light breeze' },
      { temp: 15, description: 'rainy' },
      { temp: 30, description: 'hot' },
      { temp: 10, description: 'cold' },
      { temp: 7, description: 'snowy' },
      { temp: 12, description: 'foggy' },
      { temp: 28, description: 'humid' }
    ];
    return mockWeathers[Math.floor(Math.random() * mockWeathers.length)];
  }
}