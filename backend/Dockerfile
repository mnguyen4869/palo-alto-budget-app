FROM postgres:17.6-alpine3.22

# Set environment variables for PostgreSQL
ENV POSTGRES_USER=myuser
ENV POSTGRES_PASSWORD=mypassword
ENV POSTGRES_DB=mydatabase

# Copy the initialization script into the entrypoint directory
# This script will be executed when the container starts for the first time
COPY init.sql /docker-entrypoint-initdb.d/
