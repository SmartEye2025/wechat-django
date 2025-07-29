import * as echarts from '../../ec-canvas/echarts';

Page({
  data: {
    // 筛选
    timeRanges: ['本周', '上周', '本月'],
    timeIndex: 0,
    classes: ['全部学科', '语文', '数学', '外语', '美术'],
    classIndex: 0,
    
    // 统计卡片
    focusTime: 0,
    focusTrend: 0,
    leaveCount: 0,
    leaveTrend: 0,
    handupRate: 0,
    handupTrend: 0,

    // 图表数据
    weeklyData: {
      focusTime: [],
      distractionCount: []
    },
    distractionTypes: [],

    // 图表配置
    ecBar: {
      onInit: (canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
        canvas.setChart(chart);
        this.lineChart = chart;
        return chart;
      }
    },
    ecPie: {
      onInit: (canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
        canvas.setChart(chart);
        this.pieChart = chart;
        return chart;
      }
    }
  },

  onLoad() {
    this.loadReportData();
  },

  // 加载报告数据
  loadReportData() {
    const timeRange = this.data.timeRanges[this.data.timeIndex];
    const subject = this.data.classes[this.data.classIndex];
    wx.showLoading({ title: '加载中...' });
    // 获取统计数据
    this.getStatistics(timeRange, subject);
    // 获取周数据
    this.getWeeklyData(timeRange, subject);
    // 获取注意力分散类型数据
    this.getDistractionTypes(timeRange, subject);
  },

  // 获取统计数据
  getStatistics(timeRange, subject) {
    wx.request({
      url: 'http://localhost:8000/statistics/',
      method: 'GET',
      data: {
        time_range: timeRange,
        subject: subject
      },
      success: (res) => {
        if (res.data.success) {
          const data = res.data.data;
          this.setData({
            focusTime: data.focus_time,
            focusTrend: data.focus_trend,
            leaveCount: data.leave_count,
            leaveTrend: data.leave_trend,
            handupRate: data.handup_rate,
            handupTrend: data.handup_trend
          });
        }
      },
      fail: (err) => {
        console.error('获取统计数据失败:', err);
        wx.showToast({ title: '获取数据失败', icon: 'error' });
      }
    });
  },

  // 获取周数据
  getWeeklyData(timeRange, subject) {
    wx.request({
      url: 'http://localhost:8000/weekly_data/',
      method: 'GET',
      data: {
        time_range: timeRange,
        subject: subject
      },
      success: (res) => {
        if (res.data.success) {
          const data = res.data.data;
          this.setData({
            weeklyData: {
              focusTime: data.focus_time,
              distractionCount: data.distraction_count
            }
          });
          this.updatelineChart();
        }
      },
      fail: (err) => {
        console.error('获取周数据失败:', err);
      }
    });
  },

  // 获取注意力分散类型数据
  getDistractionTypes(timeRange, subject) {
    wx.request({
      url: 'http://localhost:8000/distraction_types/',
      method: 'GET',
      data: {
        time_range: timeRange,
        subject: subject
      },
      success: (res) => {
        if (res.data.success) {
          this.setData({
            distractionTypes: res.data.data
          });
          this.updatePieChart();
        }
      },
      fail: (err) => {
        console.error('获取注意力分散类型数据失败:', err);
      }
    });
  },

  // 更新柱状图
  updatelineChart() {
    if (this.lineChart) {
      const option = {
        color: ['#6a8dfc', '#f7b7a3'],
        tooltip: {},
        legend: { data: ['专注时长(小时)', '分心次数'] },
        xAxis: { data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
        yAxis: {
          interval: 2,
          axisLabel: {
            fontSize: 8
          }
        },
        series: [
          { 
            name: '专注时长(小时)', 
            type: 'line', 
            smooth: true, 
            data: this.data.weeklyData.focusTime 
          },
          { name: '分心次数', 
            type: 'line', 
            smooth: true, 
            data: this.data.weeklyData.distractionCount 
          }
        ]
      };
      this.lineChart.setOption(option);
    }
  },

  // 更新饼图
  updatePieChart() {
    if (this.pieChart) {
      const data = this.data.distractionTypes.map(item => ({
        value: item.count,
        name: item.type
      }));
      
      const option = {
        color: ['#6a8dfc', '#f7b7a3', '#ffe082', '#b2dfdb', '#ffd54f'],
        tooltip: { trigger: 'item' },
        legend: { 
          orient: 'vertical', 
          left: 'left', 
          data: this.data.distractionTypes.map(item => item.type) 
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
      }
    },

  onTimeChange(e) {
    this.setData({ timeIndex: e.detail.value });
  },
  
  onClassChange(e) {
    this.setData({ classIndex: e.detail.value });
  },
  
  onFilter() {
    this.loadReportData();
    wx.showToast({ title: '已应用筛选', icon: 'success' });
  }
});