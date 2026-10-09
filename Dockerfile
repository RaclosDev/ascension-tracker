# Etapa 1: Build del Frontend (React + Vite)
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

ARG GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

# Instalamos dependencias primero (mejor uso del caché de Docker)
COPY frontend/package*.json ./
RUN npm ci

# Copiamos el código fuente del frontend y compilamos
COPY frontend/ ./
RUN npm run build
# El resultado queda en /app/frontend/dist

# Etapa 2: Build del Backend (Spring Boot + Maven)
FROM maven:3.9.6-eclipse-temurin-17 AS backend-build
WORKDIR /app

# Copiamos el pom.xml y descargamos dependencias (caché)
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copiamos fuentes Java
COPY backend/src ./src

# Copiamos el frontend compilado a los recursos estáticos de Spring Boot
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static

# Compilamos el backend y extraemos las capas (Layered Jars) para optimizar Docker Cache
RUN mvn clean package -DskipTests
RUN java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

# Etapa 3: Imagen de producción (JRE mínimo Alpine)
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Copiamos las capas en orden inverso de frecuencia de cambio
COPY --from=backend-build /app/target/extracted/dependencies/ ./
COPY --from=backend-build /app/target/extracted/spring-boot-loader/ ./
COPY --from=backend-build /app/target/extracted/snapshot-dependencies/ ./
COPY --from=backend-build /app/target/extracted/application/ ./

EXPOSE 8080

ENV TZ=Europe/Madrid
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apk del tzdata

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

ENV SPRING_PROFILES_ACTIVE=prod

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q -O - http://localhost:8080/api/auth/config || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "org.springframework.boot.loader.launch.JarLauncher"]
