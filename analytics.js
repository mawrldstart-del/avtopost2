// Расширенная аналитика для Telegram AutoPoster
class AdvancedAnalytics {
    constructor() {
        this.charts = {};
        this.data = this.generateMockData();
        this.init();
    }

    init() {
        this.initializeCharts();
        this.setupEventListeners();
    }

    generateMockData() {
        const now = new Date();
        const days = 30;
        
        return {
            engagement: this.generateTimeSeriesData(days, 2, 8, 'engagement'),
            views: this.generateTimeSeriesData(days, 1000, 5000, 'views'),
            posts: this.generateTimeSeriesData(days, 5, 25, 'posts'),
            groups: this.generateTimeSeriesData(days, 3, 12, 'groups'),
            
            // Данные по группам
            groupStats: [
                { name: 'Tech News', members: 1250, posts: 45, engagement: 6.2, growth: 12 },
                { name: 'Crypto Community', members: 3400, posts: 32, engagement: 4.8, growth: 8 },
                { name: 'Marketing Tips', members: 890, posts: 28, engagement: 7.1, growth: 15 },
                { name: 'Startup Ideas', members: 567, posts: 15, engagement: 5.9, growth: 3 },
                { name: 'AI News', members: 2100, posts: 38, engagement: 8.3, growth: 22 }
            ],

            // Временные паттерны
            timePatterns: {
                hours: [8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100],
                days: [85, 92, 88, 95, 102, 98, 105],
                months: [1200, 1350, 1180, 1420, 1380, 1560, 1480, 1620, 1590, 1680, 1720, 1850]
            },

            // Типы контента
            contentTypes: [
                { name: 'Текст', count: 45, engagement: 5.2 },
                { name: 'Изображения', count: 32, engagement: 7.8 },
                { name: 'Видео', count: 18, engagement: 9.1 },
                { name: 'Ссылки', count: 25, engagement: 4.3 }
            ]
        };
    }

