package com.zoop.backend.controller;

import com.zoop.backend.domain.dto.PostingRequestDto;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.service.PostService;
import com.zoop.backend.util.JwtUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@Tag(name = "RecruitPostingController", description = "채용 공고 관련 API")
@RestController
@RequestMapping("/api/postings")
@RequiredArgsConstructor
public class RecruitPostingController {

    private final PostService postService;
    private final JwtUtil jwtUtil; // ✅ 추가됨

    @Operation(summary = "새 채용 공고 생성", description = "인증된 사용자가 새로운 채용 공고를 등록합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode = "200", description = "채용 공고 등록 성공 및 생성된 공고의 ID 반환",
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (필수 데이터 누락, 형식 오류 등)"),
        @ApiResponse(responseCode = "401", description = "인증 실패 (유효하지 않거나 누락된 JWT)"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping
    public ResponseEntity<Map<String, Object>> createPost(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "새 채용 공고 생성을 위한 정보",
            required = true,
            content=@Content(schema = @Schema(implementation = PostingRequestDto.class))
        )
        @RequestBody PostingRequestDto dto,
        @Parameter(description = "JWT 인증 토큰(Bearer prefix 포함)", required = true, example = "Bearer eyJhbGZci0i...")
        @RequestHeader("Authorization") String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "유효한 인증 토큰이 필요합니다."));
        }

        String token = authHeader.substring("Bearer ".length()).trim();
        if (!jwtUtil.isTokenValid(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "인증 토큰이 유효하지 않거나 만료되었습니다."));
        }

        try {
            String loginId = jwtUtil.getLoginIdFromToken(token);
            Post post = postService.createPost(dto, loginId);
            return ResponseEntity.ok(Map.of("postId", post.getPostId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "공고 정보가 올바르지 않습니다."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body(Map.of("error", "공고 등록 중 오류가 발생했습니다."));
        }
    }

    @Operation(summary = "회사별 공고 목록 조회", description = "특정 회사의 모든 공고 목록을 조회합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode = "200", description = "공고 목록 반환",
            content = @Content(schema = @Schema(implementation = Post.class))),
        @ApiResponse(responseCode = "404", description = "해당 회사의 공고를 찾을 수 없음"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping
    public ResponseEntity<List<Post>> getPostsByCompany(
        @Parameter(description = "조회할 회사의 ID", required = true, example = "1")
        @RequestParam Long companyId
    ) {
        List<Post> posts = postService.getPostsByCompanyId(companyId);
        return ResponseEntity.ok(posts);
    }

    @Operation(summary = "모든 공고 목록 조회", description = "시스템의 모든 공고 목록을 조회합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode = "200", description = "공고 목록 반환",
            content = @Content(schema = @Schema(implementation = Post.class))),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/all")
    public ResponseEntity<List<Post>> getAllPosts() {
        List<Post> posts = postService.getAllPosts();
        System.out.println("=== 전체 공고 조회 결과 ===");
        System.out.println("총 공고 수: " + posts.size());
        for (Post post : posts) {
            System.out.println("공고 ID: " + post.getPostId() + ", 제목: " + post.getPostTitle() + 
                             ", 상태: " + post.getPostStatus() + ", 마감일: " + post.getPostExpiryDate());
        }
        System.out.println("========================");
        return ResponseEntity.ok(posts);
    }

    @Operation(summary = "현재 로그인한 회사의 공고 목록 조회", description = "JWT 토큰을 통해 현재 로그인한 회사의 모든 공고 목록을 조회합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode = "200", description = "회사 공고 목록 반환",
            content = @Content(schema = @Schema(implementation = Post.class))),
        @ApiResponse(responseCode = "401", description = "인증 실패"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/company")
    public ResponseEntity<List<Post>> getPostsByCurrentCompany(
        @Parameter(description = "JWT 인증 토큰(Bearer prefix 포함)", required = true)
        @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String loginId = jwtUtil.getLoginIdFromToken(token);
            List<Post> posts = postService.getPostsByCompanyAdmin(loginId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            System.err.println("JWT 인증 실패: " + e.getMessage());
            return ResponseEntity.status(401).build();
        }
    }

    @Operation(summary = "공개 공고 목록 조회", description = "공개용으로 사용할 수 있는 모든 공고 목록을 조회합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode = "200", description = "공개 공고 목록 반환",
            content = @Content(schema = @Schema(implementation = Post.class))),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/public")
    public ResponseEntity<List<Post>> getPublicPosts() {
        List<Post> posts = postService.getPublicPosts();
        System.out.println("=== 공개 공고 조회 결과 ===");
        System.out.println("총 공고 수: " + posts.size());
        for (Post post : posts) {
            System.out.println("공고 ID: " + post.getPostId() + ", 제목: " + post.getPostTitle() + 
                             ", 상태: " + post.getPostStatus() + ", 마감일: " + post.getPostExpiryDate());
        }
        System.out.println("========================");
        return ResponseEntity.ok(posts);
    }

    @Operation(summary = "공고 정보 조회", description = "특정 공고의 기본 정보를 조회합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode = "200", description = "공고 정보 반환",
            content = @Content(schema = @Schema(implementation = Post.class))),
        @ApiResponse(responseCode = "404", description = "해당 공고를 찾을 수 없음"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/info/{postId}")
    public ResponseEntity<Post> getPostInfo(
        @Parameter(description = "조회할 공고의 ID", required = true, example = "1")
        @PathVariable Long postId
    ) {
        Post post = postService.getPostById(postId);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(post);
    }

    @Operation(summary = "만료된 공고 목록 조회", description = "만료일이 지난 공고들을 조회합니다.")
    @GetMapping("/expired")
    public ResponseEntity<List<Post>> getExpiredPosts() {
        List<Post> expiredPosts = postService.getExpiredPosts();
        System.out.println("=== 만료된 공고 조회 결과 ===");
        System.out.println("만료된 공고 수: " + expiredPosts.size());
        for (Post post : expiredPosts) {
            System.out.println("공고 ID: " + post.getPostId() + ", 제목: " + post.getPostTitle() + 
                             ", 상태: " + post.getPostStatus() + ", 만료일: " + post.getPostExpiryDate());
        }
        System.out.println("========================");
        return ResponseEntity.ok(expiredPosts);
    }

    @Operation(summary = "만료된 공고 상태 업데이트", description = "만료일이 지난 공고들을 INACTIVE 상태로 업데이트합니다.")
    @PostMapping("/update-expired")
    public ResponseEntity<Map<String, Object>> updateExpiredPosts() {
        int updatedCount = postService.updateExpiredPosts();
        return ResponseEntity.ok(Map.of(
            "message", "만료된 공고 상태 업데이트 완료",
            "updatedCount", updatedCount
        ));
    }

    @Operation(summary = "공고 정보 업데이트", description = "기존 공고의 정보를 업데이트합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode = "200", description = "공고 업데이트 성공",
            content = @Content(schema = @Schema(implementation = Post.class))),
        @ApiResponse(responseCode = "404", description = "해당 공고를 찾을 수 없음"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PutMapping("/{postId}")
    public ResponseEntity<Post> updatePost(
        @Parameter(description = "업데이트할 공고의 ID", required = true, example = "1")
        @PathVariable Long postId,
        @RequestBody PostingRequestDto dto
    ) {
        try {
            Post updatedPost = postService.updatePost(postId, dto);
            return ResponseEntity.ok(updatedPost);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "인재상 저장", description = "특정 공고에 인재상을 저장합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode = "200", description = "인재상 저장 성공",
            content = @Content(schema = @Schema(implementation = Post.class))),
        @ApiResponse(responseCode = "404", description = "해당 공고를 찾을 수 없음"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PutMapping("/{postId}/ideal-candidate")
    public ResponseEntity<Post> updateIdealCandidate(
        @Parameter(description = "인재상을 저장할 공고의 ID", required = true, example = "1")
        @PathVariable Long postId,
        @RequestBody Map<String, String> request
    ) {
        try {
            String idealCandidate = request.get("idealCandidate");
            if (idealCandidate == null) {
                return ResponseEntity.badRequest().build();
            }
            Post updatedPost = postService.updateIdealCandidate(postId, idealCandidate);
            return ResponseEntity.ok(updatedPost);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
