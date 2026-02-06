package sentinel.fraud

# Sentinel Mosaic - Transaction Governance Policies
# Enforced via Open Policy Agent (OPA)

default allow_transaction = false

# Allow transactions that pass all checks
allow_transaction {
    not high_value_without_approval
    not international_without_mfa
    not sanctioned_country
    not velocity_exceeded
}

# Block high-value transactions without prior approval
high_value_without_approval {
    input.transaction.amount > 10000
    not input.transaction.pre_approved
}

# Require MFA for international transactions over $500
international_without_mfa {
    input.transaction.country != "US"
    input.transaction.amount > 500
    not input.session.mfa_verified
}

# Block transactions to sanctioned countries
sanctioned_country {
    sanctioned_countries[input.transaction.country]
}

sanctioned_countries := {"KP", "IR", "SY", "CU", "VE"}

# Block if more than 5 transactions in 10 minutes
velocity_exceeded {
    input.account.recent_transaction_count > 5
    input.account.recent_window_minutes <= 10
}

# Risk scoring policy
risk_level = "critical" {
    input.transaction.risk_score > 0.8
}

risk_level = "high" {
    input.transaction.risk_score > 0.6
    input.transaction.risk_score <= 0.8
}

risk_level = "medium" {
    input.transaction.risk_score > 0.3
    input.transaction.risk_score <= 0.6
}

risk_level = "low" {
    input.transaction.risk_score <= 0.3
}

# Violation messages for dashboard display
violations[msg] {
    high_value_without_approval
    msg := sprintf("High-value transaction ($%.2f) requires pre-approval", [input.transaction.amount])
}

violations[msg] {
    international_without_mfa
    msg := sprintf("International transaction to %s requires MFA verification", [input.transaction.country])
}

violations[msg] {
    sanctioned_country
    msg := sprintf("Transaction to sanctioned country: %s", [input.transaction.country])
}

violations[msg] {
    velocity_exceeded
    msg := sprintf("Velocity limit exceeded: %d transactions in %d minutes", [input.account.recent_transaction_count, input.account.recent_window_minutes])
}