    generateTimeSeriesData(days, min, max, type) {
        const data = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            let value;
            switch(type) {
                case 'engagement':
                    value = Math.random() * (max - min) + min;
                    break;
                case 'views':
                    value = Math.floor(Math.random() * (max - min) + min);
                    break;
                case 'posts':
                    value = Math.floor(Math.random() * (max - min) + min);
                    break;
                case 'groups':
                    value = Math.floor(Math.random() * (max - min) + min);
                    break;
                default:
                    value = Math.floor(Math.random() * (max - min) + min);
            }
            
            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(value * 10) / 10
            });
        }
        
        return data;
    }

    initializeCharts() {
        this.createEngagementChart();
        this.createGroupComparisonChart();
        this.createTimePatternChart();
        this.createContentTypeChart();
    }

    createEngagementChart() {
        const chartDom = document.getElementById('engagement-chart');
        if (!chartDom) return;

        this.charts.engagement = echarts.init(chartDom);
        
        const option = {
            title: {
                text: 'Вовлеченность по времени',
                textStyle: { fontSize: 14, color: '#374151' }
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e5e7eb',
                textStyle: { color: '#374151' }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: this.data.engagement.map(d => d.date),
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280', fontSize: 10 }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280', fontSize: 10 },
                splitLine: { lineStyle: { color: '#f3f4f6' } }
            },
            series: [{
                name: 'Вовлеченность (%)',
                type: 'line',
                smooth: true,
                data: this.data.engagement.map(d => d.value),
                lineStyle: { color: '#3b82f6', width: 2 },
                areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
                itemStyle: { color: '#3b82f6' }
            }]
        };

        this.charts.engagement.setOption(option);
    }

    createGroupComparisonChart() {
        const chartDom = document.getElementById('group-comparison-chart');
        if (!chartDom) return;

        this.charts.groupComparison = echarts.init(chartDom);
        
        const option = {
            title: {
                text: 'Сравнение групп',
                textStyle: { fontSize: 14, color: '#374151' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: ['Участники', 'Посты', 'Вовлеченность'],
                bottom: 0,
                textStyle: { fontSize: 10 }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: this.data.groupStats.map(g => g.name),
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280', fontSize: 9, rotate: 45 }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Количество',
                    position: 'left',
                    axisLine: { lineStyle: { color: '#e5e7eb' } },
                    axisLabel: { color: '#6b7280', fontSize: 10 },
                    splitLine: { lineStyle: { color: '#f3f4f6' } }
                },
                {
                    type: 'value',
                    name: 'Вовлеченность (%)',
                    position: 'right',
                    axisLine: { lineStyle: { color: '#e5e7eb' } },
                    axisLabel: { color: '#6b7280', fontSize: 10 }
                }
            ],
            series: [
                {
                    name: 'Участники',
                    type: 'bar',
                    data: this.data.groupStats.map(g => g.members),
                    itemStyle: { color: '#3b82f6' }
                },
                {
                    name: 'Посты',
                    type: 'bar',
                    data: this.data.groupStats.map(g => g.posts),
                    itemStyle: { color: '#10b981' }
                },
                {
                    name: 'Вовлеченность',
                    type: 'line',
                    yAxisIndex: 1,
                    data: this.data.groupStats.map(g => g.engagement),
                    itemStyle: { color: '#f59e0b' },
                    lineStyle: { color: '#f59e0b', width: 2 }
                }
            ]
        };

        this.charts.groupComparison.setOption(option);
    }

    createTimePatternChart() {
        const chartDom = document.getElementById('time-pattern-chart');
        if (!chartDom) return;

        this.charts.timePattern = echarts.init(chartDom);
        
        const option = {
            title: {
                text: 'Активность по времени',
                textStyle: { fontSize: 14, color: '#374151' }
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e5e7eb'
            },
            legend: {
                data: ['По часам', 'По дням', 'По месяцам'],
                bottom: 0,
                textStyle: { fontSize: 10 }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: Array.from({length: 24}, (_, i) => `${i}:00`),
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280', fontSize: 9 }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280', fontSize: 10 },
                splitLine: { lineStyle: { color: '#f3f4f6' } }
            },
            series: [{
                name: 'По часам',
                type: 'line',
                smooth: true,
                data: this.data.timePatterns.hours,
                lineStyle: { color: '#3b82f6', width: 2 },
                areaStyle: { color: 'rgba(59, 130, 246, 0.1)' }
            }]
        };

        this.charts.timePattern.setOption(option);
    }

    createContentTypeChart() {
        const chartDom = document.getElementById('content-type-chart');
        if (!chartDom) return;

        this.charts.contentType = echarts.init(chartDom);
        
        const option = {
            title: {
                text: 'Типы контента',
                textStyle: { fontSize: 14, color: '#374151' }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'horizontal',
                bottom: 0,
                textStyle: { fontSize: 10 }
            },
            series: [{
                name: 'Контент',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '45%'],
                data: this.data.contentTypes.map(ct => ({
                    value: ct.count,
                    name: ct.name
                })),
                itemStyle: {
                    borderRadius: 4,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };

        this.charts.contentType.setOption(option);
    }

    setupEventListeners() {
        // Обработка изменения периода анализа
        const periodSelect = document.getElementById('analytics-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.updateChartsForPeriod(e.target.value);
            });
        }

        // Обработка экспорта данных
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Обработка обновления данных
        const refreshBtn = document.getElementById('refresh-analytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
    }

    updateChartsForPeriod(period) {
        // Обновление всех графиков для выбранного периода
        let newData;
        
        switch(period) {
            case 'week':
                newData = this.generateTimeSeriesData(7, 2, 8, 'engagement');
                break;
            case 'month':
                newData = this.generateTimeSeriesData(30, 2, 8, 'engagement');
                break;
            case 'quarter':
                newData = this.generateTimeSeriesData(90, 2, 8, 'engagement');
                break;
            default:
                newData = this.data.engagement;
        }

        // Обновление графика вовлеченности
        if (this.charts.engagement) {
            this.charts.engagement.setOption({
                xAxis: {
                    data: newData.map(d => d.date)
                },
                series: [{
                    data: newData.map(d => d.value)
                }]
            });
        }
    }

    exportData() {
        const dataToExport = {
            engagement: this.data.engagement,
            groupStats: this.data.groupStats,
            contentTypes: this.data.contentTypes,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        notify.success('Данные экспортированы успешно');
    }

    refreshData() {
        // Симуляция обновления данных
        this.data = this.generateMockData();
        
        // Пересоздание всех графиков
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.dispose) {
                chart.dispose();
            }
        });
        
        this.initializeCharts();
        notify.success('Данные обновлены');
    }

    // Методы для получения метрик
    getTotalViews() {
        return this.data.views.reduce((sum, item) => sum + item.value, 0);
    }

    getAverageEngagement() {
        const total = this.data.engagement.reduce((sum, item) => sum + item.value, 0);
        return (total / this.data.engagement.length).toFixed(1);
    }

    getTopGroupByEngagement() {
        return this.data.groupStats.reduce((top, group) => 
            group.engagement > top.engagement ? group : top
        );
    }

    getGrowthTrend() {
        const recent = this.data.engagement.slice(-7);
        const previous = this.data.engagement.slice(-14, -7);
        
        const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
        const previousAvg = previous.reduce((sum, item) => sum + item.value, 0) / previous.length;
        
        return ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1);
    }
}

// Глобальный экземпляр аналитики
const advancedAnalytics = new AdvancedAnalytics();