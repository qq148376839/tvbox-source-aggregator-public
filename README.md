# TVBox Source Aggregator

将多个 TVBox 配置源合并成一个稳定的聚合地址。自动测速筛选、站点级去重、Spider JAR 智能分配。

## 功能

- **多源聚合** — 添加多个 TVBox 配置 JSON 地址，自动合并为一个
- **站点去重** — 不同源中的相同站点只保留一份
- **Spider JAR 智能分配** — 自动处理 type:3 站点的 JAR 依赖冲突
- **测速筛选** — 自动过滤不可达或高延迟的源
- **管理后台** — 网页端添加/删除源，触发刷新
- **源健康监控** — 追踪每个源的连续失败次数，及时发现失效接口
- **定时更新** — 自动重新聚合，客户端无感知
- **容错设计** — 聚合失败时保留上次有效缓存

---

## Docker 部署（推荐）

### 1. 创建目录

```bash
mkdir tvbox-aggregator && cd tvbox-aggregator
```

### 2. 下载配置文件

```bash
curl -O https://raw.githubusercontent.com/qq148376839/tvbox-source-aggregator-public/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/qq148376839/tvbox-source-aggregator-public/main/.env.example
cp .env.example .env
```

### 3. 配置环境变量

编辑 `.env`，至少修改 `ADMIN_TOKEN`：

```
ADMIN_TOKEN=你的管理密码
PORT=5678
```

### 4. 启动

```bash
docker compose up -d
```

完成！访问 `http://你的IP:5678/admin` 管理源。

### 常用命令

```bash
docker compose logs -f        # 查看日志
docker compose restart         # 重启
docker compose down            # 停止
docker compose pull && docker compose up -d  # 更新到最新版
```

---

## 使用

### 添加源

打开管理后台 `http://你的地址:5678/admin`，输入密码登录：

- **添加源**：输入 TVBox 配置 JSON URL，点击 Add
- **删除源**：点击源旁边的 Remove
- **刷新**：点击 Refresh 触发一次聚合

### TVBox 配置

将你的聚合地址填入 TVBox 的接口地址：

```
http://你的地址:5678/
```

### 端点说明

| 端点 | 说明 |
|------|------|
| `/` | TVBox 配置 JSON（客户端填这个地址） |
| `/status` | 监控仪表盘（源健康状态、统计数据） |
| `/admin` | 管理后台（密码保护） |
| `/admin/config-editor` | 可视化配置编辑器 |

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ADMIN_TOKEN` | 管理后台密码（必填） | - |
| `PORT` | 服务端口 | `5678` |
| `DATA_DIR` | 数据存储目录 | `./data` |

---

## 镜像信息

- Docker Hub: [`rio22/tvbox-aggregator`](https://hub.docker.com/r/rio22/tvbox-aggregator)
- 支持架构: `amd64` / `arm64` / `armv7`

## License

MIT
