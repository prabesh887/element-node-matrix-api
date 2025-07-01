# Docker Commands

`docker build -t email-3pid-api .`
`docker run -d -p 3300:3300 --env-file .env --name email-3pid-api email-3pid-api`
`sudo docker network connect matrix-postgres email-3pid-api`
