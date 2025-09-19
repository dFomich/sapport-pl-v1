# Сборка приложения
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .

# Используем системный mvn (а не ./mvnw, чтобы избежать проблем с правами и форматами)
RUN mvn clean package -Pprod -DskipTests

# Финальный образ
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
