好！按你选的**方案 A（GitHub Actions + SSH/rsync 部署）**，下面给你一套可直接照抄的“最小可用”配置 + 进阶优化 + 排错清单。跟着一步步做即可把“本地 → GitHub → 服务器”的自动发布跑起来。

------

# 一、一次性准备

## 1) 推送代码到 GitHub

```bash
# 本地
git init
git remote add origin git@github.com:<你的用户名>/<你的仓库>.git
echo -e "node_modules/\npublic/\n_site/\ndist/\n.cache/\n.DS_Store" >> .gitignore
git add .
git commit -m "init blog"
git branch -M main
git push -u origin main
```

## 2) 服务器创建部署用户与目录

```bash
# 在服务器（root 或可 sudo 的用户）
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/blog
sudo chown -R deploy:deploy /var/www/blog
sudo apt-get update && sudo apt-get install -y git rsync
```

## 3) 生成专用 SSH 密钥并配置到 GitHub Secrets

在本地或任一安全环境生成**仅用于 CI 的密钥**：

```bash
ssh-keygen -t ed25519 -C "gh-actions-deploy" -f ~/.ssh/gh-actions-blog
```

- 把**公钥**内容（`~/.ssh/gh-actions-blog.pub`）追加到服务器 `deploy` 用户：

  ```bash
  # 在服务器
  sudo -u deploy bash -c 'mkdir -p ~/.ssh && chmod 700 ~/.ssh'
  echo "<公钥内容>" | sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys
  sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
  ```

- 把**私钥**内容保存到 GitHub 仓库 → Settings → Secrets and variables → Actions：

  - `SSH_PRIVATE_KEY`：私钥全文
  - `SSH_HOST`：服务器域名或 IP（如 `your.server.com`）
  - `SSH_PORT`：SSH 端口（默认 `22`）
  - `SSH_USER`：`deploy`
  - `TARGET_DIR`：`/var/www/blog`

> 可选（更安全）：把 `/home/deploy/.ssh/authorized_keys` 中这一行公钥前加限制参数：
>  `command="/usr/bin/rrsync /var/www/blog",no-agent-forwarding,no-port-forwarding,no-pty,no-X11-forwarding `
>  并安装 `rrsync`（rsync 限定版，Debian/Ubuntu 的 `rsync` 包包含脚本），这样此钥只能同步目标目录。

------

# 二、添加 GitHub Actions（自动构建并部署）

在仓库新建文件：`.github/workflows/deploy.yml`

## A. 你的仓库需要构建（Hexo / Hugo / Jekyll / 前端框架）

```yaml
name: Build & Deploy Blog

on:
  push:
    branches: ["main"]
  workflow_dispatch:

env:
  SSH_HOST: ${{ secrets.SSH_HOST }}
  SSH_USER: ${{ secrets.SSH_USER }}
  SSH_PORT: ${{ secrets.SSH_PORT }}
  TARGET_DIR: ${{ secrets.TARGET_DIR }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 缓存（Node 项目常用）
      - name: Detect package manager
        id: pm
        run: |
          if [ -f pnpm-lock.yaml ]; then echo "pm=pnpm" >> $GITHUB_OUTPUT
          elif [ -f yarn.lock ]; then echo "pm=yarn" >> $GITHUB_OUTPUT
          elif [ -f package-lock.json ]; then echo "pm=npm" >> $GITHUB_OUTPUT
          else echo "pm=" >> $GITHUB_OUTPUT; fi

      - name: Setup Node (if Node project)
        if: ${{ steps.pm.outputs.pm != '' }}
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: ${{ steps.pm.outputs.pm }}

      - name: Install & Build
        run: |
          set -e
          OUT_DIR=""
          if [ -f package.json ]; then
            # 你需要在 package.json 里准备 "build" 脚本（如：hexo generate / next build & export）
            if command -v pnpm >/dev/null 2>&1; then pnpm i --frozen-lockfile && pnpm run build; OUT_DIR="out"; fi
            if [ -z "$OUT_DIR" ] && command -v yarn >/dev/null 2>&1; then yarn --frozen-lockfile && yarn build; OUT_DIR="out"; fi
            if [ -z "$OUT_DIR" ]; then npm ci && npm run build; OUT_DIR="out"; fi
            # 常见静态目录回退（按你的框架改：Hexo/Hugo 多为 public；Jekyll 为 _site）
            for d in out public dist _site build; do [ -d "$d" ] && OUT_DIR="$d" && break; done
          elif [ -f hugo.toml ] || [ -f config.toml ]; then
            sudo apt-get update && sudo apt-get install -y hugo
            hugo --minify
            OUT_DIR="public"
          elif [ -f _config.yml ]; then
            sudo apt-get update && sudo apt-get install -y ruby-full build-essential zlib1g-dev
            gem install bundler jekyll
            bundle install
            bundle exec jekyll build
            OUT_DIR="_site"
          fi
          if [ -z "$OUT_DIR" ]; then echo "Cannot detect output dir, set it manually"; exit 1; fi
          echo "OUT_DIR=$OUT_DIR" >> $GITHUB_ENV

      - name: Prepare SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -p "$SSH_PORT" "$SSH_HOST" >> ~/.ssh/known_hosts

      - name: Rsync to server
        run: |
          rsync -az --delete \
            --exclude '.git*' \
            "${{ env.OUT_DIR }}/" "${SSH_USER}@${SSH_HOST}:${TARGET_DIR}"
```

