# syntax=docker/dockerfile:1

FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline
COPY src src
RUN ./mvnw -q -DskipTests package

# LibreOffice + OCR need a glibc image (not Alpine).
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN apt-get update \
	&& DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
		curl \
		libreoffice-writer \
		libreoffice-calc \
		libreoffice-draw \
		libreoffice-java-common \
		imagemagick \
		libheif1 \
		ocrmypdf \
		tesseract-ocr \
		tesseract-ocr-eng \
		fonts-liberation \
		fonts-dejavu-core \
	&& rm -rf /var/lib/apt/lists/* \
	&& useradd -ms /bin/bash pdfumi
COPY --from=build /workspace/target/pdfumi-api-*.jar /app/app.jar
ENV HOME=/home/pdfumi
ENV PDFUMI_SOFFICE_PATH=/usr/bin/soffice
ENV PDFUMI_OCRMYPDF_PATH=/usr/bin/ocrmypdf
USER pdfumi
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75.0","-jar","/app/app.jar"]
