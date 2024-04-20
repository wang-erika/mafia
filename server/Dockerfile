FROM library/node:18-alpine as esbuild
WORKDIR /home/node/app
COPY *.js* ./
COPY *.ts* ./
COPY . .
RUN npm i
RUN ls -al && npm run build 

FROM library/node:18-alpine as node
COPY --from=esbuild /home/node/app/dist/ /home/node/app/dist/
WORKDIR /home/node/app
ENTRYPOINT [ "node", "dist/server.js" ]
EXPOSE 8131