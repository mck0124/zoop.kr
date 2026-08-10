package com.zoop.backend.service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.core.ResponseInputStream;

@Service
public class S3Service {

    private final S3Client s3Client;
    private final String bucket;
    private final String region;

    public S3Service(
        @Value("${cloud.aws.credentials.access-key}") String accessKey,
        @Value("${cloud.aws.credentials.secret-key}") String secretKey,
        @Value("${cloud.aws.region.static}") String region,
        @Value("${cloud.aws.s3.bucket}") String bucket
    ) {
        this.bucket = bucket;
        this.region = region;
        this.s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                    )
                )
                .build();
    }

    public String uploadPortfolioFile(MultipartFile file) throws IOException {
        String key = "portfolios/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        System.out.println("[S3Service] S3 업로드 시도: bucket=" + bucket + ", key=" + key + ", fileName=" + file.getOriginalFilename());
        try {
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build(),
                software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes())
            );
            System.out.println("[S3Service] S3 업로드 성공: " + key);
        } catch (Exception e) {
            System.err.println("[S3Service] S3 업로드 실패: " + e.getMessage());
            throw e;
        }
        
        // region을 포함한 올바른 S3 URL 생성
        String url = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
        System.out.println("[S3Service] S3 업로드 URL: " + url);
        System.out.println("[S3Service] 파일 크기: " + file.getSize() + " bytes");
        System.out.println("[S3Service] 파일 타입: " + file.getContentType());
        System.out.println("[S3Service] 파일명: " + file.getOriginalFilename());
        System.out.println("[S3Service] S3 키: " + key);
        return url;
    }

    public String uploadInterviewVideoFile(MultipartFile file) throws IOException {
        String key = "videos/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        System.out.println("[S3Service] S3 업로드 시도: bucket=" + bucket + ", key=" + key + ", fileName=" + file.getOriginalFilename());
        try {
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build(),
                software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes())
            );
            System.out.println("[S3Service] S3 업로드 성공: " + key);
        } catch (Exception e) {
            System.err.println("[S3Service] S3 업로드 실패: " + e.getMessage());
            throw e;
        }
        String url = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
        System.out.println("[S3Service] S3 업로드 URL: " + url);
        System.out.println("[S3Service] 파일 크기: " + file.getSize() + " bytes");
        System.out.println("[S3Service] 파일 타입: " + file.getContentType());
        System.out.println("[S3Service] 파일명: " + file.getOriginalFilename());
        System.out.println("[S3Service] S3 키: " + key);
        return url;
    }

    /**지훈 추가 
     * 파일 다운로드 메서드
     * @param s3Url S3 URL
     * @return ResponseInputStream<GetObjectResponse>
     * @throws IOException
    */
    public ResponseInputStream<GetObjectResponse> downloadFile(String s3Url) throws IOException {
        URI uri;
        try {
            uri = new URI(s3Url);
        } catch (URISyntaxException | NullPointerException e) {
            throw new IOException("Invalid S3 URL", e);
        }
        String expectedHost = bucket + ".s3." + region + ".amazonaws.com";
        if (!"https".equalsIgnoreCase(uri.getScheme()) || !expectedHost.equalsIgnoreCase(uri.getHost())) {
            throw new IOException("S3 URL is outside the configured bucket");
        }
        String key = uri.getPath() == null ? "" : uri.getPath().replaceFirst("^/", "");
        if (key.isBlank() || !(key.startsWith("portfolios/") || key.startsWith("videos/"))) {
            throw new IOException("S3 object key is not an allowed ZOOP upload");
        }
        
        System.out.println("[S3Service] S3 다운로드 시도: bucket=" + this.bucket + ", key=" + key);
        
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(this.bucket)
                .key(key)
                .build();
            
            ResponseInputStream<GetObjectResponse> response = s3Client.getObject(getObjectRequest);
            System.out.println("[S3Service] S3 다운로드 성공: " + key);
            return response;
        } catch (Exception e) {
            System.err.println("[S3Service] S3 다운로드 실패: " + e.getMessage());
            throw e;
        }
    }
}
