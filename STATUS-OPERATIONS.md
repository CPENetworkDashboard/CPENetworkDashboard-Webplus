# 服务状态监测部署说明

状态页位于 `#/status`。监测任务独立于浏览器运行，结果写入现有 `cpeweb` EdgeKV namespace。浏览器只读取记录，关闭页面不影响采集或历史保存。

## 上线步骤

1. 部署本仓库的 `edge/index.js`，保留现有 `/api/*` 路由和 `cpeweb` namespace。
2. 在 `cpeweb` 的现有 `config` JSON 中增加 `CPE_STATUS_TOKEN`，值为单独生成的长随机令牌。其他字段保持原值。也支持独立 KV key `CPE_STATUS_TOKEN`。该令牌必须单独配置，不复用 `CPE_STATS_TOKEN`。
3. 在 GitHub 仓库的 Actions secrets 中增加同名 `CPE_STATUS_TOKEN`，值与上一步一致。不要放入前端环境变量或提交到 Git。
4. 在默认分支启用 `.github/workflows/status-collector.yml`。默认监测地址为 `https://cpe.plus`，可通过仓库变量 `CPE_STATUS_ORIGIN` 修改。
5. 手动运行一次 **Service availability monitoring**，确认 `GET /api/status/summary?days=30&verify=1` 的 `monitor.runUrl` 对应本次运行。随后验证至少两次 GitHub `schedule` 运行成功，并确认线上摘要的 `monitor.event` 为 `schedule`、最后检查时间持续更新。
6. 构建并部署 `dist/`。用户即可查看已保存的 30/90 天统计，历史从启用采集时开始积累。

## 采集任务

工作流每 5 分钟运行，使用 Node 24，无需安装 npm 依赖。检查官网 HTML、健康接口、版本列表，以及 Android、Windows、macOS 的实际 `POST /api/updates/check` 请求；响应结构、平台、渠道和下载方式均会校验。每轮把待补传记录合并为一个批次、一次写入 KV，避免边缘副本同步期间连续读改写丢失记录。

本地执行 `node scripts/collect-status.mjs --dry-run` 仅检查、不上传。已在环境中设置 `CPE_STATUS_TOKEN` 时，运行 `node scripts/collect-status.mjs` 会上传。只判断服务可用或不可用，不按响应耗时划分等级。单项检查保留 20 秒连接与读取超时，以便在连接异常时结束请求。

GitHub 定时任务可能延迟；公开仓库长期无活动时可能自动停用。页面以 15 分钟为新鲜度阈值，迟到或漏采会显示更新延迟和较低采集覆盖率。因此工作流已移除 `schedule`，只保留手动运行（`workflow_dispatch`）和外部触发（`repository_dispatch`），定时采集由下方 Cloudflare Worker 负责。

## Cloudflare Worker 采集（当前主采集器）

