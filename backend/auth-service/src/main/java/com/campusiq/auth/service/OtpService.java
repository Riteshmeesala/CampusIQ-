package com.campusiq.auth.service;

import com.campusiq.auth.entity.User;
import com.campusiq.auth.repository.UserRepository;
import com.campusiq.common.exception.BadRequestException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);

    private final UserRepository userRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${app.otp.length:6}")
    private int otpLength;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.mail.from:noreply@campusiq.com}")
    private String fromEmail;

    public OtpService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void generateAndSendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found with email: " + email));

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        userRepository.save(user);

        boolean hasCredentials = mailUsername != null && !mailUsername.isBlank() && mailPassword != null && !mailPassword.isBlank();
        if (mailSender != null && hasCredentials) {
            sendOtpEmail(email, user.getName(), otp);
        } else {
            log.info("JavaMailSender not configured with credentials. Instant-Sync OTP for {} is: {}", email, otp);
        }
        log.info("OTP generated for user: {}", email);
    }

    public String generateRegistrationOtp() {
        return generateOtp();
    }

    public int getOtpExpiryMinutes() {
        return otpExpiryMinutes;
    }

    public boolean sendRegistrationOtpEmail(String toEmail, String studentName, String otp) {
        boolean sent = false;
        boolean hasCredentials = mailUsername != null && !mailUsername.isBlank() && mailPassword != null && !mailPassword.isBlank();
        if (mailSender != null && hasCredentials) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(toEmail);
                helper.setSubject("VVITU ERP / CampusIQ+ - Student Registration OTP");
                String displayName = (studentName != null && !studentName.isBlank()) ? studentName : "Student";
                String body = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;'>"
                        + "<div style='text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;'>"
                        + "<h2 style='color: #1e3a8a; margin: 0;'>VVITU ERP / CampusIQ+</h2>"
                        + "<p style='color: #64748b; margin: 5px 0 0 0; font-size: 13px;'>Official Student Account Registration Verification</p>"
                        + "</div>"
                        + "<p>Dear <strong>" + displayName + "</strong>,</p>"
                        + "<p>Your official student verification code for activating your VVITU student portal account is:</p>"
                        + "<div style='text-align: center; margin: 25px 0;'>"
                        + "<span style='display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #93c5fd;'>"
                        + otp + "</span>"
                        + "</div>"
                        + "<p style='color: #475569; font-size: 14px;'>This OTP is valid for <strong>" + otpExpiryMinutes + " minutes</strong> and can only be used once. Do not share this code with anyone.</p>"
                        + "<p style='color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;'>"
                        + "Vasireddy Venkatadri Institute of Technology | Academic Student Portal"
                        + "</p>"
                        + "</body></html>";
                helper.setText(body, true);
                mailSender.send(message);
                log.info("Sent student registration OTP email to {}", toEmail);
                sent = true;
            } catch (Exception e) {
                log.error("Failed to send student registration OTP email to {}: {}. Will use Instant-Sync OTP fallback.", toEmail, e.getMessage());
            }
        }
        
        if (!sent) {
            log.info("=== [INSTANT-SYNC OTP] STUDENT REGISTRATION OTP for {} ({}): {} (Valid for {} minutes) ===", 
                    toEmail, studentName, otp, otpExpiryMinutes);
        }
        return sent;
    }

    @Transactional
    public boolean verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found with email: " + email));

        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new BadRequestException("No OTP found. Please request a new OTP.");
        }
        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            clearOtp(user);
            throw new BadRequestException("OTP has expired. Please request a new OTP.");
        }
        if (!user.getOtpCode().equals(otp)) {
            throw new BadRequestException("Invalid OTP.");
        }
        clearOtp(user);
        userRepository.save(user);
        return true;
    }

    private void clearOtp(User user) {
        user.setOtpCode(null);
        user.setOtpExpiry(null);
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < otpLength; i++) sb.append(random.nextInt(10));
        return sb.toString();
    }

    private void sendOtpEmail(String to, String name, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("CampusIQ+ - Your OTP for Login");
            helper.setText("<html><body><h2>Your OTP: <b>" + otp + "</b></h2><p>Valid for "
                    + otpExpiryMinutes + " minutes.</p></body></html>", true);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", to, e.getMessage());
        }
    }
}
