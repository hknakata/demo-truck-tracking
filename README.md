# 卡车追踪系统

基于 Google Maps 的实时车辆轨迹展示系统，支持多车辆路线规划、动画演示和车辆信息管理。

## 功能特性

- **全屏地图展示** - 基于 Google Maps WebGL API
- **多车辆支持** - 同时显示多辆卡车的行驶轨迹
- **智能路线规划** - 使用 Directions API 自动规划最优道路路径
- **动画演示** - 车辆沿实际道路移动的动画效果
- **车辆信息弹窗** - 点击车辆标记查看详细信息
- **实时位置显示** - 显示车辆精确的GPS坐标
- **交互控制** - 车辆显示过滤、动画播放/暂停控制
- **自定义样式** - 支持云端地图样式与深色主题

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **地图服务**: Google Maps JavaScript API v3
- **路线规划**: Google Directions API
- **样式**: 响应式设计，支持深色主题

## 快速开始

### 1. 环境要求

- 现代浏览器（Chrome 80+, Firefox 75+, Safari 13+）
- Google Maps API Key（需启用以下服务）：
  - Maps JavaScript API
  - Directions API

### 2. 安装配置

```bash
# 克隆项目
git clone https://github.com/hknakata/truck-tracking.git
cd truck-tracking

# 配置 API Key
# 编辑 index.html，替换 YOUR_GOOGLE_MAPS_API_KEY
```

### 3. 本地运行

```bash
# 使用 Python 启动本地服务器
python -m http.server 5500

# 或使用 Node.js
npx http-server -p 5500

# 访问 http://localhost:5500
```

## 配置说明

### API Key 设置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目并启用所需 API
3. 生成 API Key 并配置域名限制
4. 在 index.html 中替换 YOUR_GOOGLE_MAPS_API_KEY

### 车辆数据配置

在 app.js 中修改 trucks 数组：

```javascript
trucks: [
  {
    id: 'T-001',
    color: '#8B5CF6',
    plateNumber: '粤B 12345挂',
    driverName: '张师傅',
    driverPhone: '138-2345-6789',
    status: '运行中',
    destination: '盐田港码头',
    avgSpeed: '45 km/h',
    distance: '23.5 km',
    currentPosition: { lng: 114.25958433451825, lat: 22.571048425559137 },
    path: [
      { lng: 114.25958433451825, lat: 22.571048425559137 }, // 起点
      { lng: 114.27364344847045, lat: 22.576292691511732 }  // 终点
    ]
  }
]
```

### 地图样式

- **云端样式**: 设置 useMapId: true 并配置 Map ID
- **内联样式**: 在 mapOptions 中添加 styles 数组

## 使用指南

### 基本操作

1. **查看轨迹** - 页面加载后自动显示所有车辆路线
2. **过滤车辆** - 使用顶部复选框选择显示特定车辆
3. **控制动画** - 点击"播放"按钮开始车辆移动动画
4. **暂停动画** - 点击"暂停"按钮停止动画播放

### 车辆信息查看

1. **点击车辆标记** - 在地图上点击任意车辆标记（紫色或棕色圆点）
2. **查看详细信息** - 弹窗将显示以下信息：
   - **车牌号码**: 车辆牌照信息
   - **车辆ID**: 内部车辆标识
   - **司机姓名**: 驾驶员信息
   - **联系电话**: 司机联系方式
   - **当前状态**: 运行中/停车中/离线（带颜色标识）
   - **当前位置**: 精确GPS坐标
   - **目的地**: 目标地点
   - **行驶里程**: 累计行驶距离
   - **平均速度**: 当前平均速度
   - **最后更新**: 数据更新时间

3. **关闭弹窗** - 可通过以下方式关闭：
   - 点击右上角的  按钮
   - 点击弹窗外的遮罩区域
   - 按 ESC 键

### 高级功能

- **自动缩放** - 地图自动调整视野以显示所有轨迹
- **路线优化** - 系统自动选择最优道路路径
- **实时位置** - 显示车辆精确的GPS坐标
- **状态标识** - 不同状态使用不同颜色标识

## 车辆数据字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | String | 车辆唯一标识 | "T-001" |
| color | String | 车辆颜色（十六进制） | "#8B5CF6" |
| plateNumber | String | 车牌号码 | "粤B 12345挂" |
| driverName | String | 司机姓名 | "张师傅" |
| driverPhone | String | 司机电话 | "138-2345-6789" |
| status | String | 车辆状态 | "运行中"/"停车中"/"离线" |
| destination | String | 目的地 | "盐田港码头" |
| avgSpeed | String | 平均速度 | "45 km/h" |
| distance | String | 行驶里程 | "23.5 km" |
| currentPosition | Object | 当前位置坐标 | {lng: 114.259, lat: 22.571} |
| path | Array | 行驶路径点 | [{lng, lat}, ...] |

## 项目结构

```bash
truck-tracking/
 index.html          # 主页面（包含车辆信息弹窗）
 styles.css          # 样式文件（包含弹窗样式）
 app.js             # 核心逻辑（包含弹窗功能）
 README.md          # 项目文档
```

## 浏览器兼容性

| 浏览器 | 最低版本 | 支持状态 |
|--------|----------|----------|
| Chrome | 80+ | 完全支持 |
| Firefox | 75+ | 完全支持 |
| Safari | 13+ | 完全支持 |
| Edge | 80+ | 完全支持 |

## 常见问题

### Q: 地图无法显示？

A: 检查 API Key 是否正确配置，确保已启用 Maps JavaScript API。

### Q: 路线规划失败？

A: 确认已启用 Directions API，检查起点终点坐标是否有效。

### Q: 动画不流畅？

A: 可调整 setInterval 间隔时间（默认 200ms）或减少路径点数量。

### Q: 车辆信息弹窗无法显示？

A: 确保点击的是车辆标记（圆形图标），而不是路线。检查浏览器控制台是否有JavaScript错误。

### Q: 当前位置显示不准确？

A: 检查 currentPosition 字段中的坐标是否正确，确保格式为 {lng: 经度, lat: 纬度}。

## 开发说明

### 扩展功能

- 集成实时 GPS 数据
- 添加车辆状态实时更新
- 支持路线历史记录
- 支持百度地图
- 支持多语言界面

### 性能优化

- 大量车辆时考虑分页加载
- 使用 Web Workers 处理复杂计算
- 实现路线缓存机制
- 优化弹窗动画性能

### 自定义样式

弹窗样式可通过修改 styles.css 中的以下类进行自定义：

- .modal-overlay - 弹窗遮罩层
- .modal-container - 弹窗容器
- .modal-header - 弹窗头部
- .modal-content - 弹窗内容
- .info-row - 信息行样式
- .status - 状态标签样式

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

---

**注意**: 使用前请确保遵守 Google Maps API 的使用条款和计费政策。
