FROM mongo:7.0.17

RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bullseye/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-mongosh

COPY ../resources/import_distances.sh /docker-entrypoint-initdb.d/import_distances.sh
RUN chmod +x /docker-entrypoint-initdb.d/import_distances.sh


EXPOSE 27017