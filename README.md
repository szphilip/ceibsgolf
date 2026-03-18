# 🏌️ CEIBS Suzhou Golf Team Website

中欧国际工商学院苏州高尔夫球队官方网站

## 📋 项目简介

单页面应用（SPA），集成球队展示、赛事记录、成绩统计、财务管理等功能。

### 主要功能

- ⛳ **官网首页** - 球队介绍、队员风采、精彩瞬间、球队足迹
- 📊 **赛事记录** - 历史赛事查询和展示
- 🏆 **成绩统计** - 智能成绩计算、排行榜、技能徽章
- 👥 **队员管理** - 队员信息CRUD
- 💰 **财务管理** - 球队经费收支管理
- 📸 **精彩瞬间** - 照片和视频管理
- 🗺️ **球队足迹** - 地图展示去过的球场

## 🚀 技术栈

- **前端**: HTML + CSS + JavaScript (无框架)
- **存储**: localStorage + 服务器端JSON
- **后端**: PHP
- **部署**: Nginx + 宝塔面板

## 📦 文件结构

```
ceibsgolf/
├── index.html                    # 主网站文件
├── api.php                       # 服务器端API
├── data/                         # 数据目录（不提交Git）
│   ├── golf_data.json           # 当前数据
│   └── backups/                 # 历史备份
├── .gitignore                   # Git忽略配置
└── README.md                    # 项目说明
```

## 🛠️ 宝塔部署步骤

### 1. 创建GitHub仓库

```bash
# 本地初始化
cd /path/to/your/files
git init
git add .
git commit -m "Initial commit"
git branch -M main

# 推送到GitHub
git remote add origin https://github.com/yourusername/ceibsgolf.git
git push -u origin main
```

### 2. 宝塔面板配置

#### A. 创建网站

1. **宝塔面板 → 网站 → 添加站点**
   - 域名：`www.ceibsgolf.cn`
   - 根目录：`/www/wwwroot/ceibsgolf`
   - PHP版本：7.4或8.0

#### B. 配置Git

1. **网站设置 → Git**
2. **仓库地址**：`https://github.com/yourusername/ceibsgolf.git`
3. **分支**：`main`
4. **目标目录**：`/www/wwwroot/ceibsgolf`
5. **点击"拉取"** → 代码自动部署

#### C. 配置SSL

1. **网站设置 → SSL**
2. **Let's Encrypt → 申请**
3. **强制HTTPS**：开启

#### D. 修改密码（重要！）

```bash
# SSH登录或使用宝塔终端
cd /www/wwwroot/ceibsgolf

# 编辑api.php（第16行）
# 改为强密码
nano api.php

# 编辑index.html（约1583行）
# 搜索 SERVER_CONFIG.password，改为相同密码
nano index.html
```

#### E. 创建数据目录

```bash
cd /www/wwwroot/ceibsgolf
mkdir -p data/backups
chmod 755 data data/backups
chown -R www:www data
```

### 3. 测试部署

访问：
```
https://www.ceibsgolf.cn/api.php?action=info
```

应该看到JSON响应。

## 🔄 日常更新流程

### 方法1：通过宝塔（最简单）

```bash
# 1. 本地修改代码
# 2. 推送到GitHub
git add .
git commit -m "更新内容"
git push

# 3. 宝塔面板
网站 → Git → 点击"拉取" → 完成！
```

### 方法2：自动部署

**设置Webhook（可选）**

1. GitHub仓库 → Settings → Webhooks
2. Payload URL: `https://www.ceibsgolf.cn/webhook.php`
3. 每次push自动触发部署

## ⚙️ 配置要点

### 🔐 密码设置

**GitHub中使用占位符**:

`api.php`:
```php
define('API_PASSWORD', 'CHANGE_ME_IN_PRODUCTION');
```

**服务器上修改为真实密码**:
```php
define('API_PASSWORD', 'CeibsGolf@2024!Secure');
```

### 📁 .gitignore

确保以下内容不提交到GitHub：
- ✅ `data/` 目录
- ✅ `*.json` 数据文件
- ✅ `*.log` 日志文件

### 🔒 目录权限

```bash
# 网站目录
chmod 755 /www/wwwroot/ceibsgolf

# 数据目录
chmod 755 data
chmod 755 data/backups

# 所有者
chown -R www:www /www/wwwroot/ceibsgolf
```

## 🆘 常见问题

### Q: 宝塔Git拉取失败

**A**: 
1. 使用HTTPS地址，不要用SSH
2. 检查分支名是否为`main`
3. 清空目标目录后重新拉取

### Q: API返回401错误

**A**: 
密码不匹配，检查`api.php`和`index.html`中的密码

### Q: 同步失败

**A**: 
1. 检查`data`目录权限
2. 查看`data/access.log`
3. 浏览器控制台查看错误

## 📊 备份

### 自动备份
- 每次保存自动创建历史版本
- 保留30天
- 位置：`data/backups/`

### 手动备份
```bash
cd /www/wwwroot/ceibsgolf/data
cp golf_data.json ~/backup_$(date +%Y%m%d).json
```

## 📞 支持

- **备案号**: 苏ICP备2026013076号
- **网站**: https://www.ceibsgolf.cn

---

## 🎯 快速开始

```bash
# 1. GitHub创建仓库并推送代码
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ceibsgolf.git
git push -u origin main

# 2. 宝塔配置
# 网站 → 添加站点 → Git → 添加仓库 → 拉取

# 3. 修改密码
nano /www/wwwroot/ceibsgolf/api.php
nano /www/wwwroot/ceibsgolf/index.html

# 4. 创建数据目录
mkdir -p /www/wwwroot/ceibsgolf/data/backups
chmod 755 /www/wwwroot/ceibsgolf/data

# 5. 测试
访问 https://www.ceibsgolf.cn/api.php?action=info
```

完成！🎉
