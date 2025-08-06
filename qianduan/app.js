// app.js
App({
  globalData: {
    URL: 'http://43.138.252.29:8001/', //43.138.252.29:8001
    username: 'parent_test'
  },
  
  onLaunch() {
    // 应用启动时从本地存储恢复用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.isLoggedIn && userInfo.username) {
      this.globalData.username = userInfo.username;
      console.log('从本地存储恢复username:', this.globalData.username);
    }
  },
  
  // 确保username正确设置的辅助方法
  ensureUsername() {
    if (!this.globalData.username) {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.isLoggedIn && userInfo.username) {
        this.globalData.username = userInfo.username;
        console.log('确保username设置:', this.globalData.username);
        return true;
      }
      return false;
    }
    return true;
  }
})
