# --- build ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Camada de dependências: cacheada enquanto o pom não muda.
COPY pom.xml .
RUN mvn -q -e -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests clean package

# --- runtime ---
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
# curl para o healthcheck do compose.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
# Usuário sem privilégios.
RUN useradd --system --uid 1001 spring
# Diretório de mídia com dono correto: o volume nomeado herda esta permissão,
# permitindo que o processo (não-root) grave os uploads.
RUN mkdir -p /data/media && chown -R spring /data/media
COPY --from=build /app/target/vpertz-backend.jar app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
