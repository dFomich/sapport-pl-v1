# ===== 1. BUILD STAGE =====
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Установим Node и npm вручную (версия как в pom.xml)
ENV NODE_VERSION=22.15.0
ENV NPM_VERSION=11.3.0

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get update && apt-get install -y nodejs && \
    npm install -g npm@$NPM_VERSION

# Копируем всё
COPY . .

# Устанавливаем зависимости и собираем фронтенд вручную
RUN npm ci && npm run webapp:prod

# Собираем бэкенд (уже без npm)
RUN chmod +x mvnw && ./mvnw -Pprod -DskipTests -Dskip.npm=true clean verify

# ===== 2. RUNTIME STAGE =====
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/*.jar /app/app.jar

ENV JAVA_OPTS="-Djava.security.egd=file:/dev/./urandom"
EXPOSE 8080

CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} $JAVA_OPTS -jar /app/app.jar"]
