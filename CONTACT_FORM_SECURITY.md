# Contact Form Security Enhancements

## Overview
Comprehensive security enhancements have been implemented to protect the contact form from spam, abuse, and security vulnerabilities while using the BREVO API for email delivery.

## ✅ Implemented Security Features

### 1. **Rate Limiting** ✅
- **IP-based**: 3 submissions per hour per IP address
- **Email-based**: 10 submissions per hour per email address
- **Prevents**: Spam, abuse, email bombing
- **Implementation**: Uses Django cache with 1-hour windows

### 2. **Input Sanitization** ✅
- **Backend**: All inputs sanitized using `sanitize_input()`
- **Frontend**: Real-time sanitization on user input
- **Features**:
  - Removes null bytes and control characters
  - Length validation
  - Character filtering
- **Prevents**: XSS attacks, injection attacks, buffer overflows

### 3. **Input Validation** ✅
- **Name**: Minimum 2 characters, maximum 200 characters
- **Email**: Valid email format, maximum 254 characters
- **Phone**: Maximum 20 characters (optional)
- **Subject**: Must be from allowed list
- **Message**: Minimum 10 characters, maximum 5000 characters
- **Prevents**: Invalid data, oversized inputs

### 4. **Request Size Limits** ✅
- **Maximum**: 50KB per request
- **Prevents**: DoS attacks, memory exhaustion

### 5. **Email Validation** ✅
- **Format**: Django's `validate_email()` function
- **Case**: Normalized to lowercase
- **Prevents**: Invalid email addresses, case-related issues

### 6. **Spam Detection** ✅
- **Link Detection**: Flags messages with more than 3 links
- **Pattern Matching**: Detects common spam patterns
- **Prevents**: Spam messages, phishing attempts

### 7. **Enhanced Error Handling** ✅
- **Generic Messages**: No system details revealed
- **Proper HTTP Status Codes**: 400, 413, 429, 500
- **Logging**: All errors logged with IP address
- **Prevents**: Information disclosure

### 8. **Subject Validation** ✅
- **Allowed Subjects**: 
  - admissions
  - academics
  - student-services
  - faculty
  - general
  - complaint
  - suggestion
  - other
- **Prevents**: Invalid subject manipulation

## Files Modified

### Backend
1. **`portal/views.py`**
   - Enhanced `api_contact_form()` with security features
   - Rate limiting (IP and email-based)
   - Input sanitization and validation
   - Request size limits
   - Spam detection
   - Enhanced error handling

### Frontend
1. **`src/contactuss.js`**
   - Added `sanitizeInput()` function
   - Added `validateEmail()` function
   - Real-time input sanitization
   - Client-side validation
   - Enhanced error handling for rate limits

## Security Configuration

### Rate Limiting Settings
```python
# IP-based: 3 submissions per hour
check_rate_limit(f'contact_form_{ip_address}', max_requests=3, window=3600)

# Email-based: 10 submissions per hour
check_rate_limit(f'contact_form_email_{email}', max_requests=10, window=3600)
```

### Input Limits
- **Name**: 2-200 characters
- **Email**: Valid format, max 254 characters
- **Phone**: Optional, max 20 characters
- **Subject**: Must be from allowed list, max 100 characters
- **Message**: 10-5000 characters

### Request Limits
- **Maximum Request Size**: 50KB
- **Spam Detection**: Max 3 links per message

## BREVO API Integration

The contact form uses BREVO (formerly Sendinblue) for email delivery:
- **Verification Email**: Sent to user's email with verification link
- **Contact Email**: Sent to `citycollegeofbayawan@gmail.com` after verification
- **Template Support**: Uses BREVO templates when available
- **Fallback**: Uses Django's email backend if BREVO fails

## Testing Checklist

- [ ] Test rate limiting (3 submissions per hour per IP)
- [ ] Test email-based rate limiting (10 submissions per hour)
- [ ] Test input validation (name, email, message length)
- [ ] Test email format validation
- [ ] Test subject validation (allowed subjects only)
- [ ] Test spam detection (messages with >3 links)
- [ ] Test request size limits (50KB maximum)
- [ ] Test error handling (generic messages)
- [ ] Test BREVO email delivery
- [ ] Test verification flow

## Production Deployment Notes

1. **Environment Variables**: Ensure these are set:
   - `BREVO_API_KEY`: Your BREVO API key
   - `BREVO_TEMPLATE_VERIFY_ID`: Template ID for verification emails
   - `CONTACT_INBOX`: Email address to receive contact form submissions
   - `PUBLIC_BASE_URL`: Base URL for verification links

2. **Cache Configuration**: Ensure cache is configured (see `ccb_portal_backend/settings.py`)
   - Development: Local memory cache
   - Production: Redis/Memcached recommended

3. **Monitoring**: Set up monitoring for:
   - Rate limit violations
   - Failed email deliveries
   - Spam detection triggers
   - Error rates

## Additional Recommendations

### High Priority
1. **CAPTCHA**: Consider adding reCAPTCHA for additional spam protection
2. **Honeypot Field**: Add hidden field to catch bots
3. **Email Domain Whitelist**: Optionally restrict to specific email domains

### Medium Priority
1. **Content Moderation**: Review messages before sending to admin
2. **IP Reputation**: Check IP against blacklists
3. **Geolocation**: Track submission locations

### Nice to Have
1. **Analytics**: Track submission patterns
2. **Auto-Response**: Send automated acknowledgment emails
3. **Scheduled Reviews**: Regular review of security logs

## Troubleshooting

### Rate Limited
- **IP-based**: Wait 1 hour before submitting again
- **Email-based**: Wait 1 hour or use different email address
- **Message**: Clear error message with retry time

### Email Not Received
- Check spam/junk folder
- Verify email address is correct
- Check BREVO API status
- Review server logs

### Validation Errors
- **Name**: Must be at least 2 characters
- **Email**: Must be valid email format
- **Message**: Must be at least 10 characters
- **Subject**: Must select from dropdown

## Support

For issues or questions:
1. Review error messages in form
2. Check browser console for client-side errors
3. Review Django logs for server-side errors
4. Check BREVO dashboard for email delivery status
5. Contact system administrator

---

**Status**: All security improvements implemented ✅
**Last Updated**: 2025-01-27

