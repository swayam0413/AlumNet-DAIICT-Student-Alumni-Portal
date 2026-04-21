# Security Specification - AlumConnect

## Data Invariants
1. A student cannot send more than one connection request to the same alumnus if status is pending.
2. Only alumni can post jobs.
3. Students can only see alumni in the directory (not other students).
4. Mentorship status can only be updated by the mentor or the system.
5. Admin roles cannot be self-assigned.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Self-Promotion**: Create user profile with `role: 'admin'`.
2. **Shadow Update**: Update user profile with extra field `isVerified: true`.
3. **Identity Spoofing**: Create a job post with `posted_by` set to someone else's UID.
4. **Ghost Connection**: Create a connection between two UIDs that don't exist.
5. **State Skipping**: Update mentorship status from `pending` directly to `completed`.
6. **Denial of Wallet**: Create a user profile with a 2MB `name` string.
7. **Bypass Lock**: Update a `closed` job post's title.
8. **PII Leak**: Read another user's PII (if not public).
9. **Orphan Application**: Create an application for a `jobId` that doesn't exist.
10. **Query Scrape**: Run `allow list` without `where` filters.
11. **Spoofed Email**: Use `request.auth.token.email` without `email_verified == true`.
12. **Malicious ID**: Create a document with ID `../../etc/passwd`.

## Test Runner logic will be implemented in `firestore.rules.test.ts`
