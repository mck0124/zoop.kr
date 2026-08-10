package com.zoop.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import com.zoop.backend.controller.FileController;
import com.zoop.backend.service.S3Service;

class FileAccessSecurityTests {

    @Test
    void localDownloadRejectsPathTraversal(@TempDir Path uploadRoot) throws Exception {
        Path outside = uploadRoot.getParent().resolve("outside-secret.txt");
        Files.writeString(outside, "private");

        FileController controller = new FileController();
        ReflectionTestUtils.setField(controller, "uploadDir", uploadRoot.toString());

        var response = controller.downloadFile("../outside-secret.txt");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void localDownloadServesOnlyARegularFileInsideUploadRoot(@TempDir Path uploadRoot) throws Exception {
        Path safeFile = uploadRoot.resolve("safe.pdf");
        Files.writeString(safeFile, "safe content");

        FileController controller = new FileController();
        ReflectionTestUtils.setField(controller, "uploadDir", uploadRoot.toString());

        var response = controller.downloadFile("safe.pdf");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(Files.size(safeFile), response.getHeaders().getContentLength());
    }

    @Test
    void s3DownloadRejectsAnUntrustedBucketUrl() {
        S3Service service = new S3Service(
                "access-key",
                "secret-key",
                "ap-northeast-2",
                "zoop-test-bucket");

        assertThrows(java.io.IOException.class, () -> service.downloadFile(
                "https://attacker-bucket.s3.ap-northeast-2.amazonaws.com/portfolios/file.pdf"));
    }
}
