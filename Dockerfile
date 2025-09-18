# ===== build =====
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY mvnw ./
COPY .mvn .mvn
COPY pom.xml ./
COPY sonar-project.properties ./  


RUN chmod +x mvnw && ./mvnw -Pprod -DskipTests clean verify

# ===== runtime =====
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar /app/app.jar

ENV JAVA_OPTS="-Djava.security.egd=file:/dev/./urandom"
EXPOSE 8080

CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} $JAVA_OPTS -jar /app/app.jar"]
