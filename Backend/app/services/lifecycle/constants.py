"""Lifecycle stage definitions and static action templates."""

LIFECYCLE_STAGES = [
    {"id": "protect", "label": "Protect", "priority": 1},
    {"id": "renew", "label": "Renew", "priority": 2},
    {"id": "adopt", "label": "Adopt", "priority": 3},
    {"id": "expand", "label": "Expand", "priority": 4},
    {"id": "activate", "label": "Activate", "priority": 5},
]

STAGE_LABELS = {s["id"]: s["label"] for s in LIFECYCLE_STAGES}
STAGE_PRIORITY = {s["id"]: s["priority"] for s in LIFECYCLE_STAGES}

ACTION_BY_STAGE = {
    "protect": "Executive escalation review + P1 support sync",
    "renew": "Send early renewal proposal + schedule QBR",
    "adopt": "Partner check-in + PS engagement for lagging deployment",
    "expand": "Present {expand_product} expansion package",
    "activate": "Kickoff deployment workshop + assign onboarding CSM",
}

DUE_BY_STAGE = {
    "protect": "Today",
    "renew": "This week",
    "adopt": "Within 5 days",
    "expand": "This week",
    "activate": "Within 3 days",
}

CHANNEL_BY_STAGE = {
    "protect": "call",
    "renew": "email",
    "adopt": "message",
    "expand": "email",
    "activate": "call",
}

CHANNEL_LABEL = {"call": "Call", "message": "Message", "email": "Mail"}

CHANNEL_REASON = {
    "protect": "Voice call is recommended for urgent at-risk accounts — enables executive escalation and real-time issue resolution.",
    "renew": "Email is recommended for renewal — allows sharing formal proposals, ROI reports, and QBR scheduling links.",
    "adopt": "WhatsApp message is recommended for adoption gaps — quick, low-friction check-in with deployment partners.",
    "expand": "Email is recommended for expansion — best channel to deliver product packages, case studies, and custom quotes.",
    "activate": "Call is recommended for new accounts — live kickoff accelerates deployment in the critical first 90 days.",
}

EXPAND_PRODUCT = {
    "zscaler": "DLP",
    "adobe": "Adobe Sign",
    "crowdstrike": "Cloud Security",
    "default": "Premium Add-on",
}

AGENT_ACTIONS = {
    "protect": [
        "Review open P1/P2 support tickets with account team",
        "Schedule executive sponsor call within 48 hours",
        "Deploy retention playbook and document remediation plan",
    ],
    "renew": [
        "Validate renewal criteria and prepare early-renewal quote",
        "Schedule QBR with economic buyer",
        "Share ROI summary and product adoption report",
    ],
    "adopt": [
        "Check with deployment partner for blockers",
        "Engage Professional Services for {product} deployment",
        "Set 45-day re-check milestone with customer",
    ],
    "expand": [
        "Share product ROI case study for expansion SKU",
        "Schedule discovery call for add-on requirements",
        "Prepare custom expansion proposal",
    ],
    "activate": [
        "Send onboarding welcome kit and deployment checklist",
        "Schedule kickoff call with IT and security teams",
        "Assign dedicated CSM for first 90 days",
    ],
}

ASSET_MAP = {
    "zscaler": [
        {"label": "ZPA Deployment Guide", "type": "guide"},
        {"label": "ZDX Onboarding Kit", "type": "kit"},
        {"label": "Partner Email Draft", "type": "template"},
    ],
    "adobe": [
        {"label": "Creative Cloud Rollout Guide", "type": "guide"},
        {"label": "Admin Console Setup Kit", "type": "kit"},
        {"label": "Adoption Email Template", "type": "template"},
    ],
    "crowdstrike": [
        {"label": "Falcon Deployment Guide", "type": "guide"},
        {"label": "Endpoint Onboarding Kit", "type": "kit"},
        {"label": "SOC Handoff Template", "type": "template"},
    ],
    "default": [
        {"label": "Deployment Guide", "type": "guide"},
        {"label": "Onboarding Kit", "type": "kit"},
        {"label": "Partner Email Draft", "type": "template"},
    ],
}

VENDOR_CATALOGS = {
    "zscaler": [
        {"product_id": "zia", "name": "ZIA (Internet Access)", "purchased": True, "target_pct": 80},
        {"product_id": "zpa", "name": "ZPA (Private Access)", "purchased": True, "target_pct": 65},
        {"product_id": "zdx", "name": "ZDX (Digital Experience)", "purchased": False, "target_pct": 50},
        {"product_id": "dlp", "name": "DLP (Data Loss Prevention)", "purchased": False, "target_pct": 40},
    ],
    "adobe": [
        {"product_id": "cc_all", "name": "Creative Cloud All Apps", "purchased": True, "target_pct": 85},
        {"product_id": "acrobat", "name": "Acrobat Pro", "purchased": True, "target_pct": 70},
        {"product_id": "stock", "name": "Adobe Stock Credits", "purchased": False, "target_pct": 60},
        {"product_id": "sign", "name": "Adobe Sign", "purchased": False, "target_pct": 45},
    ],
    "crowdstrike": [
        {"product_id": "falcon", "name": "Falcon Platform", "purchased": True, "target_pct": 95},
        {"product_id": "identity", "name": "Identity Protection", "purchased": True, "target_pct": 70},
        {"product_id": "cloud", "name": "Cloud Security", "purchased": False, "target_pct": 55},
        {"product_id": "intel", "name": "Threat Intelligence", "purchased": False, "target_pct": 50},
    ],
    "default": [
        {"product_id": "core", "name": "Core Platform", "purchased": True, "target_pct": 80},
        {"product_id": "addon", "name": "Premium Add-on", "purchased": False, "target_pct": 60},
    ],
}
