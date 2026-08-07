package com.zoop.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.zoop.backend.domain.dto.CompanyDto;
import com.zoop.backend.domain.entity.Company;
import com.zoop.backend.service.CompanyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name="CompanyController", description="회사 정보 관련 API")
@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService service;

    public CompanyController(CompanyService service) {
        this.service = service;
    }

    @Operation(summary="회사 정보 등록", description="새로운 회사 정보를 시스템에 등록합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode="200", description="회사 정보 등록 성공 및 등록된 회사 정보 반환",
            content=@Content(schema=@Schema(implementation=Company.class))),
        @ApiResponse(responseCode="400", description="잘못된 요청(예: 필수 필드 누락 등)")
    })
    @PostMapping
    public ResponseEntity<?> registerCompany(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "등록할 회사 정보 (CompanyDto 형식)",
            required = true,
            content = @Content(schema = @Schema(implementation = CompanyDto.class))
        )
        @RequestBody CompanyDto dto) {
        System.out.println("✅ 회사 등록 요청 수신");
        System.out.println(" - 사업자번호: " + dto.getBusinessNumber());
        System.out.println(" - 회사명: " + dto.getCompanyName());
        System.out.println(" - 대표자명: " + dto.getCeoName());
        System.out.println(" - 주소: " + dto.getCompanyAddress());

        Company company = new Company();
        company.setBusinessNumber(dto.getBusinessNumber());
        company.setCompanyName(dto.getCompanyName());
        company.setCeoName(dto.getCeoName());
        company.setCompanyAddress(dto.getCompanyAddress());

        Company saved = service.saveCompany(company);
        return ResponseEntity.ok(Map.of("companyId", saved.getCompanyId()));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<?> getCompanyById(@PathVariable Long companyId) {
        Company company = service.getCompanyById(companyId);
        if (company == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(company);
    }

    @Operation(summary="회사 정보 수정", description="기존 회사 정보를 수정합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode="200", description="회사 정보 수정 성공",
            content=@Content(schema=@Schema(implementation=Company.class))),
        @ApiResponse(responseCode="404", description="회사를 찾을 수 없음"),
        @ApiResponse(responseCode="400", description="잘못된 요청")
    })
    @PutMapping("/{companyId}")
    public ResponseEntity<?> updateCompany(
        @Parameter(description="수정할 회사의 ID", required=true, example="1")
        @PathVariable Long companyId,
        @RequestBody CompanyDto dto) {
        try {
            Company updatedCompany = service.updateCompany(companyId, dto);
            return ResponseEntity.ok(updatedCompany);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
