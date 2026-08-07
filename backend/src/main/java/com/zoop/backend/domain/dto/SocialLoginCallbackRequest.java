package com.zoop.backend.domain.dto;


public class SocialLoginCallbackRequest {
    private String code;
    private String state; // 필요시 소셜 서비스에서 state 값을 함께 보낼 수 있습니다.
    private String pkceCodeVerifier;

    // Lombok을 사용하지 않는 경우 getter 및 setter 수동 작성
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPkceCodeVerifier() {
        return pkceCodeVerifier;
    }

    public void setPkceCodeVerifier(String pkceCodeVerifier) {
        this.pkceCodeVerifier = pkceCodeVerifier;
    }
}
