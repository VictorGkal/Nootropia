FROM node:22-alpine

#123

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]