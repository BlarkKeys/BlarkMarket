FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

COPY src ./src
COPY public ./public

RUN javac src/App.java

ENV PORT=4173
EXPOSE 4173

CMD ["java", "-cp", "src", "App"]
