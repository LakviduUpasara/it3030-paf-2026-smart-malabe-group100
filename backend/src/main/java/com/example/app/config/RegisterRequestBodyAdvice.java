package com.example.app.config;

import com.example.app.dto.auth.RegisterRequest;
import com.example.app.entity.enums.TwoFactorMethod;
import java.lang.reflect.Type;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

/**
 * Runs after JSON binding and before {@code @Valid}, so {@code preferredTwoFactorMethod} is never null when omitted.
 */
@ControllerAdvice
public class RegisterRequestBodyAdvice extends RequestBodyAdviceAdapter {

    @Override
    public boolean supports(
            MethodParameter methodParameter,
            Type targetType,
            Class<? extends HttpMessageConverter<?>> converterType) {
        return RegisterRequest.class.isAssignableFrom(methodParameter.getParameterType());
    }

    @Override
    public Object afterBodyRead(
            Object body,
            HttpInputMessage inputMessage,
            MethodParameter parameter,
            Type targetType,
            Class<? extends HttpMessageConverter<?>> converterType) {
        RegisterRequest req = (RegisterRequest) body;
        if (req.getPreferredTwoFactorMethod() == null) {
            req.setPreferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP);
        }
        return req;
    }
}
