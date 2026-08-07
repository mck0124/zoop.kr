package com.zoop.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zoop.backend.domain.entity.Company;
import com.zoop.backend.domain.entity.CompanyAdmin;
import com.zoop.backend.domain.dto.CompanyNotificationSettingsDto;
import com.zoop.backend.service.CompanyAdminService;
import com.zoop.backend.service.CompanyNotificationSettingsService;
import com.zoop.backend.util.JwtUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name="CompanyAdminController", description="회사 관리자 관련 API")
@RestController
@RequestMapping("/api/companyadmins")
public class CompanyAdminController {

    private final CompanyAdminService adminService;
    private final CompanyNotificationSettingsService notificationSettingsService;
    private final JwtUtil jwtUtil;

    public CompanyAdminController(CompanyAdminService adminService, CompanyNotificationSettingsService notificationSettingsService, JwtUtil jwtUtil) {
        this.adminService = adminService;
        this.notificationSettingsService = notificationSettingsService;
        this.jwtUtil = jwtUtil;
    }

    @Operation(summary="회사 관리자 등록", description="새로운 회사 관리자 정보를 등록합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode="200", description="관리자 등록 성공 및 등록된 관리자 정보 반환",
            content=@Content(schema=@Schema(implementation=String.class)))
    })
    @PostMapping
    public ResponseEntity<CompanyAdmin> register(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description="등록할 회사 관리자 정보 (회사 ID 포함)",
            required=true,
            content=@Content(schema=@Schema(implementation=CompanyAdmin.class))
        )    
        @RequestBody CompanyAdmin admin) {
        System.out.println("✅ 컨트롤러 도착");
        if (admin.getCompany() == null || admin.getCompany().getCompanyId() == null) {
            return ResponseEntity.badRequest().build();
        }
        CompanyAdmin saved = adminService.registerAdmin(admin.getCompany().getCompanyId(), admin);
        return ResponseEntity.ok(saved);
    }

    @Operation(summary="로그인 아이디 중복 확인", description="입력된 로그인 아이디의 사용 가능 여부를 확인합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode="200", description="아이디 사용 가능 또는 중복 여부 메시지 반환",
            content=@Content(schema=@Schema(implementation=String.class)))
    })
    @GetMapping("/check-id")
    public ResponseEntity<String> checkLoginIdDuplicate(
            @Parameter(description="중복 확인 할 로그인 아이디", required=true, example="new_admin_id")
            @RequestParam String loginId) {
        boolean exists = adminService.isLoginIdDuplicate(loginId);
        return exists
            ? ResponseEntity.ok("이미 사용 중인 아이디입니다.")
            : ResponseEntity.ok("사용 가능한 아이디입니다.");
    }

    @Operation(summary = "관리자 ID로 회사 정보 조회", description = "관리자 ID를 통해 해당 관리자가 속한 회사의 정보를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "회사 정보 반환",
            content=@Content(schema = @Schema(implementation = Map.class))),
        
        @ApiResponse(responseCode="404", description="관리자를 찾을 수 없음"), // 404 응답 추가 (필요시)
        @ApiResponse(responseCode="500", description="서버 오류") // 500 응답 추가 (필요시)
    })
    @GetMapping("/info/{adminId}")
    public ResponseEntity<?> getCompanyInfoByAdminId(
        @Parameter(description = "조회할 회사 관리자의 ID", required = true, example = "123")
        @PathVariable Long adminId) {
        try {
            CompanyAdmin admin = adminService.getAdminById(adminId);
            
            Company company = admin.getCompany();
            
            if (company == null) {
                return ResponseEntity.status(404).body(Map.of("error", "회사 정보를 찾을 수 없습니다."));
            }

            return ResponseEntity.ok(Map.of(
                "companyId", company.getCompanyId(),
                "companyAdminId", admin.getCompanyAdminId(),
                "companyName", company.getCompanyName() != null ? company.getCompanyName() : "",
                "businessNumber", company.getBusinessNumber() != null ? company.getBusinessNumber() : "",
                "address", company.getCompanyAddress() != null ? company.getCompanyAddress() : "",
                "ceoName", company.getCeoName() != null ? company.getCeoName() : "",
                "adminName", admin.getName() != null ? admin.getName() : "",
                "email", admin.getEmail() != null ? admin.getEmail() : "",
                "companyAdminLogin", admin.getLoginId() != null ? admin.getLoginId() : ""
            ));
        } catch (Exception e) {
            System.out.println("❌ [에러 발생] " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "서버 오류: " + e.getMessage()));
        }
    }

    @Operation(summary="알림 설정 조회", description="회사 관리자의 알림 설정을 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode="200", description="알림 설정 조회 성공",
            content=@Content(schema=@Schema(implementation=CompanyNotificationSettingsDto.class))),
        @ApiResponse(responseCode="404", description="관리자를 찾을 수 없음"),
        @ApiResponse(responseCode="500", description="서버 오류")
    })
    @GetMapping("/notification-settings")
    public ResponseEntity<CompanyNotificationSettingsDto> getNotificationSettings(
        @Parameter(description="JWT 인증 토큰(Bearer prefix 포함)", required=true)
        @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String loginId = jwtUtil.getLoginIdFromToken(token);
            CompanyAdmin admin = adminService.getAdminByLoginId(loginId);
            
            if (admin == null) {
                return ResponseEntity.notFound().build();
            }
            
            CompanyNotificationSettingsDto settings = notificationSettingsService.getNotificationSettings(admin.getCompanyAdminId());
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @Operation(summary="알림 설정 저장", description="회사 관리자의 알림 설정을 저장합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode="200", description="알림 설정 저장 성공",
            content=@Content(schema=@Schema(implementation=CompanyNotificationSettingsDto.class))),
        @ApiResponse(responseCode="400", description="잘못된 요청"),
        @ApiResponse(responseCode="500", description="서버 오류")
    })
    @PostMapping("/notification-settings")
    public ResponseEntity<CompanyNotificationSettingsDto> saveNotificationSettings(
        @Parameter(description="JWT 인증 토큰(Bearer prefix 포함)", required=true)
        @RequestHeader("Authorization") String authHeader,
        @RequestBody Map<String, Boolean> settings) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String loginId = jwtUtil.getLoginIdFromToken(token);
            CompanyAdmin admin = adminService.getAdminByLoginId(loginId);
            
            if (admin == null) {
                return ResponseEntity.notFound().build();
            }
            
            CompanyNotificationSettingsDto savedSettings = notificationSettingsService.saveNotificationSettings(admin.getCompanyAdminId(), settings);
            return ResponseEntity.ok(savedSettings);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @Operation(summary="관리자 정보 수정", description="기존 관리자 정보를 수정합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode="200", description="관리자 정보 수정 성공",
            content=@Content(schema=@Schema(implementation=CompanyAdmin.class))),
        @ApiResponse(responseCode="404", description="관리자를 찾을 수 없음"),
        @ApiResponse(responseCode="400", description="잘못된 요청")
    })
    @PutMapping("/{adminId}")
    public ResponseEntity<?> updateAdmin(
        @Parameter(description="수정할 관리자의 ID", required=true, example="1")
        @PathVariable Long adminId,
        @RequestBody CompanyAdmin adminUpdate) {
        try {
            CompanyAdmin updatedAdmin = adminService.updateAdmin(adminId, adminUpdate);
            return ResponseEntity.ok(updatedAdmin);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary="비밀번호 변경", description="관리자의 비밀번호를 변경합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode="200", description="비밀번호 변경 성공"),
        @ApiResponse(responseCode="404", description="관리자를 찾을 수 없음"),
        @ApiResponse(responseCode="400", description="잘못된 요청")
    })
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
        @Parameter(description="JWT 인증 토큰(Bearer prefix 포함)", required=true)
        @RequestHeader("Authorization") String authHeader,
        @RequestBody Map<String, String> passwordRequest) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String loginId = jwtUtil.getLoginIdFromToken(token);
            String currentPassword = passwordRequest.get("currentPassword");
            String newPassword = passwordRequest.get("newPassword");
            
            adminService.changePassword(loginId, currentPassword, newPassword);
            return ResponseEntity.ok("비밀번호가 성공적으로 변경되었습니다.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

}
