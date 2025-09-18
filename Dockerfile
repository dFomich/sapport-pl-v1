# ===== build =====
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Сначала только файлы для кеша зависимостей
COPY mvnw ./
COPY .mvn .mvn
COPY pom.xml .
# прогреем зависимости (без сборки фронта/кода)
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

# Теперь весь проект
COPY src src

# Полная prod-сборка (фронт соберётся через frontend-maven-plugin)
RUN ./mvnw -Pprod -DskipTests clean verify

# ===== runtime =====
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar /app/app.jar

ENV JAVA_OPTS="-Djava.security.egd=file:/dev/./urandom"
EXPOSE 8080

# Render задаёт $PORT — пробрасываем его в Spring
CMD ["sh","-c","java -Dserver.port=${PORT:-8080} $JAVA_OPTS -jar /app/app.jar"]
