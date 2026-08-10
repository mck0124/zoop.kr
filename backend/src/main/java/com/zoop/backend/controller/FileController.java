package com.zoop.backend.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zoop.backend.service.S3Service;

import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

@Slf4j
@RestController
@RequestMapping("/api/files")
public class FileController {

    @Value("${file.upload-dir}")
    private String uploadDir;
    
    @Autowired
    private S3Service s3Service;

    @GetMapping("/download/{filename}")
    public ResponseEntity<InputStreamResource> downloadFile(@PathVariable String filename) throws IOException {
        Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path requestedFile = uploadRoot.resolve(filename).normalize();
        if (!requestedFile.startsWith(uploadRoot) || !Files.isRegularFile(requestedFile)) {
            log.warn("Rejected file download outside upload directory: {}", filename);
            log.info("파일이 전달되지 않았습니다." );
            return ResponseEntity.notFound().build();
        }

        File file = requestedFile.toFile();
        log.info("Serving file {} from upload directory", requestedFile.getFileName());
        InputStreamResource resource = new InputStreamResource(Files.newInputStream(requestedFile));

        return ResponseEntity.ok()
            // 파일을 다운로드 하지 않고 브라우저에서 바로 띄우는 코드
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(file.length())
            .body(resource);
    }
    
    @GetMapping("/s3/download")
    public ResponseEntity<InputStreamResource> downloadS3File(@RequestParam String s3Url) throws IOException {
        try {
            log.info("S3 파일 다운로드 시도: {}", s3Url);
            
            ResponseInputStream<GetObjectResponse> s3Response = s3Service.downloadFile(s3Url);
            
            // 파일명 추출
            String fileName = s3Url.substring(s3Url.lastIndexOf("/") + 1);
            
            // 한글 파일명을 URL 인코딩
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8);
            
            // Content-Type 결정
            MediaType contentType = MediaType.APPLICATION_PDF; // 기본값
            if (fileName.toLowerCase().endsWith(".mp4")) {
                contentType = MediaType.valueOf("video/mp4");
            } else if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) {
                contentType = MediaType.IMAGE_JPEG;
            } else if (fileName.toLowerCase().endsWith(".png")) {
                contentType = MediaType.IMAGE_PNG;
            }
            
            InputStreamResource resource = new InputStreamResource(s3Response);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName)
                .contentType(contentType)
                .body(resource);
                
        } catch (Exception e) {
            log.error("S3 파일 다운로드 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
