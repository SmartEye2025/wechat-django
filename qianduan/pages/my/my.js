// pages/my/my.js
const app = getApp()
Page({
  data: {
    userInfo: null,
    nickname: '',   // 存储修改的昵称
    avatar: '',     // 存储修改的头像
    bindingInfo:{
      has_binding:false,
      student_id:'',
      student_name:''
    }
  },

  onLoad: function () {
    // 获取用户信息，假设从缓存或其他地方获取
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.isLoggedIn) {
      // 如果没有 nickName 字段，默认用 username 作为初始昵称
      const nickName = userInfo.nickName || userInfo.nickname || userInfo.username;
      this.setData({
        userInfo: {
          ...userInfo,
          nickName: nickName
        },
        nickname: nickName,
        avatar: userInfo.avatarUrl
      });
      this.loadBindingInfo();   // 加载绑定信息
    }
  },

  
  // 加载绑定信息
  loadBindingInfo:function(){
    if(!this.data.userInfo) return;
    console.log('正在加载绑定信息...');
    wx.request({
      url:app.globalData.URL+'get_binding_info/',
      method:'GET',
      data:{
        username:this.data.userInfo.username,
      },
      success:(res) => {
        console.log('绑定信息响应:', res.data);
        if(res.data.status === 'success'){
          this.setData({
            bindingInfo:res.data.data
          })
        }else{
          console.error('获取绑定信息失败:',res.data.message);
        }
      },
      fail:(err) => {
        console.error('请求绑定信息失败:',err);
      }
    });
  },

  //绑定孩子
  bindStudent:function(){
    if(!this.data.userInfo){
      this.goLogin();
      wx.showToast({
        title:'请先登录',
        icon:'none',
        duration:2000
      });
      return;
    }

    if(this.data.bindingInfo.has_binding){
      wx.showToast({
        title: '绑定信息',
        content:`您已绑定学号为 ${this.data.bindingInfo.student_id}  的孩子 ${this.data.bindingInfo.student_name} `,
        showCancel:true,
        cancelText:'关闭',
        confirmText:'解除绑定',
        success: (res) => {
          if(res.confirm){
            this.unbindStudent();
          }
        }
      });
      return;
    }


    // 如果未绑定，显示绑定对话框
    wx.showModal({
      title: '绑定孩子',
      editable: true,
      placeholderText: '请输入孩子学号',
      success: (res) => {
        if (res.confirm && res.content) {
          const studentId = res.content.trim();
          if (!studentId) {
            wx.showToast({
              title: '学号不能为空',
              icon: 'none'
            });
            return;
          }
          
          wx.showLoading({
            title: '绑定中...',
            mask: true
          });
          
          // 发送绑定请求
          wx.request({
            url: app.globalData.URL+'bind_student/',
            method: 'POST',
            data: {
              username:this.data.userInfo.username,
              student_id: studentId
            },
            success: (res) => {
              wx.hideLoading();
              if (res.data.status === 'success') {
                wx.showToast({
                  title: '绑定成功',
                  icon: 'success'
                });
                // 更新绑定信息
                setTimeout(() => {
                  this.loadBindingInfo();
                }, 500);
              } else {
                // wx.showToast({
                //   title: '绑定失败',
                //   content: res.data.message || '绑定失败，请重试',
                //   showCancel: false
                // });
                wx.showModal({
                  title: '绑定失败',
                  content: res.data.message || '绑定失败，请重试',
                  showCancel: false
                });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              });
              console.error('绑定请求失败:', err);
            }
          });
        }
      }
    }); 
  },

  // 解除绑定
  unbindStudent: function() {
    if (!this.data.userInfo || !this.data.bindingInfo.has_binding) {
      return;
    }
    
    wx.showModal({
      title: '解除绑定',
      content: '确定要解除与孩子的绑定关系吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '解除绑定中...',
            mask: true
          });
          
          wx.request({
            url: app.globalData.URL+'unbind_student/',
            method: 'POST',
            data: {
              username:this.data.userInfo.username,
            },
            success: (res) => {
              wx.hideLoading();
              if (res.data.status === 'success') {
                wx.showToast({
                  title: '解除绑定成功',
                  icon: 'success'
                });
                this.setData({
                  bindingInfo: {
                    has_binding: false,
                    student_id: '',
                    student_name: ''
                  }
                });
              } else {
                wx.showToast({
                  title: '解除绑定失败',
                  content: res.data.message || '解除绑定失败，请重试',
                  showCancel: false
                });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },


  // 修改头像
  changeAvatar() {
    if (!this.data.userInfo) {
      this.goLogin();
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 3000
      });
      return;
    }
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const avatar = res.tempFilePaths[0];
        this.setData({ avatar: avatar });

        // 上传头像至后端
        wx.uploadFile({
          url: app.globalData.URL+'update_profile/',  // 后端更新用户资料的接口
          filePath: avatar,
          name: 'avatar',  // 文件字段名称必须与后端一致
          formData: {
            username: this.data.userInfo.username  // 只用 username 作为唯一标识
          },
          success: (res) => {
            const data = JSON.parse(res.data);
            if (data.status === 'success') {
              // 更新本地存储的用户信息
              const userInfo = wx.getStorageSync('userInfo');
              userInfo.avatarUrl = data.user.avatar_url;
              wx.setStorageSync('userInfo', userInfo);

              // 更新页面显示
              this.setData({
                userInfo: {
                  ...this.data.userInfo,
                  avatarUrl: data.user.avatar_url
                }
              });

              wx.showToast({
                title: '头像更新成功',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: data.message || '头像上传失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            wx.showToast({
              title: '请求失败',
              icon: 'none'
            });
            console.error('上传头像失败:', err);
          }
        });
      }
    });
  },

  // 修改昵称
  editNickname() {
    if (!this.data.userInfo) {
      this.goLogin();
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 3000
      });
      return;
    }

    wx.showModal({
      title: '修改昵称',
      content: '',
      editable: true,
      placeholderText: '请输入新昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          const newNickname = res.content;
          // 发送修改昵称的请求到后端
          wx.request({
            url: app.globalData.URL+'update_profile/',
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
              username: this.data.userInfo.username,  // 只用 username 作为唯一标识
              nickname: newNickname
            },
            success: (res) => {
              if (res.data.status === 'success') {
                // 更新本地存储的用户信息
                const userInfo = wx.getStorageSync('userInfo');
                userInfo.nickName = res.data.user.nickname;
                wx.setStorageSync('userInfo', userInfo);

                // 更新页面显示
                this.setData({
                  userInfo: {
                    ...this.data.userInfo,
                    nickName: res.data.user.nickname
                  },
                  nickname: res.data.user.nickname
                });

                wx.showToast({
                  title: '昵称修改成功',
                  icon: 'success',
                  duration: 2000
                });
              } else {
                wx.showToast({
                  title: res.data.message || '修改失败',
                  icon: 'none',
                  duration: 2000
                });
              }
            },
            fail: (error) => {
              wx.showToast({
                title: '请求失败',
                icon: 'none'
              });
              console.error('修改昵称失败:', error);
            }
          });
        }
      }
    });
  },


  onShow: function () {
    // 每次页面显示时检查登录状态
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.isLoggedIn) {
      this.setData({
        userInfo
      });
      // 每次显示页面时刷新绑定信息
      this.loadBindingInfo();
    }
  },

  goLogin: function () {
    // 跳转到登录页面
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  onMenuTap: function (e) {
    const menu = e.currentTarget.dataset.menu;

    // 检查是否登录
    if (!this.data.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      this.goLogin();
      return;
    }

    // 根据菜单项跳转到对应页面
    switch (menu) {
      case 'announcement':
        wx.navigateTo({ url: '/pages/announcement/announcement' });
        break;
      case 'message':
        wx.navigateTo({ url: '/pages/message/message' });
        break;
      case 'class-register':
        wx.navigateTo({ url: '/pages/class-register/class-register' });
        break;
      case 'evaluation':
        wx.navigateTo({ url: '/pages/evaluation/evaluation' });
        break;
      case 'leave':
        wx.navigateTo({ url: '/pages/leave/leave' });
        break;
      case 'attendance':
        wx.navigateTo({ url: '/pages/attendance/attendance' });
        break;
    }
  },

  onSettingTap: function () {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  onAboutTap: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  logout: function () {
    // 退出登录
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息
          wx.removeStorageSync('userInfo');
          this.setData({
            userInfo: null
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'none'
          });
        }
      }
    });
  }
});