## B. 你的仓库已是最终静态文件（无需构建）

```yaml
name: Deploy Static Blog

on:
  push:
    branches: ["main"]
  workflow_dispatch:

env:
  SSH_HOST: ${{ secrets.SSH_HOST }}
  SSH_USER: ${{ secrets.SSH_USER }}
  SSH_PORT: ${{ secrets.SSH_PORT }}
  TARGET_DIR: ${{ secrets.TARGET_DIR }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Prepare SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -p "$SSH_PORT" "$SSH_HOST" >> ~/.ssh/known_hosts

      - name: Rsync to server
        run: |
          rsync -az --delete --exclude '.git*' ./ "${SSH_USER}@${SSH_HOST}:${TARGET_DIR}"
```

------

# 三、让网站指向发布目录

以 Nginx 为例（根指向 `/var/www/blog`）：

```nginx
server {
    listen 80;
    server_name your.domain.com;
    root /var/www/blog;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
```

修改后执行：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

------

# 四、上线前自检（强烈推荐）

1. **本地到服务器“空跑”**（不会改动，只打印将同步内容）：

   ```bash
   rsync -azvn --delete ./build_or_public/ deploy@your.server.com:/var/www/blog
   ```

2. **Actions 手动触发**：GitHub → Actions → 选你的工作流 → Run workflow。

3. **检查权限**：`/var/www/blog` 归属应为 `deploy:deploy`，`authorized_keys` 权限 600、`.ssh` 目录 700。

4. **查看服务器 Nginx 日志**：`/var/log/nginx/access.log` 与 `error.log`。

------

# 五、常见问题速查

- **Permission denied (publickey)**
   公钥未正确写入 `/home/deploy/.ssh/authorized_keys`；或文件/目录权限不对；或 Secrets 的私钥不是那把对应的私钥。
- **Host key verification failed**
   Actions 里少了 `ssh-keyscan`；或你更换了服务器导致 known_hosts 旧指纹不匹配。
- **rsync not found**
   服务器安装：`sudo apt-get install -y rsync`。
- **构建目录不对**
   把 `OUT_DIR` 改为你的真实输出（Hexo/Hugo：`public/`；Jekyll：`_site/`；许多前端静态导出：`out/` 或 `dist/`）。
- **静态路由 404（前端路由 SPA）**
   Nginx 里 `location /` 用 `try_files $uri /index.html;`，而不是 `=404`。

------

# 六、进阶优化（可选）

- **蓝绿发布（零停机）**
   同步到 `/var/www/blog_releases/<commit>`，再把 `/var/www/blog` 指向该目录的符号链接；切换只需原子性 `ln -sfn`，并保留 N 个历史版本用于回滚。
- **更快的 Actions**
   使用缓存（上面的 `actions/setup-node@v4` 已启用包缓存），或把构建产物缓存为 artifact（对特别大的站点有帮助）。
- **只同步改变的文件**
   rsync 天然增量；如想进一步减少删除操作，去掉 `--delete`，或精细化 `--exclude`（比如排除上传目录）。

------

如果你告诉我具体框架（Hexo/Hugo/Jekyll/Next 等）和你的域名/端口是否自定义，我可以把上面 YAML 与 Nginx 配置替你精确到行，包含蓝绿发布与回滚脚本版本。