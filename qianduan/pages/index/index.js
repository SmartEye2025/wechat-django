// index.js
Page({
  goReport (){
    wx.navigateTo({
      url:'/pages/report/report'
    });
  },

  goHomework (){
    wx.navigateTo({
      url:'/pages/homework/homework'
    });
  }
});
