# Split Sheet App - Data Retention Policy

## Overview
This policy governs how long we retain different types of user data in compliance with GDPR, CCPA, and music industry requirements. Our approach balances privacy protection with the long-term legal requirements of music industry contracts and royalty management.

## Retention Categories

### 🔄 Permanent / Life of Copyright + 10 Years
**Data Types:**
- **Split Sheet Records** (songId, status, clauses, totalPercentage, version)
- **Contributor Legal Details** (legalName, stageName, role, percentage, proAffiliation, ipiNumber, publisher)
- **Signature Data** (signatureData, signedAt, ipAddress, consentText, deviceInfo)
- **Audit Log Entries** (action, performedBy, timestamp, oldValue, newValue)
- **IP Numbers and Publisher Information**

**Legal Rationale:** These are legally binding contractual documents that can generate royalties for 50+ years. Disputes can arise decades later in the music industry. Regulatory bodies (PROs, copyright offices) may require historical records.

### 📅 7-10 Years Post-Activity
**Data Types:**
- **Financial and payment-related logs** (royalty calculations, payment history)
- **Tax reporting information** (1099 records, withholding data)
- **Contributor Contact Information** (email, phone, address) - if not anonymized
- **Performance tracking data** (usage statistics for royalty calculations)

**Legal Rationale:** Aligns with IRS requirements (7 years for tax records) and financial audit standards (10 years for business records).

### ⏰ 30-90 Days Post-User Deletion Request
**Data Types:**
- **Purely Personal User/Profile Data** (email, username, bio, avatar, personal preferences)
- **Login activity logs** (session data, authentication attempts)
- **Session tokens and device information**

**Legal Rationale:** Complies with "right to be forgotten" (GDPR Art. 17) while maintaining business data integrity through soft delete.

### 🕐 Account Inactivity Policy
**Policy:** Accounts marked for deletion after **1 year of inactivity**
- **Warning Timeline:** 
  - 30 days before inactivity deadline: First warning email
  - 7 days before inactivity deadline: Final warning email  
  - 1 day before inactivity deadline: Critical notice
- **Soft Delete:** After 1 year, account marked `deletedAt` with 90-day retention period
- **Data Preservation:** Legal split sheet data preserved indefinitely

**Business Rationale:** Artists and producers often work intermittently on projects. 1-year window respects creative work patterns while preventing permanent account loss due to extended breaks.

## Implementation Details

### Soft Delete Process
1. **User Request** or **System Detection** (inactivity)
2. **Account Marked** `deletedAt` with anonymization
3. **Data Classification:** Personal data cleared, legal data preserved
4. **Retained Data:** Split sheets, signatures, audit logs kept for compliance
5. **Complete Removal:** Personal data purged after 90-day retention period

### Data Anonymization Strategy
**Security Best Practices Applied:**
- **Deleted User Identifiers:** `Deleted User [8-CHAR-RANDOM-ID]`
- **Email/Username:** Set to `null` (complete removal)
- **PII Fields:** All personal identifying information cleared
- **Audit Trail:** Deletion action logged with timestamp and reason

### Data Export Rights
**"Right to Access" Implementation:**
Users can export all their data at any time via account settings:
- Complete split sheet history with all versions
- All electronic signatures and agreements
- Contributor information and contract details  
- Audit logs showing all account activity
- Data provided in machine-readable JSON format

### Compliance Features
**GDPR Compliance:**
- Right to Access (Data Export API)
- Right to Rectification (Update before deletion)
- Right to Erasure (Soft delete + timed purging)
- Right to Portability (Structured data export)
- Right to Object (Automated deletion processing)

**Legal Traceability:**
- **Permanent Audit Trail:** All actions logged with user attribution
- **Contract Preservation:** Signatures and split sheets maintained for legal periods
- **Forensic Data:** IP addresses, timestamps, device info for dispute resolution
- **Role-based Access:** Admin permissions for legal data access

## Data Retention Schedule

### Automated Cleanup Process
- **Weekly Job:** Identify expired personal data for deletion
- **Monthly Review:** Audit retention policy compliance
- **Annual Policy Review:** Legal review of retention periods
- **Immediate Actions:** Legal requests handled within 48 hours

### Contact Information
**Data Protection Inquiries:**
- Email: privacy@split-sheet-app.com
- Response Time: Within 7 business days
- Legal Basis: GDPR Art. 6, CCPA 1798.150

**Legal Compliance Questions:**
- Email: legal@split-sheet-app.com  
- Attorney Review: Available for enterprise customers
- Emergency Data Requests: Available 24/7 for legal warrants

## Policy Review and Updates

### Regular Review Schedule
- **Annual Legal Review:** Required by privacy regulations
- **Market Expansion:** Immediate review before entering new jurisdictions
- **Regulatory Changes:** Immediate implementation upon new laws
- **User Feedback:** Quarterly review of privacy impact assessments

### Update Notifications
- **30 Days Notice:** Major policy changes affecting user rights
- **Email Notifications:** All policy updates sent to registered users
- **Website Updates:** Current policy always available at `/privacy-policy`
- **API Access:** Programmatic access to latest policy version

## Technical Implementation

### Database Schema
```sql
-- Users with soft delete protection
SELECT * FROM "User" WHERE "deleted_at" IS NULL;

-- Audit trails preserved indefinitely  
SELECT * FROM "AuditLog" WHERE "splitSheetId" = 'xxx';

-- Data retention tracking
SELECT * FROM "DataRetentionPolicy" WHERE "isActive" = true;
```

### API Endpoints
- `GET /api/profiles/export-data` - User data export
- `POST /api/profiles/delete-account` - Account deletion with soft delete
- `POST /api/admin/check-inactivity` - Inactivity monitoring
- `GET /api/retention-policy` - Current policy access

### Security Measures
- **Access Logging:** All data access logged with user attribution
- **Encryption:** Personal data encrypted at rest and in transit
- **Role-Based Access:** Minimum privilege principle enforced
- **Audit Trails:** Immutable logs with cryptographic integrity

## Last Updated
**Version:** 1.0  
**Date:** February 7, 2026  
**Next Review:** February 7, 2027  
**Legal Review:** Required annually or per regulatory change

---

This policy is legally binding and governs all data processing activities. By using our service, you agree to these retention periods and our commitment to protecting your privacy while maintaining music industry compliance.