独立仓库 [CPENetworkDashboard/cpe-status-monitor](https://github.com/CPENetworkDashboard/cpe-status-monitor) 由 Cloudflare 连接 Git 自动部署，不需要服务器，也不消耗 GitHub Actions 额度。Cron 在 UTC 第 2、7…57 分钟运行，复用本仓库 `src/utils/status.ts` 的检查规则，结果以 `monitor.source: external` 写入 `POST /api/status/ingest`。上传失败的真实结果暂存在 Workers KV `cpe-status-queue`，下一轮补传；超过 7 天的移到 `expired-recovery`。

- 令牌：Worker → 设置 → **变量和机密**（不是“构建”下的变量）中的密钥 `CPE_STATUS_TOKEN`，与 EdgeKV 一致。
- 排查：Worker → Observability / 问题，查看每轮的 JSON 结果或报错。
- 修改本仓库的检查规则后，需要同步到该仓库的 `src/status.ts`。
- 回退：在 Cloudflare 删除 Cron 触发器，再在本工作流中恢复 `schedule`；已有历史不做清空。

## Linux 服务器采集

安装包内的 `deploy/systemd/` 提供独立服务器方案。需要 Linux、systemd 与系统目录中的 Node 24+。安装器不安装 npm 依赖，不改变网站和 EdgeKV 中已有数据。

```bash
sudo bash scripts/install-status-monitor.sh
sudoedit /etc/cpe-status/collector.env
# 填入现有 EdgeKV 的 CPE_STATUS_TOKEN，保留默认监测域名。
sudo bash scripts/install-status-monitor.sh --enable
```

默认程序目录 `/opt/cpe-status`；安装时可设置 `CPE_INSTALL_DIR` 和 `CPE_NODE`，例如 `sudo CPE_NODE=/usr/local/bin/node bash scripts/install-status-monitor.sh`。Node 与程序均须位于 `/home`、`/root` 之外。更新时重跑安装器即可，配置和历史队列都会保留。

服务使用 systemd 动态用户；令牌文件为 root 所有、权限 0600，队列写入持久目录 `/var/lib/cpe-status/`。每小时第 2、7、12…57 分钟运行；重启后补一次触发。单次失败自动重试，后续周期继续补传。服务在同一时间只执行一个进程，网站不可用时也会保存真实失败结果。

```bash
sudo systemctl list-timers --all cpe-status.timer
sudo systemctl status cpe-status.service cpe-status.timer --no-pager
sudo journalctl -u cpe-status.service --since '1 hour ago' --no-pager
curl -fsS 'https://cpe.plus/api/status/summary?days=30&verify=1'
```

切换验收：先在 GitHub 禁用 **Service availability monitoring**，避免两个采集器同时写入；启动服务器服务后，确认连续两轮检查均保存成功、`monitor.source` 为 `external`、`stale` 为 `false`，并核对历史样本增加。再删除 GitHub 工作流中的 `schedule` 并重新启用该工作流，保留手动检查和外部触发入口。若服务器部署失败，重新启用 GitHub 工作流以保留原有能力；已有历史不做清空。

停用服务器任务时执行 `sudo systemctl disable --now cpe-status.timer`；记录与令牌保留。需要即时采集可执行 `sudo systemctl start cpe-status.service`。

## 数据与接口

| 接口                              | 权限                                       | 用途                                 |
| --------------------------------- | ------------------------------------------ | ------------------------------------ |
| `GET /api/status/summary?days=30` | 公开                                       | 最近 30 天统计与最近 24 小时原始记录 |
| `GET /api/status/summary?days=90` | 公开                                       | 最近 90 天统计与最近 24 小时原始记录 |
| `POST /api/status/ingest`         | `Authorization: Bearer <CPE_STATUS_TOKEN>` | 上传单条报告或最多 2016 条的补传批次 |

服务状态使用一个 `status_v1_store` key，不覆盖现有统计或版本数据：

| key               | 数据                                            |
| ----------------- | ----------------------------------------------- |
| `status_v1_store` | 最近 100 天每日汇总、24 小时明细与 7 天去重槽位 |

记录持久保存，不随浏览器会话删除。每次采集运行将当前报告和待补传记录合并为一个请求，在一次 KV 写入中同时保存每日汇总与原始明细，避免连续读改写受边缘副本同步延迟影响。重试按 5 分钟时间槽去重。补传请求上限为 1.5 MiB、2016 条记录。按北京时间划分日期；API 时间戳使用 ISO 8601 UTC。

整体可用率以六项服务全部可用的轮次除以已采集轮次计算；单项可用率按该服务成功次数除以检查次数计算。采集覆盖率单独计算为已采集轮次与计划时间槽之比。没有数据的时段保持灰色，不算成功；故障记录保留，不由成功请求覆盖。

上传失败时，未上传报告保存在 `.status-reports/pending.json`，工作流通过 Actions cache 在后续运行恢复并补写。补写窗口为 7 天；超过窗口的报告会转存到 `.status-reports/expired-recovery.json`，从待发送队列隔离，避免旧数据持续阻塞新采集，同时保留人工恢复所需的原始记录。请只运行一个主采集任务，避免不同节点在同一时间槽互相竞争。

## 本地验证

Vite 仅在开发模式为 `/api/status/*` 提供与线上函数相同的接口，使用 `.status-data/` 文件作为 EdgeKV 适配器；数据跨页面和 Vite 重启保留。开发令牌位于 `.status-data/monitor-token`，目录已加入 `.gitignore`。

其余 `/api` 请求仍代理现有官网。本地验证检查真实公共服务，但状态报告只写本地文件；生产构建不包含开发适配器或令牌。

测试见 `edge/__tests__/status-history.test.js`，覆盖鉴权、非法输入、去重、跨运行时持久读取、跨日汇总、写入失败重试及 KV 故障状态。

参考：[ESA EdgeKV API](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/edge-storage-api)、[ESA 函数限制](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/what-is-functions-and-pages)、[GitHub 定时工作流](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。
