# Contexto de build: raíz del proyecto (ver docker-compose.yml)
# Imagen de desarrollo: ejecuta el servidor de Vite con HMR.
# En una fase de producción futura, esta imagen se reemplazará por un
# build multi-stage que compila los estáticos y los sirve vía Nginx.
FROM node:22-alpine

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
