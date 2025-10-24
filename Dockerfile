# 使用 Node.js v22.12.0 Alpine 作为基础镜像
FROM node:22.12.0-alpine

LABEL authors="cg8-5712"
LABEL version="1.5.0"

# 设置工作目录
WORKDIR /app

# 将 package.json 和 package-lock.json 复制到容器中
COPY package*.json ./

# 使用 npm ci 进行干净安装 (仅生产依赖)
RUN npm ci --only=production

# 将项目文件复制到容器中的工作目录
COPY . .

# 设置环境变量
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# 暴露应用的端口
EXPOSE 3000

# 启动 Express 应用
CMD ["npm", "start"]
