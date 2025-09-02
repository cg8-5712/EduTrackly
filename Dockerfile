# 使用 Node.js v22.12.0 作为基础镜像
FROM node:22.12.0

LABEL authors="cg8-5712"

# 设置工作目录
WORKDIR /app

# 将 package.json 和 package-lock.json 复制到容器中
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 将项目文件复制到容器中的工作目录
COPY . .

# 暴露应用的端口
EXPOSE 3000

# 启动 Express 应用
CMD ["npm", "start"]
