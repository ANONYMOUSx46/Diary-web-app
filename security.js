export class SecurityService {
  constructor() {
    this.storageKey = 'diary-password-hash';
  }

  async hasPassword() {
    return !!localStorage.getItem(this.storageKey);
  }

  async setPassword(password) {
    const hash = CryptoJS.SHA256(password).toString();
    localStorage.setItem(this.storageKey, hash);
  }

  async validatePassword(password) {
    const storedHash = localStorage.getItem(this.storageKey);
    const inputHash = CryptoJS.SHA256(password).toString();
    return storedHash === inputHash;
  }
}