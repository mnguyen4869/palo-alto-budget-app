docker pull postgres:17.6-alpine3.22
docker build -t psql-budget-img .
docker run --name psql-budget-server -p 5432:5432 psql-budget-img
