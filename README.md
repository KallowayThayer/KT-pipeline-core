Kalloway & Thayer Systems — Enterprise Ingestion Middleware

Production-grade, asynchronous ingestion and payload normalization middleware built for high-performance home service contractors and trade CRM synchronization (ServiceTitan & Jobber).

Key Metrics & Specifications

Execution Speed: Sub-5ms transient memory ingestion.

Deduplication: Dual DJB2 & FNV-1a fingerprinting with in-memory batch tracking and sliding-window ledger TTLs.

Compliance: Built-in TCPA consent verification, TrustedForm URL parsing, and Jornaya Lead ID capture.

Safety: Automatic PII masking in DLQ quarantine envelopes and strict spam/profanity boundary filtering.

Usage Example

Send an unformatted inbound webhook from any lead source or form builder:

{
  "first_name": "JOHN",
  "last_name": "DOE",
  "phone": "(555) 123-4567 ext. 42",
  "email": "john.doe@EXAMPLE.COM",
  "address": "123 Main Street, Suite 400, Austin, TX 78701",
  "service": "emergency AC repair not cooling",
  "tcpa_consent": "true"
}


The pipeline normalizes, sanitizes, and outputs a pristine, CRM-ready payload:

{
  "json": {
    "first_name": "John",
    "last_name": "Doe",
    "formatted_phone": "+15551234567",
    "phone_extension": "42",
    "clean_email": "john.doe@example.com",
    "is_phone_valid": true,
    "trade_category": "HVAC",
    "address_object": {
      "street": "123 Main Street Suite 400",
      "city": "Austin",
      "state": "TX",
      "zip": "78701",
      "country": "USA",
      "parse_status": "PARSED_STRUCTURED"
    },
    "compliance_record": {
      "tcpa_opt_in": true,
      "ip_address": "Not Provided"
    },
    "status": "Ready for Target Injection"
  }
}


Architecture

For complete integration guides, schema specifications, and adapter configuration rules, visit kallowaythayer.com/docs.

Operated strictly as an asynchronous engineering consultancy. No synchronous sales calls.
