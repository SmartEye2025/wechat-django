import * as echarts from '../../ec-canvas/echarts';
const app = getApp()
Page({
  data: {
    // 筛选
    time_ranges: ['本周', '上周', '本月'],
    time_index: 0,
    subjects: ['全部学科', '语文', '数学', '外语', '美术'],
    subject_index: 0,
    
    // 统计卡片
    focus_time: 0,
    focus_trend: 0,
    leave_count: 0,
    leave_trend: 0,
    handup_count: 0,
    handup_trend: 0,

    // 图表数据
    weeklyData: {
      focus_time: [4.6, 2.4, 6, 4.6, 7.2],
      distraction_count: [12, 16, 10, 8, 6]
    },
    distraction_types: [
      { type: '离座', count: 1 },
      { type: '起立', count: 1 },
      { type: '东张西望', count: 1 },
      { type: '多动', count: 1 },
      { type: '瞌睡', count: 1 }
    ],

    // 图表配置
    ecLine: {
      onInit: (canvas, width, height, dpr) => {
        console.log('初始化折线图');
        const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
        canvas.setChart(chart);
        const page = getCurrentPages()[getCurrentPages().length - 1];
        page.lineChart = chart;
        
        // 立即设置初始数据
        const option = {
          color: ['#6a8dfc', '#f7b7a3'],
          tooltip: {},
          legend: { data: ['专注时长(5分钟)', '分心次数'] },
          xAxis: { data: ['周一', '周二', '周三', '周四', '周五'] },
          yAxis: {
            interval: 2,
            axisLabel: { fontSize: 8 }
          },
          series: [
            { name: '专注时长(5分钟)', type: 'line', smooth: true, data: [1, 1, 1, 1, 1, 1, 1] },
            { name: '分心次数', type: 'line', smooth: true, data: [2, 2, 2, 2, 2, 2, 2] }
          ]
        };
        chart.setOption(option);
        console.log('折线图初始化完成');
        return chart;
      }
    },
    ecPie: {
      onInit: (canvas, width, height, dpr) => {
        console.log('初始化饼图');
        const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
        canvas.setChart(chart);
        const page = getCurrentPages()[getCurrentPages().length - 1];
        page.pieChart = chart;
        
        // 立即设置初始数据
        const option = {
          color: ['#6a8dfc', '#f7b7a3', '#ffe082', '#b2dfdb', '#ffd54f'],
          tooltip: { trigger: 'item' },
          legend: { 
            orient: 'vertical', 
            left: 'left', 
            data: ['离座', '起立', '东张西望', '多动', '瞌睡']
          },
          series: [{
            name: '注意力情况',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } },
            labelLine: { show: false },
            data: [
              { value: 1, name: '离座' },
              { value: 1, name: '起立' },
              { value: 1, name: '东张西望' },
              { value: 1, name: '多动' },
              { value: 1, name: '瞌睡' }
            ]
          }]
        };
        chart.setOption(option);
        console.log('饼图初始化完成');
        return chart;
      }
    }
  },

  onLoad() {
    console.log('页面加载');
    // 先显示默认数据，然后尝试加载真实数据
    this.loadReportData();
  },

  // 加载报告数据
  loadReportData() {
    console.log('开始加载报告数据');
    const time_range = this.data.time_ranges[this.data.time_index];
    const subject = this.data.subjects[this.data.subject_index];
    
    wx.showLoading({ title: '加载中...' });
    
    // 计数器，用于跟踪所有请求完成
    this.requestCount = 0;
    this.totalRequests = 3;
    
    // 获取统计数据
    this.getStatistics(time_range, subject);
    // 获取周数据
    this.getWeeklyData(time_range, subject);
    // 获取注意力分散类型数据
    this.getDistractionTypes(time_range, subject);
  },

  // 检查是否所有请求都完成
  checkAllRequestsComplete() {
    this.requestCount++;
    console.log(`请求完成 ${this.requestCount}/${this.totalRequests}`);
    if (this.requestCount >= this.totalRequests) {
      wx.hideLoading();
      console.log('所有数据加载完成');
    }
  },

  // 获取统计数据
  getStatistics(time_range, subject) {
    console.log('请求统计数据:', time_range, subject);
    wx.request({
      url: app.globalData.URL+'statistics/',
      method: 'GET',
      data: {
        time_range: time_range,
        subject: subject
      },
      success: (res) => {
        console.log('统计数据响应:', res.data);
        if (res.data.success) {
          const data = res.data.data;
          this.setData({
            focus_time: data.focus_time || 0,
            focus_trend: data.focus_trend || 0,
            leave_count: data.leave_count || 0,
            leave_trend: data.leave_trend || 0,
            handup_count: data.handup_count || 0,
            handup_trend: data.handup_trend || 0
          });
        } else {
          console.error('统计数据请求失败:', res.data);
          wx.showToast({ title: '获取统计数据失败', icon: 'error' });
        }
        this.checkAllRequestsComplete();
      },
      fail: (err) => {
        console.error('获取统计数据失败:', err);
        wx.showToast({ title: '获取数据失败', icon: 'error' });
        this.checkAllRequestsComplete();
      }
    });
  },

  // 获取周数据
  getWeeklyData(time_range, subject) {
    console.log('请求周数据:', time_range, subject);
    wx.request({
      url: app.globalData.URL+'weekly_data/',
      method: 'GET',
      data: {
        time_range: time_range,
        subject: subject
      },
      success: (res) => {
        console.log('周数据响应:', res.data);
        if (res.data.success) {
          const data = res.data.data;
          this.setData({
            weeklyData: {
              focus_time: data.focus_time || [0, 0, 0, 0, 0, 0, 0],
              distraction_count: data.distraction_count || [0, 0, 0, 0, 0, 0, 0]
            }
          });
          // 延迟更新图表，确保数据已设置
          setTimeout(() => {
            this.updateLineChart();
          }, 100);
        } else {
          console.error('周数据请求失败:', res.data);
        }
        this.checkAllRequestsComplete();
      },
      fail: (err) => {
        console.error('获取周数据失败:', err);
        this.checkAllRequestsComplete();
      }
    });
  },

  // 获取注意力分散类型数据
  getDistractionTypes(time_range, subject) {
    console.log('请求注意力分散类型数据:', time_range, subject);
    wx.request({
      url: app.globalData.URL+'distraction_types/',
      method: 'GET',
      data: {
        time_range: time_range,
        subject: subject
      },
      success: (res) => {
        console.log('注意力分散类型数据响应:', res.data);
        if (res.data.success) {
          const data = res.data.data || [];
          this.setData({
            distraction_types: data
          });
          setTimeout(() => {
            this.updatePieChart();
          }, 100);
        } else {
          console.error('注意力分散类型数据请求失败:', res.data);
        }
        this.checkAllRequestsComplete();
      },
      fail: (err) => {
        console.error('获取注意力分散类型数据失败:', err);
        this.checkAllRequestsComplete();
      }
    });
  },

  // 更新折线图
  updateLineChart() {
    console.log('更新折线图，数据:', this.data.weeklyData);
    if (this.lineChart) {
      // 根据时间范围调整配置
      const timeRange = this.data.time_ranges[this.data.time_index];
      let xAxisData;
      let yAxisMin;
      
      if (timeRange === '本月') {
        xAxisData = ['第1周', '第2周', '第3周', '第4周'];
        yAxisMin = 80;
      } else {
        xAxisData = ['周一', '周二', '周三', '周四', '周五'];
        yAxisMin = 0;
      }
      
      const option = {
        color: ['#6a8dfc', '#f7b7a3'],
        tooltip: { },
        legend: { 
          data: ['专注时长(5分钟)', '分心次数'],
          top: 10
        },
        grid: {
          left: '1%',
          right: '1%',
          bottom: '1%',
          containLabel: true
        },
        xAxis: { 
          data: xAxisData,
          axisLabel: {
            fontSize: 10
          }
        },
        yAxis: {
          min: yAxisMin,
          interval: timeRange === '本月' ? 1 : 2,
          axisLabel: {
            fontSize: timeRange === '本月' ? 6 : 8
          }
        },
        series: [
          { name: '专注时长(5分钟)', type: 'line', symbolSize: 6, data: this.data.weeklyData.focus_time },
          { name: '分心次数', type: 'line', symbolSize: 6, data: this.data.weeklyData.distraction_count }
        ]
      };
      this.lineChart.setOption(option);
      console.log('折线图更新完成');
    } else {
      console.error('折线图未初始化');
    }
  },

  // 更新饼图
  updatePieChart() {
    console.log('更新饼图，数据:', this.data.distraction_types);
    if (this.pieChart) {
      const data = this.data.distraction_types.map(item => ({
        value: item.count,
        name: item.type
      }));
      
      const option = {
        color: ['#6a8dfc', '#f7b7a3', '#ffe082', '#b2dfdb', '#ffd54f'],
        tooltip: { trigger: 'item' },
        legend: { 
          orient: 'vertical', 
          left: 'left', 
          data: this.data.distraction_types.map(item => item.type) 
        },
        series: [{
          name: '注意力情况',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } },
          labelLine: { show: false },
          data: data
        }]
      };
      this.pieChart.setOption(option);
      console.log('饼图更新完成');
    } else {
      console.error('饼图未初始化');
    }
  },

  onTimeChange(e) {
    this.setData({ time_index: e.detail.value });
  },
  
  onSubjectChange(e) {
    this.setData({ subject_index: e.detail.value });
  },
  
  onFilter() {
    this.loadReportData();
    wx.showToast({ title: '已应用筛选', icon: 'success' });
  }
});