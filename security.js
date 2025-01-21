import bcrypt from 'bcryptjs';

export class SecurityService {
  constructor() {
    this.storageKey = 'diary-password-hash';
  }
  
  async hasPassword() {
    return !!localStorage.getItem(this.storageKey);
  }
  
  async setPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    localStorage.setItem(this.storageKey, hash);
  }
  
  async validatePassword(password) {
    const storedHash = localStorage.getItem(this.storageKey);
    return storedHash && await bcrypt.compare(password, storedHash);
  }
}
