import * as echarts from '../../ec-canvas/echarts';

Page({
  data: {
    // 筛选
    timeRanges: ['本周', '上周', '本月'],
    timeIndex: 0,
    classes: ['全部学科', '语文', '数学', '外语', '美术'],
    classIndex: 0,
    // 统计卡片
    focusTime: 32,
    focusTrend: 5.2,
    leaveCount: 18,
    leaveTrend: -3.1,
    handupRate: 3,
    handupTrend: 50,

    // 图表配置
    ecBar: {
      onInit: function (canvas, width, height, dpr) {
        const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
        canvas.setChart(chart);
        var option = {
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
            { name: '专注时长(小时)', type: 'line', smooth: true, data: [4.6, 2.4, 6, 4.6, 7.2, 5.6, 4.8] },
            { name: '分心次数', type: 'line', smooth: true, data: [12, 16, 10, 8, 6, 9, 7] }
          ]
        };
        chart.setOption(option);
        return chart;
      }
    },
    ecPie: {
      onInit: function (canvas, width, height, dpr) {
        const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
        canvas.setChart(chart);
        var option = {
          color: ['#6a8dfc', '#f7b7a3', '#ffe082', '#b2dfdb', '#ffd54f'],
          tooltip: { trigger: 'item' },
          legend: { orient: 'vertical', left: 'left', data: ['频繁扭动', '离开座位', '座位打闹', '四处跑动', '下蹲'] },
          series: [{
            name: '注意力情况',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } },
            labelLine: { show: false },
            data: [
              { value: 10, name:'频繁扭动' },
              { value: 5, name: '离开座位' },
              { value: 2, name: '座位打闹' },
              { value: 7, name: '四处跑动' },
              { value: 3, name: '下蹲' }
            ]
          }]
        };
        chart.setOption(option);
        return chart;
      }
    }
  },

  onTimeChange(e) {
    this.setData({ timeIndex: e.detail.value });
  },
  onClassChange(e) {
    this.setData({ classIndex: e.detail.value });
  },
  onFilter() {
    wx.showToast({ title: '已应用筛选', icon: 'success' });
    // 这里可以请求后端数据并 setData
  }
});